// Générateur de clés de licence - Nicolas Lefevre
// Copyright (c) 2025 Nicolas Lefevre. Tous droits réservés.

import { generateLicenseKey, LICENSE_TYPES, getUsedKeys, resetUsedKeys } from './licenseManager.js';

// Générer des clés de licence pour les tests
export const generateTestKeys = () => {
  const keys = {
    // Clé de démo (7 jours)
    demo: generateLicenseKey(LICENSE_TYPES.DEMO, 7),
    
    // Clé d'essai (30 jours)
    trial: generateLicenseKey(LICENSE_TYPES.TRIAL, 30),
    
    // Clé d'évaluation (60 jours)
    evaluation: generateLicenseKey(LICENSE_TYPES.EVALUATION, 60),
    
    // Clé complète (365 jours)
    full: generateLicenseKey(LICENSE_TYPES.FULL, 365)
  };
  
  console.log('🗝️ Clés de licence générées :');
  console.log('--------------------------------');
  console.log(`Démo (7 jours):     ${keys.demo}`);
  console.log(`Essai (30 jours):   ${keys.trial}`);
  console.log(`Évaluation (60 j):  ${keys.evaluation}`);
  console.log(`Complète (365 j):   ${keys.full}`);
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
console.log('2. generateSpecificKey("trial", 30) - Génère une clé spécifique');
console.log('3. listUsedKeys() - Affiche les clés déjà utilisées');
console.log('4. clearUsedKeys() - Réinitialise les clés utilisées (tests)'); 