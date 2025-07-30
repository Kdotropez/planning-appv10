import React, { useState, useEffect } from 'react';
import { 
  createLicense, 
  saveLicense, 
  loadLicense, 
  removeLicense, 
  isLicenseValid, 
  getLicenseInfo,
  LICENSE_TYPES,
  createSampleLicenses
} from '../../utils/licenseManager';

const LicenseManager = () => {
  const [currentLicense, setCurrentLicense] = useState(null);
  const [newLicense, setNewLicense] = useState({
    type: LICENSE_TYPES.TRIAL,
    duration: 30,
    clientName: '',
    email: ''
  });
  const [message, setMessage] = useState('');

  useEffect(() => {
    const license = loadLicense();
    setCurrentLicense(license);
  }, []);

  const handleCreateLicense = () => {
    if (!newLicense.clientName || !newLicense.email) {
      setMessage('Veuillez remplir tous les champs');
      return;
    }

    const license = createLicense(
      newLicense.type,
      newLicense.duration,
      newLicense.clientName,
      newLicense.email
    );

    if (saveLicense(license)) {
      setCurrentLicense(license);
      setMessage(`Licence créée avec succès ! ID: ${license.id}`);
      setNewLicense({
        type: LICENSE_TYPES.TRIAL,
        duration: 30,
        clientName: '',
        email: ''
      });
    } else {
      setMessage('Erreur lors de la création de la licence');
    }
  };

  const handleRemoveLicense = () => {
    if (removeLicense()) {
      setCurrentLicense(null);
      setMessage('Licence supprimée avec succès');
    } else {
      setMessage('Erreur lors de la suppression de la licence');
    }
  };

  const handleCreateSample = (type) => {
    const samples = createSampleLicenses();
    const license = samples[type];
    
    if (saveLicense(license)) {
      setCurrentLicense(license);
      setMessage(`Licence ${type} créée avec succès ! ID: ${license.id}`);
    } else {
      setMessage('Erreur lors de la création de la licence');
    }
  };

  const getLicenseTypeLabel = (type) => {
    switch (type) {
      case LICENSE_TYPES.TRIAL: return 'Essai (30 jours)';
      case LICENSE_TYPES.DEMO: return 'Démo (7 jours)';
      case LICENSE_TYPES.EVALUATION: return 'Évaluation (60 jours)';
      case LICENSE_TYPES.FULL: return 'Complète';
      default: return type;
    }
  };

  const getLicenseStatus = (license) => {
    if (!license) return { status: 'Aucune licence', color: 'red' };
    
    const isValid = isLicenseValid(license);
    const info = getLicenseInfo(license);
    
    if (!isValid) {
      return { status: 'Expirée', color: 'red' };
    }
    
    if (info.daysLeft <= 7) {
      return { status: `Expire dans ${info.daysLeft} jour(s)`, color: 'orange' };
    }
    
    return { status: `Valide (${info.daysLeft} jours restants)`, color: 'green' };
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h2 style={{ color: '#333', marginBottom: '20px' }}>
        🗝️ Gestionnaire de Licences
      </h2>

      {/* Licence actuelle */}
      <div style={{ 
        backgroundColor: '#f5f5f5', 
        padding: '15px', 
        borderRadius: '8px', 
        marginBottom: '20px' 
      }}>
        <h3>Licence Actuelle</h3>
        {currentLicense ? (
          <div>
            <p><strong>ID:</strong> {currentLicense.id}</p>
            <p><strong>Client:</strong> {currentLicense.clientName}</p>
            <p><strong>Email:</strong> {currentLicense.email}</p>
            <p><strong>Type:</strong> {getLicenseTypeLabel(currentLicense.type)}</p>
            <p><strong>Statut:</strong> 
              <span style={{ 
                color: getLicenseStatus(currentLicense).color, 
                fontWeight: 'bold',
                marginLeft: '10px'
              }}>
                {getLicenseStatus(currentLicense).status}
              </span>
            </p>
            <button 
              onClick={handleRemoveLicense}
              style={{
                backgroundColor: '#e74c3c',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '4px',
                cursor: 'pointer',
                marginTop: '10px'
              }}
            >
              Supprimer la licence
            </button>
          </div>
        ) : (
          <p style={{ color: '#666' }}>Aucune licence active</p>
        )}
      </div>

      {/* Créer une nouvelle licence */}
      <div style={{ 
        backgroundColor: '#fff', 
        padding: '20px', 
        borderRadius: '8px', 
        border: '1px solid #ddd',
        marginBottom: '20px'
      }}>
        <h3>Créer une Nouvelle Licence</h3>
        
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>
            Type de licence:
          </label>
          <select 
            value={newLicense.type}
            onChange={(e) => setNewLicense({...newLicense, type: e.target.value})}
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
          >
            <option value={LICENSE_TYPES.TRIAL}>Essai (30 jours)</option>
            <option value={LICENSE_TYPES.DEMO}>Démo (7 jours)</option>
            <option value={LICENSE_TYPES.EVALUATION}>Évaluation (60 jours)</option>
            <option value={LICENSE_TYPES.FULL}>Complète (illimitée)</option>
          </select>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>
            Durée (jours):
          </label>
          <input 
            type="number"
            value={newLicense.duration}
            onChange={(e) => setNewLicense({...newLicense, duration: parseInt(e.target.value)})}
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
            min="1"
            max="365"
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>
            Nom du client:
          </label>
          <input 
            type="text"
            value={newLicense.clientName}
            onChange={(e) => setNewLicense({...newLicense, clientName: e.target.value})}
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
            placeholder="Nom du client"
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>
            Email:
          </label>
          <input 
            type="email"
            value={newLicense.email}
            onChange={(e) => setNewLicense({...newLicense, email: e.target.value})}
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
            placeholder="email@exemple.com"
          />
        </div>

        <button 
          onClick={handleCreateLicense}
          style={{
            backgroundColor: '#27ae60',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '4px',
            cursor: 'pointer',
            width: '100%'
          }}
        >
          Créer la licence
        </button>
      </div>

      {/* Licences d'exemple */}
      <div style={{ 
        backgroundColor: '#fff', 
        padding: '20px', 
        borderRadius: '8px', 
        border: '1px solid #ddd',
        marginBottom: '20px'
      }}>
        <h3>Licences d'Exemple</h3>
        <p style={{ color: '#666', marginBottom: '15px' }}>
          Créer rapidement des licences pour les tests
        </p>
        
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button 
            onClick={() => handleCreateSample('trial')}
            style={{
              backgroundColor: '#3498db',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Licence Essai
          </button>
          
          <button 
            onClick={() => handleCreateSample('demo')}
            style={{
              backgroundColor: '#f39c12',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Licence Démo
          </button>
          
          <button 
            onClick={() => handleCreateSample('evaluation')}
            style={{
              backgroundColor: '#9b59b6',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Licence Évaluation
          </button>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div style={{ 
          backgroundColor: message.includes('succès') ? '#d4edda' : '#f8d7da',
          color: message.includes('succès') ? '#155724' : '#721c24',
          padding: '10px',
          borderRadius: '4px',
          marginTop: '20px'
        }}>
          {message}
        </div>
      )}
    </div>
  );
};

export default LicenseManager; 