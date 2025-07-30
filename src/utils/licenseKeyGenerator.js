// Générateur de clés de licence - Nicolas Lefevre
// Copyright (c) 2025 Nicolas Lefevre. Tous droits réservés.

import { generateLicenseKey, LICENSE_TYPES, getUsedKeys, resetUsedKeys } from './licenseManager.js';

// Générer des clés de licence pour les tests
export const generateTestKeys = () => {
  const keys = {
    // Clé provisoire (7 jours renouvelable)
    provisional: generateLicenseKey(LICENSE_TYPES.PROVISIONAL, 7),
    
    // Clé illimitée (jusqu'à révocation)
    unlimited: generateLicenseKey(LICENSE_TYPES.UNLIMITED, 36500)
  };
  
  console.log('🗝️ Clés de licence générées :');
  console.log('--------------------------------');
  console.log(`Provisoire (7 j):   ${keys.provisional}`);
  console.log(`Illimitée:         ${keys.unlimited}`);
  console.log('--------------------------------');
  
  return keys;
};

// Générer une clé spécifique
export const generateSpecificKey = (type, duration) => {
  const key = generateLicenseKey(type, duration);
  console.log(`🗝️ Clé générée (${type}, ${duration} jours): ${key}`);
  return key;
};

// Fonctions utilitaires pour gérer les clés
export const listUsedKeys = () => {
  const usedKeys = getUsedKeys();
  console.log('🗝️ Clés déjà utilisées :');
  console.log('--------------------------------');
  if (usedKeys.length === 0) {
    console.log('Aucune clé utilisée');
  } else {
    usedKeys.forEach((key, index) => {
      console.log(`${index + 1}. ${key}`);
    });
  }
  console.log('--------------------------------');
  return usedKeys;
};

export const clearUsedKeys = () => {
  if (resetUsedKeys()) {
    console.log('✅ Clés utilisées réinitialisées');
    return true;
  } else {
    console.log('❌ Erreur lors de la réinitialisation');
    return false;
  }
};

// Exposer les fonctions globalement
window.generateTestKeys = generateTestKeys;
window.generateSpecificKey = generateSpecificKey;
window.listUsedKeys = listUsedKeys;
window.clearUsedKeys = clearUsedKeys;

// Instructions d'utilisation
console.log('🔑 Générateur de clés de licence activé !');
console.log('Pour générer des clés de test :');
console.log('1. generateTestKeys() - Génère toutes les clés de test');
console.log('2. generateSpecificKey("provisional", 7) - Génère une clé provisoire');
console.log('3. generateSpecificKey("unlimited", 36500) - Génère une clé illimitée');
console.log('4. listUsedKeys() - Affiche les clés déjà utilisées');
console.log('5. clearUsedKeys() - Réinitialise les clés utilisées (tests)'); 