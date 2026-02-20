
/**
 * Image Processing Service
 * Handles client-side optimization and enhancement before sending to AI.
 */

export const enhanceImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const img = new Image();
        
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
  
          if (!ctx) {
            reject(new Error('Canvas context unavailable'));
            return;
          }
  
          // 1. Smart Resizing
          // We limit max dimension to 2048px. This is plenty for OCR/Vision but saves massive bandwidth.
          const MAX_DIMENSION = 2048;
          let width = img.width;
          let height = img.height;
  
          if (width > height) {
            if (width > MAX_DIMENSION) {
              height *= MAX_DIMENSION / width;
              width = MAX_DIMENSION;
            }
          } else {
            if (height > MAX_DIMENSION) {
              width *= MAX_DIMENSION / height;
              height = MAX_DIMENSION;
            }
          }
  
          canvas.width = width;
          canvas.height = height;
  
          // 2. Image Enhancement Filters
          // - Contrast(1.15): Makes text pop against backgrounds.
          // - Brightness(1.05): Helps with poorly lit document photos.
          // - Saturate(1.1): Slight boost helps distinguish colored diagrams/elements.
          ctx.filter = 'contrast(1.15) brightness(1.05) saturate(1.1)';
  
          // Draw the image with the filters applied
          ctx.drawImage(img, 0, 0, width, height);
  
          // 3. Export as optimized JPEG
          // 0.85 quality is the sweet spot for GenAI recognition vs file size
          const enhancedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
          resolve(enhancedDataUrl);
        };
  
        img.onerror = (err) => reject(err);
        img.src = e.target?.result as string;
      };
  
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  };
