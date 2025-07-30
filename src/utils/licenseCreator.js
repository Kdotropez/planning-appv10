// Générateur de licences - Nicolas Lefevre
// Copyright (c) 2025 Nicolas Lefevre. Tous droits réservés.

import { 
  generateLicenseKey, 
  LICENSE_TYPES, 
  createLicense, 
  saveLicense,
  getUsedKeys,
  resetUsedKeys,
  getLicenseInfo,
  loadLicense
} from './licenseManager.js';

// Interface de création de licences
export const createLicenseInterface = () => {
  console.log('🗝️ GÉNÉRATEUR DE LICENCES - Planning App v9');
  console.log('==============================================');
  console.log('');
  console.log('📋 Commandes disponibles :');
  console.log('');
  console.log('1. createProvisionalLicense(clientName, email)');
  console.log('   → Crée une licence provisoire de 7 jours');
  console.log('');
  console.log('2. createUnlimitedLicense(clientName, email)');
  console.log('   → Crée une licence illimitée');
  console.log('');
  console.log('3. generateLicenseKey(type, duration)');
  console.log('   → Génère une clé de licence');
  console.log('');
  console.log('4. listAllLicenses()');
  console.log('   → Affiche toutes les licences créées');
  console.log('');
  console.log('5. getCurrentLicense()');
  console.log('   → Affiche la licence actuellement active');
  console.log('');
  console.log('6. clearAllData()');
  console.log('   → Efface toutes les données (licences + clés utilisées)');
  console.log('');
  console.log('==============================================');
};

// Créer une licence provisoire
export const createProvisionalLicense = (clientName, email) => {
  if (!clientName || !email) {
    console.log('❌ Erreur : Nom et email requis');
    console.log('Usage : createProvisionalLicense("Nom Client", "email@example.com")');
    return null;
  }

  const license = createLicense(
    LICENSE_TYPES.PROVISIONAL,
    7,
    clientName,
    email
  );

  if (saveLicense(license)) {
    console.log('✅ Licence provisoire créée avec succès !');
    console.log('📋 Détails :');
    console.log(`   Client : ${license.clientName}`);
    console.log(`   Email : ${license.email}`);
    console.log(`   Type : ${license.type}`);
    console.log(`   ID : ${license.id}`);
    console.log(`   Expire le : ${new Date(license.expiryDate).toLocaleDateString('fr-FR')}`);
    console.log(`   Limites : ${license.features.maxShops} boutiques, ${license.features.maxEmployees} employés`);
    return license;
  } else {
    console.log('❌ Erreur lors de la création de la licence');
    return null;
  }
};

// Créer une licence illimitée
export const createUnlimitedLicense = (clientName, email) => {
  if (!clientName || !email) {
    console.log('❌ Erreur : Nom et email requis');
    console.log('Usage : createUnlimitedLicense("Nom Client", "email@example.com")');
    return null;
  }

  const license = createLicense(
    LICENSE_TYPES.UNLIMITED,
    36500, // 100 ans
    clientName,
    email
  );

  if (saveLicense(license)) {
    console.log('✅ Licence illimitée créée avec succès !');
    console.log('📋 Détails :');
    console.log(`   Client : ${license.clientName}`);
    console.log(`   Email : ${license.email}`);
    console.log(`   Type : ${license.type}`);
    console.log(`   ID : ${license.id}`);
    console.log(`   Expire le : ${new Date(license.expiryDate).toLocaleDateString('fr-FR')}`);
    console.log(`   Limites : Illimitées`);
    return license;
  } else {
    console.log('❌ Erreur lors de la création de la licence');
    return null;
  }
};

// Lister toutes les licences
export const listAllLicenses = () => {
  const currentLicense = loadLicense();
  const usedKeys = getUsedKeys();
  
  console.log('📋 ÉTAT DES LICENCES');
  console.log('====================');
  
  if (currentLicense) {
    const info = getLicenseInfo(currentLicense);
    console.log('✅ Licence active :');
    console.log(`   Client : ${info.clientName}`);
    console.log(`   Type : ${info.type}`);
    console.log(`   Expire le : ${info.expiryDate}`);
    console.log(`   Jours restants : ${info.daysLeft}`);
    console.log(`   ID : ${currentLicense.id}`);
  } else {
    console.log('❌ Aucune licence active');
  }
  
  console.log('');
  console.log('🗝️ Clés utilisées :');
  if (usedKeys.length === 0) {
    console.log('   Aucune clé utilisée');
  } else {
    usedKeys.forEach((key, index) => {
      console.log(`   ${index + 1}. ${key}`);
    });
  }
  
  return { currentLicense, usedKeys };
};

// Obtenir la licence actuelle
export const getCurrentLicense = () => {
  const license = loadLicense();
  
  if (license) {
    const info = getLicenseInfo(license);
    console.log('📋 Licence actuelle :');
    console.log(`   Client : ${info.clientName}`);
    console.log(`   Email : ${license.email}`);
    console.log(`   Type : ${info.type}`);
    console.log(`   ID : ${license.id}`);
    console.log(`   Expire le : ${info.expiryDate}`);
    console.log(`   Jours restants : ${info.daysLeft}`);
    console.log(`   Statut : ${info.isExpired ? '❌ Expirée' : '✅ Valide'}`);
    return license;
  } else {
    console.log('❌ Aucune licence active');
    return null;
  }
};

// Effacer toutes les données
export const clearAllData = () => {
  if (confirm('Êtes-vous sûr de vouloir effacer toutes les données ?')) {
    resetUsedKeys();
    localStorage.removeItem('planningAppLicense');
    console.log('✅ Toutes les données ont été effacées');
    return true;
  } else {
    console.log('❌ Opération annulée');
    return false;
  }
};

// Générer des clés de test
export const generateTestKeys = () => {
  const keys = {
    provisional: generateLicenseKey(LICENSE_TYPES.PROVISIONAL, 7),
    unlimited: generateLicenseKey(LICENSE_TYPES.UNLIMITED, 36500)
  };
  
  console.log('🗝️ Clés de test générées :');
  console.log('============================');
  console.log(`Provisoire (7 j):   ${keys.provisional}`);
  console.log(`Illimitée:         ${keys.unlimited}`);
  console.log('============================');
  
  return keys;
};

// Exposer les fonctions globalement
window.createLicenseInterface = createLicenseInterface;
window.createProvisionalLicense = createProvisionalLicense;
window.createUnlimitedLicense = createUnlimitedLicense;
window.listAllLicenses = listAllLicenses;
window.getCurrentLicense = getCurrentLicense;
window.clearAllData = clearAllData;
window.generateTestKeys = generateTestKeys;

// Afficher l'interface au chargement
createLicenseInterface(); 