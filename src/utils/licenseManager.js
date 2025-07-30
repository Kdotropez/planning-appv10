// Système de gestion des licences - Planning App v9
// Copyright (c) 2025 Nicolas Lefevre. Tous droits réservés.

// Types de licences
export const LICENSE_TYPES = {
  TRIAL: 'trial',
  DEMO: 'demo',
  EVALUATION: 'evaluation',
  FULL: 'full'
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

// Fonctionnalités selon le type de licence
const getFeaturesForType = (type) => {
  switch (type) {
    case LICENSE_TYPES.TRIAL:
      return {
        maxShops: 2,
        maxEmployees: 5,
        maxWeeks: 4,
        exportEnabled: true,
        fullFeatures: true,
        watermark: true
      };
    case LICENSE_TYPES.DEMO:
      return {
        maxShops: 1,
        maxEmployees: 3,
        maxWeeks: 2,
        exportEnabled: false,
        fullFeatures: false,
        watermark: true
      };
    case LICENSE_TYPES.EVALUATION:
      return {
        maxShops: 3,
        maxEmployees: 10,
        maxWeeks: 8,
        exportEnabled: true,
        fullFeatures: true,
        watermark: true
      };
    case LICENSE_TYPES.FULL:
      return {
        maxShops: -1, // illimité
        maxEmployees: -1, // illimité
        maxWeeks: -1, // illimité
        exportEnabled: true,
        fullFeatures: true,
        watermark: false
      };
    default:
      return getFeaturesForType(LICENSE_TYPES.DEMO);
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
    trial: createLicense(LICENSE_TYPES.TRIAL, 30, 'Client Test', 'test@example.com'),
    demo: createLicense(LICENSE_TYPES.DEMO, 7, 'Démo', 'demo@example.com'),
    evaluation: createLicense(LICENSE_TYPES.EVALUATION, 60, 'Évaluation', 'eval@example.com')
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