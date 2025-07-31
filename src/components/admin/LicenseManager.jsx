import React, { useState, useEffect } from 'react';
import { 
  createLicense, 
  saveLicense, 
  generateLicenseKey, 
  getUsedKeys, 
  resetUsedKeys,
  loadLicense,
  createNicolasLicense,
  LICENSE_TYPES 
} from '../../utils/licenseManager';

const LicenseManager = () => {
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [licenseType, setLicenseType] = useState('provisional');
  const [message, setMessage] = useState('');
  const [currentLicense, setCurrentLicense] = useState(null);
  const [usedKeys, setUsedKeys] = useState([]);
  const [generatedKey, setGeneratedKey] = useState('');

  useEffect(() => {
    console.log('LicenseManager chargé');
    // Charger la licence actuelle
    const license = loadLicense();
    if (license) {
      setCurrentLicense(license);
    }

    // Charger les clés utilisées
    const keys = getUsedKeys();
    setUsedKeys(keys);
  }, []);

  const createNewLicense = () => {
    console.log('Création de licence...');
    if (!clientName || !clientEmail) {
      setMessage('❌ Veuillez remplir le nom et l\'email');
      return;
    }

    const duration = licenseType === 'provisional' ? 7 : 36500;
    const license = createLicense(licenseType, duration, clientName, clientEmail);

    if (saveLicense(license)) {
      setMessage('✅ Licence créée avec succès !');
      setCurrentLicense(license);
      setClientName('');
      setClientEmail('');
    } else {
      setMessage('❌ Erreur lors de la création de la licence');
    }
  };

  const generateKey = () => {
    console.log('Génération de clé...');
    const duration = licenseType === 'provisional' ? 7 : 36500;
    const key = generateLicenseKey(licenseType, duration);
    setGeneratedKey(key);
    setMessage('🗝️ Clé générée ! Copiez-la pour l\'envoyer au client.');
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      setMessage('📋 Clé copiée dans le presse-papiers !');
    });
  };

  const clearUsedKeys = () => {
    if (window.confirm('Êtes-vous sûr de vouloir effacer toutes les clés utilisées ?')) {
      resetUsedKeys();
      setUsedKeys([]);
      setMessage('✅ Clés utilisées effacées');
    }
  };

  const createNicolasLicenseAdmin = () => {
    console.log('Création licence Nicolas...');
    const nicolasLicense = createNicolasLicense();
    if (nicolasLicense) {
      setMessage('✅ Licence Nicolas Lefevre créée avec succès !');
      setCurrentLicense(nicolasLicense);
    } else {
      setMessage('❌ Erreur lors de la création de la licence Nicolas');
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '20px', color: '#333' }}>
        🗝️ Gestionnaire de Licences
      </h1>

      {/* Message */}
      {message && (
        <div style={{
          padding: '10px',
          borderRadius: '5px',
          marginBottom: '20px',
          textAlign: 'center',
          backgroundColor: message.includes('✅') ? '#d4edda' : '#f8d7da',
          color: message.includes('✅') ? '#155724' : '#721c24',
          border: message.includes('✅') ? '1px solid #c3e6cb' : '1px solid #f5c6cb'
        }}>
          {message}
        </div>
      )}

      {/* Créer une Licence */}
      <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '8px' }}>
        <h3>📝 Créer une Licence</h3>
        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Nom du client :
          </label>
          <input
            type="text"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid #ddd'
            }}
            placeholder="Nom complet du client"
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Email du client :
          </label>
          <input
            type="email"
            value={clientEmail}
            onChange={(e) => setClientEmail(e.target.value)}
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid #ddd'
            }}
            placeholder="email@client.com"
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Type de licence :
          </label>
          <select
            value={licenseType}
            onChange={(e) => setLicenseType(e.target.value)}
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid #ddd'
            }}
          >
            <option value="provisional">Provisoire (7 jours)</option>
            <option value="unlimited">Illimitée (100 ans)</option>
          </select>
        </div>
        <button
          onClick={createNewLicense}
          style={{
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold',
            width: '100%',
            marginBottom: '8px'
          }}
        >
          🚀 Créer Licence
        </button>
        
        <button
          onClick={createNicolasLicenseAdmin}
          style={{
            backgroundColor: '#e74c3c',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold',
            width: '100%'
          }}
        >
          👨‍💻 Licence Nicolas Lefevre (Illimitée)
        </button>
      </div>

      {/* Générer une Clé */}
      <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '8px' }}>
        <h3>🔑 Générer une Clé</h3>
        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Type de clé :
          </label>
          <select
            value={licenseType}
            onChange={(e) => setLicenseType(e.target.value)}
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid #ddd'
            }}
          >
            <option value="provisional">Provisoire (7 jours)</option>
            <option value="unlimited">Illimitée (100 ans)</option>
          </select>
        </div>
        <button
          onClick={generateKey}
          style={{
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold',
            width: '100%',
            marginBottom: '10px'
          }}
        >
          🔑 Générer Clé
        </button>
        {generatedKey && (
          <div style={{ marginTop: '10px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Clé générée :
            </label>
            <div style={{
              background: '#f8f9fa',
              border: '1px solid #dee2e6',
              borderRadius: '4px',
              padding: '8px',
              fontFamily: 'monospace',
              fontSize: '12px',
              wordBreak: 'break-all',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span>{generatedKey}</span>
              <button
                onClick={() => copyToClipboard(generatedKey)}
                style={{
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  padding: '4px 8px',
                  borderRadius: '3px',
                  cursor: 'pointer',
                  fontSize: '11px',
                  marginLeft: '8px'
                }}
              >
                📋 Copier
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Licence Actuelle */}
      {currentLicense && (
        <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #28a745', borderRadius: '8px', backgroundColor: '#d4edda' }}>
          <h3>📋 Licence Actuelle</h3>
          <p><strong>Client :</strong> {currentLicense.clientName}</p>
          <p><strong>Email :</strong> {currentLicense.email}</p>
          <p><strong>Type :</strong> {currentLicense.type === 'provisional' ? 'Provisoire' : 'Illimitée'}</p>
          <p><strong>Expire le :</strong> {new Date(currentLicense.expiryDate).toLocaleDateString('fr-FR')}</p>
        </div>
      )}

      {/* Clés Utilisées */}
      {usedKeys.length > 0 && (
        <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '8px' }}>
          <h3>🗑️ Clés Utilisées ({usedKeys.length})</h3>
          <div style={{ maxHeight: '150px', overflow: 'auto' }}>
            {usedKeys.map((key, index) => (
              <div key={index} style={{
                padding: '4px',
                margin: '2px 0',
                backgroundColor: '#f8f9fa',
                borderRadius: '3px',
                fontFamily: 'monospace',
                fontSize: '11px'
              }}>
                {key}
              </div>
            ))}
          </div>
          <button
            onClick={clearUsedKeys}
            style={{
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              padding: '6px 12px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '11px',
              marginTop: '8px'
            }}
          >
            🗑️ Effacer Toutes les Clés
          </button>
        </div>
      )}
    </div>
  );
};

export default LicenseManager; 