import React, { useState, useEffect } from 'react';
import { 
  createLicense, 
  saveLicense, 
  loadLicense, 
  getLicenseInfo,
  generateLicenseKey,
  getUsedKeys,
  resetUsedKeys,
  LICENSE_TYPES 
} from '../../utils/licenseManager';

const LicenseManager = () => {
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [licenseType, setLicenseType] = useState(LICENSE_TYPES.PROVISIONAL);
  const [message, setMessage] = useState('');
  const [currentLicense, setCurrentLicense] = useState(null);
  const [usedKeys, setUsedKeys] = useState([]);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    loadCurrentData();
  }, []);

  const loadCurrentData = () => {
    const license = loadLicense();
    const keys = getUsedKeys();
    setCurrentLicense(license);
    setUsedKeys(keys);
  };

  const handleCreateLicense = () => {
    if (!clientName || !clientEmail) {
      setMessage('❌ Veuillez remplir le nom et l\'email');
      return;
    }

    const duration = licenseType === LICENSE_TYPES.PROVISIONAL ? 7 : 36500;
    const license = createLicense(licenseType, duration, clientName, clientEmail);

    if (saveLicense(license)) {
      setMessage(`✅ Licence ${licenseType} créée avec succès !`);
      setClientName('');
      setClientEmail('');
      loadCurrentData();
    } else {
      setMessage('❌ Erreur lors de la création de la licence');
    }
  };

  const handleGenerateKey = () => {
    const duration = licenseType === LICENSE_TYPES.PROVISIONAL ? 7 : 36500;
    const key = generateLicenseKey(licenseType, duration);
    setMessage(`🗝️ Clé générée : ${key}`);
  };

  const handleClearData = () => {
    if (window.confirm('Êtes-vous sûr de vouloir effacer toutes les données ?')) {
      resetUsedKeys();
      localStorage.removeItem('planningAppLicense');
      setMessage('✅ Toutes les données ont été effacées');
      loadCurrentData();
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setMessage('📋 Copié dans le presse-papiers !');
  };

  return (
    <div style={{
      maxWidth: '800px',
      margin: '0 auto',
      padding: '20px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{ 
        textAlign: 'center', 
        color: '#333',
        marginBottom: '30px'
      }}>
        🗝️ Gestionnaire de Licences
      </h1>

      {/* Message */}
      {message && (
        <div style={{
          backgroundColor: message.includes('✅') ? '#d4edda' : '#f8d7da',
          color: message.includes('✅') ? '#155724' : '#721c24',
          padding: '15px',
          borderRadius: '5px',
          marginBottom: '20px',
          textAlign: 'center'
        }}>
          {message}
        </div>
      )}

      {/* Créer une licence */}
      <div style={{
        backgroundColor: '#f8f9fa',
        padding: '20px',
        borderRadius: '10px',
        marginBottom: '20px'
      }}>
        <h2 style={{ color: '#333', marginBottom: '20px' }}>
          📝 Créer une Licence
        </h2>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Type de licence :
          </label>
          <select
            value={licenseType}
            onChange={(e) => setLicenseType(e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '5px',
              border: '1px solid #ddd',
              fontSize: '16px'
            }}
          >
            <option value={LICENSE_TYPES.PROVISIONAL}>
              Provisoire (7 jours renouvelable)
            </option>
            <option value={LICENSE_TYPES.UNLIMITED}>
              Illimitée (jusqu'à révocation)
            </option>
          </select>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Nom du client :
          </label>
          <input
            type="text"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '5px',
              border: '1px solid #ddd',
              fontSize: '16px'
            }}
            placeholder="Nom complet du client"
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Email du client :
          </label>
          <input
            type="email"
            value={clientEmail}
            onChange={(e) => setClientEmail(e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '5px',
              border: '1px solid #ddd',
              fontSize: '16px'
            }}
            placeholder="email@client.com"
          />
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={handleCreateLicense}
            style={{
              backgroundColor: '#27ae60',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
              flex: 1,
              minWidth: '200px'
            }}
          >
            🚀 Créer Licence
          </button>

          <button
            onClick={handleGenerateKey}
            style={{
              backgroundColor: '#9b59b6',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
              flex: 1,
              minWidth: '200px'
            }}
          >
            🔑 Générer Clé
          </button>
        </div>
      </div>

      {/* Licence actuelle */}
      {currentLicense && (
        <div style={{
          backgroundColor: '#e8f5e8',
          padding: '20px',
          borderRadius: '10px',
          marginBottom: '20px'
        }}>
          <h2 style={{ color: '#333', marginBottom: '20px' }}>
            ✅ Licence Active
          </h2>
          
          {(() => {
            const info = getLicenseInfo(currentLicense);
            return (
              <div>
                <p><strong>Client :</strong> {info.clientName}</p>
                <p><strong>Email :</strong> {currentLicense.email}</p>
                <p><strong>Type :</strong> {info.type}</p>
                <p><strong>ID :</strong> {currentLicense.id}</p>
                <p><strong>Expire le :</strong> {info.expiryDate}</p>
                <p><strong>Jours restants :</strong> {info.daysLeft}</p>
                <p><strong>Statut :</strong> {info.isExpired ? '❌ Expirée' : '✅ Valide'}</p>
              </div>
            );
          })()}
        </div>
      )}

      {/* Clés utilisées */}
      <div style={{
        backgroundColor: '#f8f9fa',
        padding: '20px',
        borderRadius: '10px',
        marginBottom: '20px'
      }}>
        <h2 style={{ color: '#333', marginBottom: '20px' }}>
          🗝️ Clés Utilisées ({usedKeys.length})
        </h2>
        
        {usedKeys.length === 0 ? (
          <p style={{ color: '#666', fontStyle: 'italic' }}>
            Aucune clé utilisée
          </p>
        ) : (
          <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
            {usedKeys.map((key, index) => (
              <div
                key={index}
                style={{
                  padding: '10px',
                  backgroundColor: 'white',
                  marginBottom: '5px',
                  borderRadius: '5px',
                  border: '1px solid #ddd',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <span style={{ fontFamily: 'monospace', fontSize: '14px' }}>
                  {key}
                </span>
                <button
                  onClick={() => copyToClipboard(key)}
                  style={{
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    padding: '5px 10px',
                    borderRadius: '3px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  📋
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Boutons d'action */}
      <div style={{ textAlign: 'center' }}>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          style={{
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '14px',
            marginRight: '10px'
          }}
        >
          {showAdvanced ? '🔽' : '🔼'} Options Avancées
        </button>

        <button
          onClick={handleClearData}
          style={{
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          🗑️ Effacer Tout
        </button>
      </div>

      {/* Options avancées */}
      {showAdvanced && (
        <div style={{
          backgroundColor: '#fff3cd',
          padding: '20px',
          borderRadius: '10px',
          marginTop: '20px'
        }}>
          <h3 style={{ color: '#856404', marginBottom: '15px' }}>
            ⚙️ Options Avancées
          </h3>
          
          <div style={{ marginBottom: '15px' }}>
            <button
              onClick={() => {
                const keys = {
                  provisional: generateLicenseKey(LICENSE_TYPES.PROVISIONAL, 7),
                  unlimited: generateLicenseKey(LICENSE_TYPES.UNLIMITED, 36500)
                };
                setMessage(`🗝️ Clés générées :\nProvisoire: ${keys.provisional}\nIllimitée: ${keys.unlimited}`);
              }}
              style={{
                backgroundColor: '#17a2b8',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '14px',
                marginRight: '10px'
              }}
            >
              🔑 Générer Toutes les Clés
            </button>

            <button
              onClick={() => {
                const data = {
                  currentLicense: loadLicense(),
                  usedKeys: getUsedKeys()
                };
                const json = JSON.stringify(data, null, 2);
                copyToClipboard(json);
              }}
              style={{
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              📋 Exporter Données
            </button>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div style={{
        backgroundColor: '#e7f3ff',
        padding: '20px',
        borderRadius: '10px',
        marginTop: '20px'
      }}>
        <h3 style={{ color: '#004085', marginBottom: '15px' }}>
          📱 Instructions d'utilisation
        </h3>
        <ul style={{ color: '#004085', lineHeight: '1.6' }}>
          <li><strong>Créer une licence :</strong> Remplissez les champs et cliquez sur "Créer Licence"</li>
          <li><strong>Générer une clé :</strong> Sélectionnez le type et cliquez sur "Générer Clé"</li>
          <li><strong>Copier une clé :</strong> Cliquez sur le bouton 📋 à côté de la clé</li>
          <li><strong>Effacer les données :</strong> Utilisez le bouton "Effacer Tout" (attention !)</li>
        </ul>
      </div>
    </div>
  );
};

export default LicenseManager; 