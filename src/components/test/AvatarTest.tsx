import React from 'react';
import { TrainerAvatar } from '@/utils/trainerAvatars';

export const AvatarTest = () => {
  const testTrainers = ['Anisha', 'Karan', 'Mrigakshi', 'Unknown Trainer'];
  
  return (
    <div style={{ padding: '20px' }}>
      <h2>Trainer Avatar Test</h2>
      {testTrainers.map(name => (
        <div key={name} style={{ margin: '10px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <TrainerAvatar name={name} size="sm" />
          <TrainerAvatar name={name} size="md" />
          <TrainerAvatar name={name} size="lg" />
          <span>{name}</span>
        </div>
      ))}
    </div>
  );
};