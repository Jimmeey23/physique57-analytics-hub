import { getTrainerAvatar, hasTrainerImage, getAvailableTrainers } from '@/utils/trainerAvatars';

// Debug page to check avatar functionality
export default function TrainerAvatarDebug() {
  const testTrainers = ['Anisha', 'Karan', 'Mrigakshi', 'Unknown Trainer', 'Kajol Kanchan'];
  
  return (
    <div style={{ padding: '20px', fontFamily: 'monospace', backgroundColor: 'white' }}>
      <h1>Trainer Avatar Debug</h1>
      
      <h2>Available Trainers:</h2>
      <ul>
        {getAvailableTrainers().map(name => (
          <li key={name}>{name}</li>
        ))}
      </ul>
      
      <h2>URL Generation Test:</h2>
      {testTrainers.map(name => (
        <div key={name} style={{ margin: '10px 0', border: '1px solid #ccc', padding: '10px' }}>
          <strong>Name:</strong> {name}<br/>
          <strong>Has Image:</strong> {hasTrainerImage(name) ? 'Yes' : 'No'}<br/>
          <strong>URL:</strong> {getTrainerAvatar(name)}<br/>
          <strong>Direct Image Test:</strong> <img 
            src={getTrainerAvatar(name)} 
            alt={name}
            style={{ width: '40px', height: '40px', objectFit: 'cover', border: '1px solid red' }}
            onError={(e) => {
              console.log(`Failed to load: ${getTrainerAvatar(name)}`);
              e.currentTarget.style.border = '2px solid red';
            }}
            onLoad={(e) => {
              console.log(`Loaded successfully: ${getTrainerAvatar(name)}`);
              e.currentTarget.style.border = '2px solid green';
            }}
          />
        </div>
      ))}
    </div>
  );
}