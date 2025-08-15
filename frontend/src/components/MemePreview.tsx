import { useState, useEffect } from 'react';
import { JobStatus } from '../types';

interface MemePreviewProps {
  selectedImage: File | null;
  topText: string;
  bottomText: string;
  status: JobStatus;
  className?: string;
}

export default function MemePreview({ selectedImage, topText, bottomText, status, className = '' }: MemePreviewProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (selectedImage) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(selectedImage);
    } else {
      setPreviewUrl(null);
    }
  }, [selectedImage]);

  // If generation is complete, show the result
  if (status.status === 'done') {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">Resultado Final</h3>
          <img 
            src={status.imageUrl} 
            alt="Meme generado" 
            className="w-full max-w-md mx-auto rounded-lg border-2 border-neutral-700 shadow-lg"
          />
        </div>
      </div>
    );
  }

  // Show preview with uploaded image and text overlay
  if (previewUrl) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">Vista previa</h3>
          <div className="relative inline-block">
            <img 
              src={previewUrl} 
              alt="Vista previa del meme" 
              className="w-full max-w-md mx-auto rounded-lg border-2 border-neutral-700"
            />
            
            {/* Top text overlay */}
            {topText && (
              <div 
                className="absolute top-4 left-1/2 transform -translate-x-1/2 text-white text-2xl font-bold text-center px-2"
                style={{
                  textShadow: '2px 2px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 0 2px 0 #000, 2px 0 0 #000, 0 -2px 0 #000, -2px 0 0 #000',
                  fontFamily: 'Impact, Arial Black, sans-serif',
                  letterSpacing: '0.05em',
                  lineHeight: '1.1'
                }}
              >
                {topText.toUpperCase()}
              </div>
            )}

            {/* Bottom text overlay */}
            {bottomText && (
              <div 
                className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-2xl font-bold text-center px-2"
                style={{
                  textShadow: '2px 2px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 0 2px 0 #000, 2px 0 0 #000, 0 -2px 0 #000, -2px 0 0 #000',
                  fontFamily: 'Impact, Arial Black, sans-serif',
                  letterSpacing: '0.05em',
                  lineHeight: '1.1'
                }}
              >
                {bottomText.toUpperCase()}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  return (
    <div className={`flex items-center justify-center h-64 bg-neutral-100 dark:bg-neutral-800 rounded-lg border-2 border-dashed border-neutral-300 dark:border-neutral-600 ${className}`}>
      <div className="text-center text-neutral-500 dark:text-neutral-400">
        <div className="text-6xl mb-4">🖼️</div>
        <p className="text-lg font-medium mb-2">Vista previa del meme</p>
        <p className="text-sm">
          Sube una imagen o escribe un prompt para ver la vista previa
        </p>
      </div>
    </div>
  );
}