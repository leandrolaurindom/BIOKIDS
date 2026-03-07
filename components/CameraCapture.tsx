
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { CameraIcon } from './icons/CameraIcon';
import { RotateIcon } from './icons/RotateIcon';

interface CameraCaptureProps {
  onCapture: (file: File, previewUrl: string) => void;
  onClose: () => void;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [error, setError] = useState<string | null>(null);

  const startCamera = useCallback(async () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }

    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facingMode },
        audio: false
      });
      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
      setError(null);
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError("Não foi possível acessar a câmera. Verifique as permissões.");
    }
  }, [facingMode, stream]);

  useEffect(() => {
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [facingMode]);

  const toggleCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], "captured_animal.jpg", { type: "image/jpeg" });
            const previewUrl = canvas.toDataURL('image/jpeg');
            onCapture(file, previewUrl);
          }
        }, 'image/jpeg');
      }
    }
  };

  return (
    <div className="relative bg-black rounded-2xl overflow-hidden border-4 border-yellow-400 shadow-2xl">
      {error ? (
        <div className="p-8 text-center text-white">
          <p className="mb-4">{error}</p>
          <button onClick={onClose} className="bg-red-500 px-6 py-2 rounded-full font-bold">Fechar</button>
        </div>
      ) : (
        <>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-auto max-h-[60vh] object-cover"
          />
          <canvas ref={canvasRef} className="hidden" />
          
          <div className="absolute bottom-4 left-0 right-0 flex justify-center items-center gap-6 px-4">
            <button 
              onClick={toggleCamera}
              className="p-4 bg-white/20 hover:bg-white/40 backdrop-blur-md rounded-full text-white transition-colors"
              title="Girar Câmera"
            >
              <RotateIcon className="w-8 h-8" />
            </button>
            
            <button 
              onClick={capturePhoto}
              className="p-6 bg-yellow-400 hover:bg-yellow-500 rounded-full text-green-900 shadow-lg transform active:scale-95 transition-all"
              title="Tirar Foto"
            >
              <CameraIcon className="w-10 h-10" />
            </button>
            
            <button 
              onClick={onClose}
              className="p-4 bg-red-500/80 hover:bg-red-600 backdrop-blur-md rounded-full text-white transition-colors font-bold"
            >
              &times;
            </button>
          </div>
        </>
      )}
    </div>
  );
};
