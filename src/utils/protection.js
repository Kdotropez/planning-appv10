// Système de protection propriétaire - Planning App v9
// Copyright (c) 2025 Nicolas Lefevre. Tous droits réservés.

// Protection contre l'inspection du code
export const enableProtection = () => {
  // Désactiver le clic droit
  document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    return false;
  });

  // Désactiver les raccourcis clavier d'inspection
  document.addEventListener('keydown', (e) => {
    // F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
    if (
      e.key === 'F12' ||
      (e.ctrlKey && e.shiftKey && e.key === 'I') ||
      (e.ctrlKey && e.shiftKey && e.key === 'J') ||
      (e.ctrlKey && e.key === 'u')
    ) {
      e.preventDefault();
      return false;
    }
  });

  // Protection contre la copie
  document.addEventListener('copy', (e) => {
    e.preventDefault();
    return false;
  });

  // Protection contre la sélection
  document.addEventListener('selectstart', (e) => {
    e.preventDefault();
    return false;
  });

  // Afficher un avertissement si la console est ouverte
  let devtools = { open: false, orientation: null };
  
  setInterval(() => {
    const threshold = 160;
    const widthThreshold = window.outerWidth - window.innerWidth > threshold;
    const heightThreshold = window.outerHeight - window.innerHeight > threshold;
    
    if (widthThreshold || heightThreshold) {
      if (!devtools.open) {
        devtools.open = true;
        alert('⚠️ ATTENTION : Inspection détectée\n\nCe logiciel est protégé par les droits d\'auteur.\nToute tentative de copie ou de modification est interdite.');
      }
    } else {
      devtools.open = false;
    }
  }, 500);

  // Protection contre la sauvegarde de page
  window.addEventListener('beforeunload', (e) => {
    e.preventDefault();
    e.returnValue = 'Ce logiciel est protégé par les droits d\'auteur.';
  });
};

// Vérification de l'environnement
export const checkEnvironment = () => {
  const warnings = [];
  
  // Vérifier si on est en mode développement
  if (process.env.NODE_ENV === 'development') {
    warnings.push('Mode développement détecté');
  }
  
  // Vérifier si les outils de développement sont disponibles
  if (window.outerHeight - window.innerHeight > 200 || window.outerWidth - window.innerWidth > 200) {
    warnings.push('Outils de développement détectés');
  }
  
  return warnings;
};

// Message de copyright
export const getCopyrightMessage = () => {
  return `© 2025 Nicolas Lefevre - Logiciel Propriétaire
Tous droits réservés. Utilisation non autorisée interdite.`;
};

// Protection des données
export const protectData = (data) => {
  // Ajouter un watermark invisible
  const protectedData = {
    ...data,
    _watermark: {
      copyright: 'Planning App v9',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    }
  };
  
  return protectedData;
}; 