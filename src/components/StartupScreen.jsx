import React from 'react';
import Button from './common/Button';

const StartupScreen = ({ onNewPlanning, onImportPlanning, onExit, onClearLocalStorage }) => {
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      onImportPlanning(file);
    }
  };

  return (
    <div className="startup-screen" style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#f5f5f5',
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '10px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        textAlign: 'center',
        maxWidth: '500px',
        width: '100%'
      }}>
        <h1 style={{
          color: '#333',
          marginBottom: '30px',
          fontSize: '2.5rem'
        }}>
          Planning App
        </h1>
        
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}>
          <Button 
            onClick={onNewPlanning}
            style={{
              padding: '15px 30px',
              fontSize: '1.1rem',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Nouveau planning
          </Button>
          
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '10px'
          }}>
            <span style={{ color: '#666' }}>ou</span>
            
            <label style={{
              padding: '15px 30px',
              fontSize: '1.1rem',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              display: 'inline-block'
            }}>
              Importer planning
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
            </label>
          </div>
        </div>
        
        <p style={{
          marginTop: '30px',
          color: '#666',
          fontSize: '0.9rem'
        }}>
          Importez un fichier de sauvegarde (.json) depuis votre clé USB
        </p>

        <div style={{
          marginTop: '30px',
          paddingTop: '20px',
          borderTop: '1px solid #eee',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          <Button
            onClick={onExit}
            style={{
              padding: '10px 20px',
              fontSize: '1rem',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Quitter l'application
          </Button>
          
          <Button
            onClick={onClearLocalStorage}
            style={{
              padding: '10px 20px',
              fontSize: '1rem',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            🗑️ Effacer toutes les données
          </Button>
        </div>
      </div>
    </div>
  );
};

export default StartupScreen; 