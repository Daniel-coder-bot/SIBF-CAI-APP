
"use client";

import React, { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';
import { Loader2, Camera, CheckCircle2, AlertCircle, UserCheck, RefreshCw, Cpu } from 'lucide-react';
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
  const [isInitializing, setIsInitializing] = useState(true);
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
      setIsInitializing(true);
      try {
        const MODEL_URL = '/models'; 
        // Carga paralela de modelos para máxima velocidad
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
        ]);
        setIsLoaded(true);
        setIsInitializing(false);
      } catch (err) {
        console.error("Error loading models:", err);
        setError("Error al cargar motor de IA. Verifique su conexión.");
        setIsInitializing(false);
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
        height: { ideal: 720 },
        frameRate: { ideal: 30 }
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

    // Intervalo optimizado a 100ms para una respuesta visual instantánea
    const interval = setInterval(async () => {
      if (!videoRef.current || !canvasRef.current) return;

      const results = await faceapi
        .detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions({
          inputSize: 160, // Tamaño optimizado para velocidad
          scoreThreshold: 0.5
        }))
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
            // Modo captura: Recuadro rojo institucional
            const drawBox = new faceapi.draw.DrawBox(detection.box, { 
              label: mode === 'enroll' ? 'LISTO PARA CAPTURAR' : 'DETECCIÓN ACTIVA',
              boxColor: 'rgba(255, 31, 45, 1)', 
              lineWidth: 3
            });
            drawBox.draw(canvas);
          }
        });
      } else {
        setDetection(null);
      }
    }, 100);

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
      {isInitializing && (
        <div className="flex flex-col items-center py-12 gap-4 animate-in fade-in duration-500">
          <div className="relative">
            <Loader2 className="w-16 h-16 animate-spin text-primary" />
            <Cpu className="w-6 h-6 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-50" />
          </div>
          <div className="text-center">
            <p className="font-black text-slate-900 uppercase tracking-tight text-lg">Iniciando Biometría AI</p>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Calibrando sensores de reconocimiento facial...</p>
          </div>
        </div>
      )}

      {error && (
        <Alert variant="destructive" className="rounded-2xl border-2">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle className="font-bold">Error de Sistema</AlertTitle>
          <AlertDescription className="font-medium text-xs">{error}</AlertDescription>
        </Alert>
      )}

      <div className={cn(
        "relative rounded-[2rem] overflow-hidden border-4 border-slate-900 shadow-2xl bg-black aspect-video w-full transition-all duration-700", 
        (isInitializing || !isLoaded) ? "opacity-0 scale-95" : "opacity-100 scale-100"
      )}>
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
        {!isInitializing && (
          <div className="absolute top-4 right-4 z-30">
            <Button 
              variant="secondary" 
              size="icon" 
              onClick={toggleCamera}
              className="rounded-full bg-white/20 backdrop-blur-md hover:bg-white/40 border border-white/20 text-white w-12 h-12 shadow-lg"
              title="Cambiar Cámara"
            >
              <RefreshCw className="w-6 h-6" />
            </Button>
          </div>
        )}

        {mode === 'enroll' && detection && !capturedDescriptor && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
            <Button 
              onClick={captureEnrollment}
              className="bg-primary hover:bg-accent text-white rounded-full px-10 py-7 font-black shadow-2xl animate-bounce uppercase tracking-widest text-[10px]"
            >
              <Camera className="w-6 h-6 mr-3" />
              Capturar Perfil Biométrico
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

      {!isInitializing && (
        <div className="w-full bg-slate-50 p-4 rounded-2xl border border-dashed text-center flex flex-col items-center gap-1 shadow-inner">
          <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            {mode === 'enroll' ? 'MODO: ALTA DE NUEVO ALUMNO' : 'MODO: IDENTIFICACIÓN INSTITUCIONAL'}
          </p>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">
            Lente: {facingMode === 'user' ? 'Frontal / Selfie' : 'Trasera / Principal'} • Motor AI Activo
          </p>
        </div>
      )}
    </div>
  );
}
