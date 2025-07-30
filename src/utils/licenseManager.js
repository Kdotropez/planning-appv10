// Système de gestion des licences - Planning App v9
// Copyright (c) 2025 Nicolas Lefevre. Tous droits réservés.

// Types de licences
export const LICENSE_TYPES = {
  PROVISIONAL: 'provisional',  // 7 jours renouvelable
  UNLIMITED: 'unlimited'       // Illimitée jusqu'à révocation
};

// Structure d'une licence
export const createLicense = (type, duration, clientName, email) => {
  const now = new Date();
  const expiryDate = new Date(now.getTime() + (duration * 24 * 60 * 60 * 1000)); // durée en jours
  
  return {
    id: generateLicenseId(),
    type: type,
    clientName: clientName,
    email: email,
    issuedDate: now.toISOString(),
    expiryDate: expiryDate.toISOString(),
    isActive: true,
    features: getFeaturesForType(type)
  };
};

// Générer un ID de licence unique
const generateLicenseId = () => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5);
  return `LIC-${timestamp}-${random}`.toUpperCase();
};

// Générer une clé de licence numérique
export const generateLicenseKey = (type, duration = 7) => {
  const prefix = type === LICENSE_TYPES.UNLIMITED ? 'UNLIMITED' : 'PROVISIONAL';
  
  const durationCode = duration.toString().padStart(3, '0');
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.random().toString().slice(2, 6);
  
  return `${prefix}-${durationCode}-${timestamp}-${random}`.toUpperCase();
};

// Valider une clé de licence
export const validateLicenseKey = (key) => {
  if (!key || typeof key !== 'string') return null;
  
  const parts = key.split('-');
  if (parts.length !== 4) return null;
  
  const [prefix, durationCode, timestamp, random] = parts;
  
  // Vérifier le préfixe
  let type;
  switch (prefix) {
    case 'UNLIMITED': type = LICENSE_TYPES.UNLIMITED; break;
    case 'PROVISIONAL': type = LICENSE_TYPES.PROVISIONAL; break;
    default: return null;
  }
  
  // Vérifier la durée
  const duration = parseInt(durationCode);
  if (isNaN(duration) || duration <= 0) return null;
  
  // Vérifier le timestamp (doit être récent, max 1 an)
  const keyDate = new Date(parseInt(timestamp + '000'));
  const now = new Date();
  const oneYearAgo = new Date(now.getTime() - (365 * 24 * 60 * 60 * 1000));
  
  if (keyDate < oneYearAgo) return null;
  
  // Vérifier si la clé a déjà été utilisée
  if (isKeyUsed(key)) {
    return null; // Clé déjà utilisée
  }
  
  return { type, duration, key };
};

// Créer une licence à partir d'une clé
export const createLicenseFromKey = (key, clientName, email) => {
  const validation = validateLicenseKey(key);
  if (!validation) return null;
  
  // Marquer la clé comme utilisée
  if (!saveUsedKey(key)) {
    console.error('Erreur lors de la sauvegarde de la clé utilisée');
    return null;
  }
  
  return createLicense(
    validation.type,
    validation.duration,
    clientName,
    email
  );
};

// Fonctionnalités selon le type de licence
const getFeaturesForType = (type) => {
  switch (type) {
    case LICENSE_TYPES.PROVISIONAL:
      return {
        maxShops: 2,
        maxEmployees: 8,
        maxWeeks: 6,
        exportEnabled: true,
        fullFeatures: true,
        watermark: true,
        renewable: true
      };
    case LICENSE_TYPES.UNLIMITED:
      return {
        maxShops: -1, // illimité
        maxEmployees: -1, // illimité
        maxWeeks: -1, // illimité
        exportEnabled: true,
        fullFeatures: true,
        watermark: false,
        renewable: false
      };
    default:
      return getFeaturesForType(LICENSE_TYPES.PROVISIONAL);
  }
};

