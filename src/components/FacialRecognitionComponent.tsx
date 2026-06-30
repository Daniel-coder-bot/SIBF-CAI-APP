
"use client";

import React, { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';
import { Loader2, Camera, CheckCircle2, AlertCircle, UserCheck, RefreshCw } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface FacialRecognitionProps {
  mode: 'enroll' | 'recognize';
  onCapture?: (descriptor: number[]) => void;
  onRecognized?: (label: string) => void;
  labeledDescriptors?: Array<{ label: string; descriptor: number[] }>;
}

export function FacialRecognitionComponent({ mode, onCapture, onRecognized, labeledDescriptors }: FacialRecognitionProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();
  
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detection, setDetection] = useState<any>(null);
  const [capturedDescriptor, setCapturedDescriptor] = useState<number[] | null>(null);
  const [matcher, setMatcher] = useState<faceapi.FaceMatcher | null>(null);
  
  const [showSuccessFlash, setShowSuccessFlash] = useState(false);
  const [lastRecognizedId, setLastRecognizedId] = useState<string | null>(null);
  const cooldownRef = useRef<NodeJS.Timeout | null>(null);
  
  // Estado para controlar la cámara activa (frontal o trasera)
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');

  useEffect(() => {
    const loadModels = async () => {
      try {
        const MODEL_URL = '/models'; 
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
        ]);
        setIsLoaded(true);
      } catch (err) {
        console.error("Error loading models:", err);
        setError("No se pudieron cargar los modelos de IA. Asegúrate de que estén en /public/models");
      }
    };

    loadModels();

    return () => {
      stopVideo();
      if (cooldownRef.current) clearTimeout(cooldownRef.current);
    };
  }, []);

  // Efecto para iniciar o cambiar la cámara
  useEffect(() => {
    if (isLoaded) {
      startVideo();
    }
  }, [facingMode, isLoaded]);

  const stopVideo = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
  };

  const startVideo = () => {
    stopVideo();
    navigator.mediaDevices.getUserMedia({ 
      video: { 
        facingMode: facingMode,
        width: { ideal: 1280 },
        height: { ideal: 720 }
      } 
    })
      .then(stream => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch(err => {
        console.error("Camera error:", err);
        setError("No se pudo acceder a la cámara. Verifique los permisos.");
      });
  };

  const toggleCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  useEffect(() => {
    if (mode === 'recognize' && labeledDescriptors && labeledDescriptors.length > 0) {
      const labeledFaceDescriptors = labeledDescriptors.map(ld => {
        return new faceapi.LabeledFaceDescriptors(
          ld.label,
          [new Float32Array(ld.descriptor)]
        );
      });
      // Umbral de 0.45 para mayor precisión (menor es más estricto)
      setMatcher(new faceapi.FaceMatcher(labeledFaceDescriptors, 0.45));
    }
  }, [mode, labeledDescriptors]);

  const handleVideoPlay = () => {
    if (!videoRef.current || !canvasRef.current || !isLoaded) return;

    const displaySize = { 
      width: videoRef.current.videoWidth, 
      height: videoRef.current.videoHeight 
    };
    faceapi.matchDimensions(canvasRef.current, displaySize);

    const interval = setInterval(async () => {
      if (!videoRef.current || !canvasRef.current) return;

      const results = await faceapi
        .detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptors();

      const resizedResults = faceapi.resizeResults(results, displaySize);
      
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (results.length > 0) {
        setDetection(results[0]);
        
        resizedResults.forEach(result => {
          const { detection, descriptor } = result;
          
          if (mode === 'recognize' && matcher) {
            const bestMatch = matcher.findBestMatch(descriptor);
            
            if (bestMatch.label !== 'unknown') {
              if (lastRecognizedId !== bestMatch.label) {
                setLastRecognizedId(bestMatch.label);
                setShowSuccessFlash(true);
                
                if (onRecognized) {
                  onRecognized(bestMatch.label);
                }

                // Mantener el overlay visual por 2 segundos
                setTimeout(() => setShowSuccessFlash(false), 2000);
                
                if (cooldownRef.current) clearTimeout(cooldownRef.current);
                cooldownRef.current = setTimeout(() => {
                  setLastRecognizedId(null);
                }, 4000);
              }
              
              // Dibujar cuadro de seguimiento (verde sólido para éxito)
              const drawBox = new faceapi.draw.DrawBox(detection.box, { 
                label: 'Identificado', 
                boxColor: 'rgba(34, 197, 94, 1)', 
                lineWidth: 4 
              });
              drawBox.draw(canvas);
            } else {
              // Dibujar cuadro de seguimiento (rojo tenue para desconocido)
              const drawBox = new faceapi.draw.DrawBox(detection.box, { 
                label: 'Analizando...', 
                boxColor: 'rgba(239, 68, 68, 0.5)', 
                lineWidth: 2 
              });
              drawBox.draw(canvas);
            }
          } else {
            // Modo captura
            const drawBox = new faceapi.draw.DrawBox(detection.box, { 
              label: mode === 'enroll' ? 'Posiciona tu rostro' : 'Detectando...',
              boxColor: 'rgba(255, 31, 45, 1)', 
              lineWidth: 2
            });
            drawBox.draw(canvas);
          }
        });
      } else {
        setDetection(null);
      }
    }, 150);

    return () => clearInterval(interval);
  };

  const captureEnrollment = () => {
    if (detection && onCapture) {
      const descriptorArray = Array.from(detection.descriptor);
      setCapturedDescriptor(descriptorArray);
      onCapture(descriptorArray);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {!isLoaded && (
        <div className="flex flex-col items-center py-10 gap-2">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="font-bold text-sm text-muted-foreground">Iniciando Biometría AI...</p>
        </div>
      )}

      {error && (
        <Alert variant="destructive" className="rounded-2xl">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error de Cámara</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className={cn("relative rounded-3xl overflow-hidden border-4 border-slate-900 shadow-2xl bg-black aspect-video w-full", !isLoaded && "hidden")}>
        <video 
          ref={videoRef} 
          autoPlay 
          muted 
          onPlay={handleVideoPlay}
          playsInline
          className="w-full h-full object-cover"
        />
        <canvas 
          ref={canvasRef} 
          className="absolute top-0 left-0 w-full h-full pointer-events-none" 
        />
        
        {/* Rectángulo característico de éxito en Reconocimiento */}
        {mode === 'recognize' && showSuccessFlash && (
          <div className="absolute inset-0 bg-green-600/40 backdrop-blur-md flex items-center justify-center animate-in fade-in zoom-in duration-300 z-50">
             <div className="text-white text-center p-8 rounded-[2.5rem] bg-black/20 border border-white/20 shadow-2xl scale-110">
               <UserCheck className="w-24 h-24 mx-auto mb-4 text-white drop-shadow-lg" />
               <p className="text-sm font-black uppercase tracking-[0.2em] opacity-80 mb-1">Asistencia Registrada</p>
               <h2 className="text-4xl font-black uppercase tracking-tighter text-white drop-shadow-md">
                 {lastRecognizedId}
               </h2>
               <div className="mt-4 bg-white/20 px-6 py-2 rounded-full inline-flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Identidad Validada</span>
               </div>
             </div>
          </div>
        )}

        {/* Botón de cambio de cámara */}
        <div className="absolute top-4 right-4 z-30">
          <Button 
            variant="secondary" 
            size="icon" 
            onClick={toggleCamera}
            className="rounded-full bg-white/20 backdrop-blur-md hover:bg-white/40 border border-white/20 text-white w-12 h-12"
            title="Cambiar Cámara"
          >
            <RefreshCw className="w-6 h-6" />
          </Button>
        </div>

        {mode === 'enroll' && detection && !capturedDescriptor && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
            <Button 
              onClick={captureEnrollment}
              className="bg-primary hover:bg-accent text-white rounded-full px-8 py-6 font-bold shadow-xl animate-bounce"
            >
              <Camera className="w-5 h-5 mr-2" />
              Capturar Rostro
            </Button>
          </div>
        )}

        {/* Rectángulo característico de éxito en Captura/Registro */}
        {mode === 'enroll' && capturedDescriptor && (
          <div className="absolute inset-0 bg-green-600/40 backdrop-blur-sm flex items-center justify-center animate-in fade-in zoom-in duration-300 z-50">
             <div className="text-white text-center p-8 rounded-[2.5rem] bg-black/20 border border-white/20 shadow-2xl">
               <CheckCircle2 className="w-20 h-20 mx-auto mb-4" />
               <p className="text-3xl font-black uppercase tracking-tighter">¡Capturado!</p>
               <p className="text-xs font-bold opacity-80 uppercase tracking-widest">Biometría guardada correctamente</p>
             </div>
          </div>
        )}
      </div>

      <div className="w-full bg-slate-50 p-4 rounded-2xl border border-dashed text-center flex flex-col items-center gap-1">
        <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">
          {mode === 'enroll' ? 'Modo: Enrolamiento de Alumno' : 'Modo: Identificación en tiempo real'}
        </p>
        <p className="text-[9px] font-bold text-slate-400 uppercase">
          Cámara actual: {facingMode === 'user' ? 'Frontal (Selfie)' : 'Trasera (Principal)'}
        </p>
      </div>
    </div>
  );
}
