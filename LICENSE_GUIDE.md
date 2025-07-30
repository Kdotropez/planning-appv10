# 🗝️ Guide d'Utilisation du Système de Licences

## **Comment personnaliser le copyright avec votre nom :**

### **1. Remplacez [VOTRE NOM] dans tous les fichiers :**

```bash
# Dans LICENSE
Copyright (c) 2025 [VOTRE NOM]. Tous droits réservés.

# Dans package.json
"author": "[VOTRE NOM]",

# Dans src/components/common/CopyrightNotice.jsx
© 2025 [VOTRE NOM] - Propriétaire

# Dans src/utils/protection.js
// Copyright (c) 2025 [VOTRE NOM]. Tous droits réservés.
```

### **2. Exemple avec un nom réel :**
```bash
# Remplacez [VOTRE NOM] par votre nom réel, par exemple :
Copyright (c) 2025 Jean Dupont. Tous droits réservés.
```

## **Comment octroyer des licences provisoires :**

### **1. Types de licences disponibles :**

| Type | Durée | Boutiques | Employés | Semaines | Export | Watermark |
|------|-------|-----------|----------|----------|--------|-----------|
| **Essai** | 30 jours | 2 | 5 | 4 | ✅ | ✅ |
| **Démo** | 7 jours | 1 | 3 | 2 | ❌ | ✅ |
| **Évaluation** | 60 jours | 3 | 10 | 8 | ✅ | ✅ |
| **Complète** | Illimitée | ∞ | ∞ | ∞ | ✅ | ❌ |

### **2. Créer une licence manuellement :**

```javascript
import { createLicense, saveLicense, LICENSE_TYPES } from './utils/licenseManager';

// Créer une licence d'essai de 30 jours
const license = createLicense(
  LICENSE_TYPES.TRIAL,    // Type de licence
  30,                     // Durée en jours
  'Nom du Client',        // Nom du client
  'client@email.com'      // Email du client
);

// Sauvegarder la licence
saveLicense(license);
```

### **3. Utiliser l'interface graphique :**

1. **Accéder au gestionnaire de licences :**
   ```javascript
   // Dans votre application, ajoutez un bouton pour accéder au gestionnaire
   <LicenseManager />
   ```

2. **Créer une licence :**
   - Sélectionner le type de licence
   - Définir la durée
   - Saisir le nom et email du client
   - Cliquer sur "Créer la licence"

3. **Licences d'exemple rapides :**
   - Cliquer sur "Licence Essai" pour un essai de 30 jours
   - Cliquer sur "Licence Démo" pour une démo de 7 jours
   - Cliquer sur "Licence Évaluation" pour une évaluation de 60 jours

### **4. Vérifier une licence :**

```javascript
import { loadLicense, isLicenseValid, checkLicenseLimits } from './utils/licenseManager';

// Charger la licence actuelle
const license = loadLicense();

// Vérifier si la licence est valide
if (isLicenseValid(license)) {
  console.log('Licence valide');
} else {
  console.log('Licence expirée ou invalide');
}

// Vérifier les limites
const limits = checkLicenseLimits(license, planningData);
if (limits.valid) {
  console.log('Limites respectées');
} else {
  console.log('Limite atteinte:', limits.message);
}
```

## **Exemples d'utilisation pratique :**

### **1. Licence pour un client potentiel :**
```javascript
// Créer une licence d'évaluation de 60 jours
const evaluationLicense = createLicense(
  LICENSE_TYPES.EVALUATION,
  60,
  'Boutique Mode Plus',
  'contact@boutiquemodeplus.fr'
);
```

### **2. Licence pour une démonstration :**
```javascript
// Créer une licence de démo de 7 jours
const demoLicense = createLicense(
  LICENSE_TYPES.DEMO,
  7,
  'Démo Salon',
  'demo@salon.fr'
);
```

### **3. Licence complète pour un client payant :**
```javascript
// Créer une licence complète illimitée
const fullLicense = createLicense(
  LICENSE_TYPES.FULL,
  36500, // 100 ans (pratiquement illimité)
  'Chaîne de Boutiques',
  'admin@chaineboutiques.com'
);
```

## **Sécurité et protection :**

### **1. Les licences sont stockées localement :**
- Chaque client a sa propre licence
- Les licences ne peuvent pas être partagées
- Chaque licence a un ID unique

### **2. Vérification automatique :**
- L'application vérifie la validité de la licence au démarrage
- Les limites sont vérifiées en temps réel
- Les fonctionnalités sont désactivées si la licence est expirée

### **3. Protection contre la manipulation :**
- Les licences sont signées numériquement
- Les dates d'expiration sont vérifiées côté serveur (si configuré)
- Les tentatives de contournement sont détectées

## **Intégration dans l'application :**

### **1. Ajouter la vérification de licence :**
```javascript
// Dans App.jsx ou au démarrage de l'application
import { loadLicense, isLicenseValid } from './utils/licenseManager';

useEffect(() => {
  const license = loadLicense();
  if (!isLicenseValid(license)) {
    // Rediriger vers une page de licence ou afficher un message
    setShowLicenseWarning(true);
  }
}, []);
```

### **2. Afficher les informations de licence :**
```javascript
import { getLicenseInfo } from './utils/licenseManager';

const licenseInfo = getLicenseInfo(license);
console.log(`Client: ${licenseInfo.clientName}`);
console.log(`Expire le: ${licenseInfo.expiryDate}`);
console.log(`Jours restants: ${licenseInfo.daysLeft}`);
```

## **Support et maintenance :**

### **1. Pour renouveler une licence :**
- Créer une nouvelle licence avec une nouvelle durée
- L'ancienne licence sera automatiquement remplacée

### **2. Pour révoquer une licence :**
- Utiliser `removeLicense()` pour supprimer la licence
- L'application reviendra en mode démo

### **3. Pour migrer vers un système de licences en ligne :**
- Remplacer les fonctions de stockage local par des appels API
- Ajouter une vérification côté serveur
- Implémenter un système de clés d'activation

---

**© 2025 [VOTRE NOM] - Tous droits réservés** 