// Vérifier si une licence est valide
export const isLicenseValid = (license) => {
  if (!license || !license.isActive) return false;
  
  const now = new Date();
  const expiryDate = new Date(license.expiryDate);
  
  return now < expiryDate;
};

// Vérifier les limites de la licence
export const checkLicenseLimits = (license, currentData) => {
  if (!license || !isLicenseValid(license)) {
    return { valid: false, message: 'Licence invalide ou expirée' };
  }
  
  const features = license.features;
  const checks = [];
  
  // Vérifier le nombre de boutiques
  if (features.maxShops > 0 && currentData.shops.length >= features.maxShops) {
    checks.push(`Limite de ${features.maxShops} boutique(s) atteinte`);
  }
  
  // Vérifier le nombre d'employés
  const totalEmployees = currentData.shops.reduce((total, shop) => 
    total + (shop.employees ? shop.employees.length : 0), 0);
  
  if (features.maxEmployees > 0 && totalEmployees >= features.maxEmployees) {
    checks.push(`Limite de ${features.maxEmployees} employé(s) atteinte`);
  }
  
  // Vérifier le nombre de semaines
  const totalWeeks = currentData.shops.reduce((total, shop) => 
    total + (shop.weeks ? Object.keys(shop.weeks).length : 0), 0);
  
  if (features.maxWeeks > 0 && totalWeeks >= features.maxWeeks) {
    checks.push(`Limite de ${features.maxWeeks} semaine(s) atteinte`);
  }
  
  return {
    valid: checks.length === 0,
    message: checks.length > 0 ? checks.join(', ') : 'OK',
    features: features
  };
};

// Sauvegarder une licence
export const saveLicense = (license) => {
  try {
    localStorage.setItem('planningAppLicense', JSON.stringify(license));
    return true;
  } catch (error) {
    console.error('Erreur lors de la sauvegarde de la licence:', error);
    return false;
  }
};

// Sauvegarder une clé utilisée
export const saveUsedKey = (key) => {
  try {
    const usedKeys = getUsedKeys();
    usedKeys.push(key);
    localStorage.setItem('planningAppUsedKeys', JSON.stringify(usedKeys));
    return true;
  } catch (error) {
    console.error('Erreur lors de la sauvegarde de la clé utilisée:', error);
    return false;
  }
};

// Récupérer les clés déjà utilisées
export const getUsedKeys = () => {
  try {
    const usedKeys = localStorage.getItem('planningAppUsedKeys');
    return usedKeys ? JSON.parse(usedKeys) : [];
  } catch (error) {
    console.error('Erreur lors du chargement des clés utilisées:', error);
    return [];
  }
};

// Vérifier si une clé a déjà été utilisée
export const isKeyUsed = (key) => {
  const usedKeys = getUsedKeys();
  return usedKeys.includes(key);
};

// Charger une licence
export const loadLicense = () => {
  try {
    const licenseData = localStorage.getItem('planningAppLicense');
    return licenseData ? JSON.parse(licenseData) : null;
  } catch (error) {
    console.error('Erreur lors du chargement de la licence:', error);
    return null;
  }
};

// Supprimer une licence
export const removeLicense = () => {
  try {
    localStorage.removeItem('planningAppLicense');
    return true;
  } catch (error) {
    console.error('Erreur lors de la suppression de la licence:', error);
    return false;
  }
};

// Créer des licences d'exemple
export const createSampleLicenses = () => {
  return {
    provisional: createLicense(LICENSE_TYPES.PROVISIONAL, 7, 'Client Provisoire', 'provisoire@example.com'),
    unlimited: createLicense(LICENSE_TYPES.UNLIMITED, 36500, 'Client Illimité', 'unlimited@example.com')
  };
};

