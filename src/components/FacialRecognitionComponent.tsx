
"use client";

import React, { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';
import { Loader2, Camera, CheckCircle2, AlertCircle, UserCheck } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface FacialRecognitionProps {
  mode: 'enroll' | 'recognize';
  onCapture?: (descriptor: number[]) => void;
  labeledDescriptors?: Array<{ label: string; descriptor: number[] }>;
}

export function FacialRecognitionComponent({ mode, onCapture, labeledDescriptors }: FacialRecognitionProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();
  
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detection, setDetection] = useState<any>(null);
  const [capturedDescriptor, setCapturedDescriptor] = useState<number[] | null>(null);
  const [matcher, setMatcher] = useState<faceapi.FaceMatcher | null>(null);
  
  // Estado para el feedback visual (destello blanco)
  const [showSuccessFlash, setShowSuccessFlash] = useState(false);
  const [lastRecognizedId, setLastRecognizedId] = useState<string | null>(null);
  const cooldownRef = useRef<NodeJS.Timeout | null>(null);

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
        startVideo();
      } catch (err) {
        console.error("Error loading models:", err);
        setError("No se pudieron cargar los modelos de IA. Asegúrate de que estén en /public/models");
      }
    };

    const startVideo = () => {
      navigator.mediaDevices.getUserMedia({ video: {} })
        .then(stream => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch(err => {
          console.error("Camera error:", err);
          setError("No se pudo acceder a la cámara.");
        });
    };

    loadModels();

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
      if (cooldownRef.current) clearTimeout(cooldownRef.current);
    };
  }, []);

  useEffect(() => {
    if (mode === 'recognize' && labeledDescriptors && labeledDescriptors.length > 0) {
      const labeledFaceDescriptors = labeledDescriptors.map(ld => {
        return new faceapi.LabeledFaceDescriptors(
          ld.label,
          [new Float32Array(ld.descriptor)]
        );
      });
      setMatcher(new faceapi.FaceMatcher(labeledFaceDescriptors, 0.6));
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
      if (!videoRef.current) return;

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
            
            // Si hay un match positivo
            if (bestMatch.label !== 'unknown') {
              // Evitar disparar múltiples veces para el mismo alumno seguidas
              if (lastRecognizedId !== bestMatch.label) {
                setLastRecognizedId(bestMatch.label);
                setShowSuccessFlash(true);
                
                toast({
                  title: "Alumno Identificado",
                  description: `${bestMatch.label} está en el sistema.`,
                });

                // Quitar el flash después de 500ms
                setTimeout(() => setShowSuccessFlash(false), 500);
                
                // Cooldown para volver a reconocer al mismo alumno
                if (cooldownRef.current) clearTimeout(cooldownRef.current);
                cooldownRef.current = setTimeout(() => {
                  setLastRecognizedId(null);
                }, 5000);
              }
              
              // Dibujar solo el cuadro, sin texto arriba (pasando label vacío o nulo)
              const drawBox = new faceapi.draw.DrawBox(detection.box, { 
                label: '', 
                boxColor: 'rgba(34, 197, 94, 1)', // Verde para éxito
                lineWidth: 4 
              });
              drawBox.draw(canvas);
            } else {
              // Rostro desconocido (Cuadro rojo/gris)
              const drawBox = new faceapi.draw.DrawBox(detection.box, { 
                label: '', 
                boxColor: 'rgba(239, 68, 68, 0.5)', 
                lineWidth: 2 
              });
              drawBox.draw(canvas);
            }
          } else {
            // Modo Enrolamiento: Dibujar cuadro neutro
            const drawBox = new faceapi.draw.DrawBox(detection.box, { 
              label: mode === 'enroll' ? 'Posiciona tu rostro' : '',
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
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className={cn("relative rounded-3xl overflow-hidden border-4 border-slate-900 shadow-2xl bg-black aspect-video w-full", !isLoaded && "hidden")}>
        <video 
          ref={videoRef} 
          autoPlay 
          muted 
          onPlay={handleVideoPlay}
          className="w-full h-full object-cover"
        />
        <canvas 
          ref={canvasRef} 
          className="absolute top-0 left-0 w-full h-full pointer-events-none" 
        />
        
        {/* DESTELLO BLANCO DE ÉXITO */}
        {showSuccessFlash && (
          <div className="absolute inset-0 bg-white animate-in fade-in duration-300 z-20 flex items-center justify-center">
             <div className="text-primary flex flex-col items-center scale-110">
               <UserCheck className="w-24 h-24 mb-4" />
               <h2 className="text-4xl font-black uppercase tracking-tighter">Acceso Concedido</h2>
             </div>
          </div>
        )}

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

        {capturedDescriptor && (
          <div className="absolute inset-0 bg-green-600/40 backdrop-blur-sm flex items-center justify-center animate-in fade-in zoom-in duration-300">
             <div className="text-white text-center">
               <CheckCircle2 className="w-20 h-20 mx-auto mb-2" />
               <p className="text-2xl font-black uppercase tracking-tighter">¡Capturado!</p>
               <p className="text-xs font-bold opacity-80">Procesando descriptor facial...</p>
             </div>
          </div>
        )}
      </div>

      <div className="w-full bg-slate-50 p-4 rounded-2xl border border-dashed text-center">
        <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">
          {mode === 'enroll' ? 'Modo: Enrolamiento de Alumno' : 'Modo: Identificación en tiempo real'}
        </p>
      </div>
    </div>
  );
}
