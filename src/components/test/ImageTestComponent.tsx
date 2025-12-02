import React, { useState, useEffect } from 'react';
import { getTrainerAvatar } from '@/utils/trainerAvatars';

export const ImageTestComponent = () => {
  const [imageStatus, setImageStatus] = useState<Record<string, string>>({});

  const testImages = ['Anisha', 'Karan', 'Mrigakshi'];

  useEffect(() => {
    testImages.forEach(name => {
      const imgUrl = getTrainerAvatar(name);
      const img = new Image();
      
      img.onload = () => {
        setImageStatus(prev => ({ ...prev, [name]: `✅ Loaded: ${imgUrl}` }));
      };
      
      img.onerror = () => {
        setImageStatus(prev => ({ ...prev, [name]: `❌ Failed: ${imgUrl}` }));
      };
      
      img.src = imgUrl;
    });
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h3>Image Loading Test</h3>
      {testImages.map(name => (
        <div key={name} style={{ margin: '10px 0' }}>
          <strong>{name}:</strong> {imageStatus[name] || '⏳ Loading...'}
        </div>
      ))}
    </div>
  );
};