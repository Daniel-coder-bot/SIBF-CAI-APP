
"use client";

import React, { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';
import { Loader2, Camera, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

interface FacialRecognitionProps {
  mode: 'enroll' | 'recognize';
  onCapture?: (descriptor: number[]) => void;
  labeledDescriptors?: Array<{ label: string; descriptor: number[] }>;
}

export function FacialRecognitionComponent({ mode, onCapture, labeledDescriptors }: FacialRecognitionProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detection, setDetection] = useState<any>(null);
  const [capturedDescriptor, setCapturedDescriptor] = useState<number[] | null>(null);
  const [matcher, setMatcher] = useState<faceapi.FaceMatcher | null>(null);

  useEffect(() => {
    const loadModels = async () => {
      try {
        const MODEL_URL = '/models'; // Ubicación en public/models
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
    };
  }, []);

  // Inicializar el Matcher si estamos en modo reconocimiento
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
          let label = mode === 'enroll' ? 'Rostro Detectado' : 'Desconocido';

          if (mode === 'recognize' && matcher) {
            const bestMatch = matcher.findBestMatch(descriptor);
            label = bestMatch.toString();
          }

          const drawBox = new faceapi.draw.DrawBox(detection.box, { label });
          drawBox.draw(canvas);
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