// Afficher les informations de licence
export const getLicenseInfo = (license) => {
  if (!license) return 'Aucune licence active';
  
  const expiryDate = new Date(license.expiryDate);
  const daysLeft = Math.ceil((expiryDate - new Date()) / (1000 * 60 * 60 * 24));
  
  return {
    clientName: license.clientName,
    type: license.type,
    expiryDate: expiryDate.toLocaleDateString('fr-FR'),
    daysLeft: daysLeft > 0 ? daysLeft : 0,
    isExpired: daysLeft <= 0,
    features: license.features
  };
};

// Valider une clé avec message d'erreur détaillé
export const validateLicenseKeyWithMessage = (key) => {
  if (!key || typeof key !== 'string') {
    return { valid: false, message: 'Clé de licence invalide' };
  }
  
  const parts = key.split('-');
  if (parts.length !== 4) {
    return { valid: false, message: 'Format de clé incorrect' };
  }
  
  const [prefix, durationCode, timestamp, random] = parts;
  
  // Vérifier le préfixe
  let type;
  switch (prefix) {
    case 'UNLIMITED': type = LICENSE_TYPES.UNLIMITED; break;
    case 'PROVISIONAL': type = LICENSE_TYPES.PROVISIONAL; break;
    default: return { valid: false, message: 'Type de licence invalide' };
  }
  
  // Vérifier la durée
  const duration = parseInt(durationCode);
  if (isNaN(duration) || duration <= 0) {
    return { valid: false, message: 'Durée de licence invalide' };
  }
  
  // Vérifier le timestamp (doit être récent, max 1 an)
  const keyDate = new Date(parseInt(timestamp + '000'));
  const now = new Date();
  const oneYearAgo = new Date(now.getTime() - (365 * 24 * 60 * 60 * 1000));
  
  if (keyDate < oneYearAgo) {
    return { valid: false, message: 'Clé de licence expirée' };
  }
  
  // Vérifier si la clé a déjà été utilisée
  if (isKeyUsed(key)) {
    return { valid: false, message: 'Cette clé a déjà été utilisée' };
  }
  
  return { 
    valid: true, 
    type, 
    duration, 
    key,
    message: 'Clé valide'
  };
};

// Réinitialiser les clés utilisées (pour les tests)
export const resetUsedKeys = () => {
  try {
    localStorage.removeItem('planningAppUsedKeys');
    return true;
  } catch (error) {
    console.error('Erreur lors de la réinitialisation des clés utilisées:', error);
    return false;
  }
};

// Renouveler une licence provisoire
export const renewProvisionalLicense = (license) => {
  if (!license || license.type !== LICENSE_TYPES.PROVISIONAL) {
    return { success: false, message: 'Licence non renouvelable' };
  }

  const now = new Date();
  const currentExpiry = new Date(license.expiryDate);
  
  // Si la licence n'est pas encore expirée, ajouter 7 jours à la date d'expiration actuelle
  // Sinon, créer une nouvelle expiration à partir d'aujourd'hui
  const newExpiryDate = now < currentExpiry 
    ? new Date(currentExpiry.getTime() + (7 * 24 * 60 * 60 * 1000))
    : new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000));

  const renewedLicense = {
    ...license,
    expiryDate: newExpiryDate.toISOString(),
    renewedAt: now.toISOString()
  };

  if (saveLicense(renewedLicense)) {
    return { 
      success: true, 
      message: 'Licence renouvelée avec succès',
      newExpiryDate: newExpiryDate.toLocaleDateString('fr-FR')
    };
  } else {
    return { success: false, message: 'Erreur lors du renouvellement' };
  }
};

// Révocher une licence illimitée
export const revokeUnlimitedLicense = (license) => {
  if (!license || license.type !== LICENSE_TYPES.UNLIMITED) {
    return { success: false, message: 'Licence non révocable' };
  }

  const revokedLicense = {
    ...license,
    isActive: false,
    revokedAt: new Date().toISOString()
  };

  if (saveLicense(revokedLicense)) {
    return { success: true, message: 'Licence révoquée avec succès' };
  } else {
    return { success: false, message: 'Erreur lors de la révocation' };
  }
}; 