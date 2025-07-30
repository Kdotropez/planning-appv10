import React, { useState } from 'react';
import { 
  loadLicense, 
  isLicenseValid, 
  getLicenseInfo,
  createLicense,
  saveLicense,
  createLicenseFromKey,
  validateLicenseKeyWithMessage,
  LICENSE_TYPES 
} from '../../utils/licenseManager';

const LicenseModal = ({ isOpen, onClose, error, onLicenseValid }) => {
  const [licenseKey, setLicenseKey] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [message, setMessage] = useState('');
  const [showKeyActivation, setShowKeyActivation] = useState(false);

  const handleActivateLicense = () => {
    if (!clientName || !clientEmail) {
      setMessage('Veuillez remplir tous les champs');
      return;
    }

    // Créer une licence d'essai de 30 jours
    const license = createLicense(
      LICENSE_TYPES.TRIAL,
      30,
      clientName,
      clientEmail
    );

    if (saveLicense(license)) {
      setMessage('Licence activée avec succès !');
      setTimeout(() => {
        onLicenseValid();
        onClose();
      }, 2000);
    } else {
      setMessage('Erreur lors de l\'activation de la licence');
    }
  };

  const handleDemoMode = () => {
    // Créer une licence de démo de 7 jours
    const demoLicense = createLicense(
      LICENSE_TYPES.DEMO,
      7,
      'Utilisateur Démo',
      'demo@planning-app.com'
    );

    if (saveLicense(demoLicense)) {
      setMessage('Mode démo activé (7 jours)');
      setTimeout(() => {
        onLicenseValid();
        onClose();
      }, 2000);
    } else {
      setMessage('Erreur lors de l\'activation du mode démo');
    }
  };

  const handleFullLicense = () => {
    // Créer une licence complète pour Nicolas Lefevre
    const fullLicense = createLicense(
      LICENSE_TYPES.FULL,
      36500, // 100 ans
      'Nicolas Lefevre',
      'nicolas@planning-app.com'
    );

    if (saveLicense(fullLicense)) {
      setMessage('Licence complète activée ! (Illimitée)');
      setTimeout(() => {
        onLicenseValid();
        onClose();
      }, 2000);
    } else {
      setMessage('Erreur lors de l\'activation de la licence complète');
    }
  };

  const handleActivateWithKey = () => {
    if (!licenseKey.trim()) {
      setMessage('Veuillez saisir une clé de licence');
      return;
    }

    if (!clientName || !clientEmail) {
      setMessage('Veuillez remplir votre nom et email');
      return;
    }

    // Valider la clé avec message détaillé
    const validation = validateLicenseKeyWithMessage(licenseKey);
    if (!validation.valid) {
      setMessage(`❌ ${validation.message}`);
      return;
    }

    // Créer la licence à partir de la clé
    const license = createLicenseFromKey(licenseKey, clientName, clientEmail);
    if (!license) {
      setMessage('Erreur lors de la création de la licence');
      return;
    }

    if (saveLicense(license)) {
      setMessage(`✅ Licence activée avec succès ! (${validation.duration} jours)`);
      setTimeout(() => {
        onLicenseValid();
        onClose();
      }, 2000);
    } else {
      setMessage('Erreur lors de l\'activation de la licence');
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 10000
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '10px',
        maxWidth: '500px',
        width: '90%',
        maxHeight: '80vh',
        overflowY: 'auto'
      }}>
        <h2 style={{ 
          color: '#333', 
          marginBottom: '20px',
          textAlign: 'center'
        }}>
          🗝️ Vérification de Licence
        </h2>

        {error && (
          <div style={{
            backgroundColor: '#f8d7da',
            color: '#721c24',
            padding: '15px',
            borderRadius: '5px',
            marginBottom: '20px',
            border: '1px solid #f5c6cb'
          }}>
            <strong>⚠️ Attention :</strong> {error}
          </div>
        )}

                 <div style={{ marginBottom: '20px' }}>
           <h3>Activer une Licence</h3>
           <p style={{ color: '#666', marginBottom: '15px' }}>
             Pour utiliser l'application complète, veuillez saisir vos informations :
           </p>

           {/* Onglets pour choisir le mode d'activation */}
           <div style={{ 
             display: 'flex', 
             marginBottom: '20px',
             borderBottom: '1px solid #ddd'
           }}>
             <button
               onClick={() => setShowKeyActivation(false)}
               style={{
                 flex: 1,
                 padding: '10px',
                 border: 'none',
                 backgroundColor: !showKeyActivation ? '#f8f9fa' : 'transparent',
                 borderBottom: !showKeyActivation ? '2px solid #007bff' : 'none',
                 cursor: 'pointer',
                 fontWeight: !showKeyActivation ? 'bold' : 'normal'
               }}
             >
               📝 Licence d'Essai
             </button>
             <button
               onClick={() => setShowKeyActivation(true)}
               style={{
                 flex: 1,
                 padding: '10px',
                 border: 'none',
                 backgroundColor: showKeyActivation ? '#f8f9fa' : 'transparent',
                 borderBottom: showKeyActivation ? '2px solid #007bff' : 'none',
                 cursor: 'pointer',
                 fontWeight: showKeyActivation ? 'bold' : 'normal'
               }}
             >
               🔑 Clé de Licence
             </button>
           </div>

                     {!showKeyActivation ? (
             // Mode Licence d'Essai
             <>
               <div style={{ marginBottom: '15px' }}>
                 <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                   Nom complet :
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
                     fontSize: '14px'
                   }}
                   placeholder="Votre nom complet"
                 />
               </div>

               <div style={{ marginBottom: '20px' }}>
                 <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                   Email :
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
                     fontSize: '14px'
                   }}
                   placeholder="votre@email.com"
                 />
               </div>

               <button
                 onClick={handleActivateLicense}
                 style={{
                   backgroundColor: '#27ae60',
                   color: 'white',
                   border: 'none',
                   padding: '12px 24px',
                   borderRadius: '5px',
                   cursor: 'pointer',
                   fontSize: '14px',
                   fontWeight: 'bold',
                   width: '100%',
                   marginBottom: '10px'
                 }}
               >
                 🚀 Activer Licence d'Essai (30 jours)
               </button>
             </>
           ) : (
             // Mode Clé de Licence
             <>
               <div style={{ marginBottom: '15px' }}>
                 <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                   Clé de licence :
                 </label>
                 <input
                   type="text"
                   value={licenseKey}
                   onChange={(e) => setLicenseKey(e.target.value.toUpperCase())}
                   style={{
                     width: '100%',
                     padding: '10px',
                     borderRadius: '5px',
                     border: '1px solid #ddd',
                     fontSize: '14px',
                     fontFamily: 'monospace',
                     letterSpacing: '1px'
                   }}
                   placeholder="XXXX-XXX-XXXXXX-XXXX"
                 />
               </div>

               <div style={{ marginBottom: '15px' }}>
                 <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                   Nom complet :
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
                     fontSize: '14px'
                   }}
                   placeholder="Votre nom complet"
                 />
               </div>

               <div style={{ marginBottom: '20px' }}>
                 <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                   Email :
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
                     fontSize: '14px'
                   }}
                   placeholder="votre@email.com"
                 />
               </div>

               <button
                 onClick={handleActivateWithKey}
                 style={{
                   backgroundColor: '#9b59b6',
                   color: 'white',
                   border: 'none',
                   padding: '12px 24px',
                   borderRadius: '5px',
                   cursor: 'pointer',
                   fontSize: '14px',
                   fontWeight: 'bold',
                   width: '100%',
                   marginBottom: '10px'
                 }}
               >
                 🔑 Activer avec la Clé
               </button>
             </>
           )}
        </div>

        <div style={{ 
          borderTop: '1px solid #ddd', 
          paddingTop: '20px',
          marginBottom: '20px'
        }}>
          <h3>Mode Démo</h3>
          <p style={{ color: '#666', marginBottom: '15px' }}>
            Testez l'application avec des fonctionnalités limitées :
          </p>
          <button
            onClick={handleDemoMode}
            style={{
              backgroundColor: '#3498db',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              width: '100%'
            }}
          >
                         🎯 Essayer en Mode Démo (7 jours)
           </button>
         </div>

         {/* Bouton secret pour licence complète - Nicolas Lefevre */}
         <div style={{ 
           borderTop: '1px solid #ddd', 
           paddingTop: '20px',
           marginBottom: '20px'
         }}>
           <h3>Licence Développeur</h3>
           <p style={{ color: '#666', marginBottom: '15px' }}>
             Accès complet pour le développeur :
           </p>
           <button
             onClick={handleFullLicense}
             style={{
               backgroundColor: '#e74c3c',
               color: 'white',
               border: 'none',
               padding: '12px 24px',
               borderRadius: '5px',
               cursor: 'pointer',
               fontSize: '14px',
               fontWeight: 'bold',
               width: '100%'
             }}
           >
             🔓 Licence Complète (Illimitée)
           </button>
         </div>

        {message && (
          <div style={{
            backgroundColor: message.includes('succès') ? '#d4edda' : '#f8d7da',
            color: message.includes('succès') ? '#155724' : '#721c24',
            padding: '10px',
            borderRadius: '5px',
            marginTop: '15px',
            textAlign: 'center'
          }}>
            {message}
          </div>
        )}

        <div style={{ 
          marginTop: '20px',
          textAlign: 'center',
          fontSize: '12px',
          color: '#666'
        }}>
          <p>© 2025 Nicolas Lefevre - Logiciel Propriétaire</p>
          <p>Tous droits réservés</p>
        </div>
      </div>
    </div>
  );
};

export default LicenseModal; 