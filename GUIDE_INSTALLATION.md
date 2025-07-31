# 🚀 Guide d'Installation - Planning App v9

**Version :** 1.0.0  
**Administrateur :** Nicolas Lefevre  
**Copyright :** © 2025 Nicolas Lefevre - Tous droits réservés

---

## 📋 Table des Matières

1. [Prérequis](#prérequis)
2. [Installation Locale](#installation-locale)
3. [Déploiement Vercel](#déploiement-vercel)
4. [Déploiement GitHub Pages](#déploiement-github-pages)
5. [Configuration des Licences](#configuration-des-licences)
6. [Maintenance](#maintenance)

---

## ⚙️ Prérequis

### Système Requis

- **Node.js** : Version 16 ou supérieure
- **npm** : Version 8 ou supérieure
- **Git** : Pour le contrôle de version
- **Navigateur moderne** : Chrome, Firefox, Safari, Edge

### Vérification

```bash
node --version
npm --version
git --version
```

---

## 💻 Installation Locale

### Étape 1 : Cloner le Projet

```bash
git clone [URL_DU_REPO]
cd planning-appv9
```

### Étape 2 : Installer les Dépendances

```bash
npm install
```

### Étape 3 : Lancer en Mode Développement

```bash
npm run dev
```

L'application sera accessible sur : `http://localhost:5173`

### Étape 4 : Build de Production

```bash
npm run build
```

Les fichiers de production seront dans le dossier `dist/`

---

## ☁️ Déploiement Vercel

### Méthode 1 : Interface Web

1. **Connectez-vous** sur [vercel.com](https://vercel.com)
2. **Importez** votre projet GitHub
3. **Configurez** les paramètres :
   - Framework Preset : Vite
   - Build Command : `npm run build`
   - Output Directory : `dist`
4. **Déployez**

### Méthode 2 : CLI Vercel

```bash
# Installer Vercel CLI
npm i -g vercel

# Se connecter
vercel login

# Déployer
vercel

# Déployer en production
vercel --prod
```

### Configuration Vercel

Le fichier `vercel.json` est déjà configuré :

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}
```

---

## 📚 Déploiement GitHub Pages

### Étape 1 : Configuration

1. **Poussez** votre code sur GitHub
2. **Allez** dans Settings > Pages
3. **Sélectionnez** "GitHub Actions" comme source

### Étape 2 : Workflow Automatique

Le fichier `.github/workflows/deploy.yml` est déjà configuré :

```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [ main ]
jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '16'
      - run: npm install
      - run: npm run build
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

### Étape 3 : Activation

1. **Poussez** sur la branche `main`
2. **Vérifiez** l'action dans l'onglet Actions
3. **Activez** GitHub Pages dans Settings > Pages

---

## 🗝️ Configuration des Licences

### Accès au Générateur de Licences

#### Méthode 1 : Interface Web
1. **Ajoutez** `?admin=licenses` à l'URL de votre application
2. **Exemple** : `https://votre-app.vercel.app/?admin=licenses`

#### Méthode 2 : Fichier Standalone
1. **Ouvrez** `public/license-generator-simple.html`
2. **Utilisez** directement dans le navigateur

### Création de Licences

#### Licence Provisoire
1. **Remplissez** les informations client
2. **Sélectionnez** "Provisoire (7 jours renouvelable)"
3. **Cliquez** sur "Créer Licence"

#### Licence Illimitée
1. **Remplissez** les informations client
2. **Sélectionnez** "Illimitée (jusqu'à révocation)"
3. **Cliquez** sur "Créer Licence"

### Génération de Clés

#### Clé Unique
1. **Sélectionnez** le type de licence
2. **Cliquez** sur "Générer Clé"
3. **Copiez** la clé générée

#### Clés en Lot
1. **Cliquez** sur "Générer Toutes les Clés"
2. **Récupérez** les clés provisoire et illimitée

### Envoi aux Clients

1. **Copiez** la clé appropriée
2. **Envoyez** par email/SMS au client
3. **Incluez** les instructions d'activation

---

## 🔧 Maintenance

### Mises à Jour

#### Code Source
```bash
git pull origin main
npm install
npm run build
```

#### Déploiement Automatique
- **Vercel** : Mise à jour automatique à chaque push
- **GitHub Pages** : Mise à jour via GitHub Actions

### Sauvegarde

#### Données Utilisateurs
- **Export** : Les utilisateurs exportent leurs données
- **Backup** : Sauvegarde régulière des fichiers d'export

#### Configuration
- **Licences** : Sauvegardées dans localStorage
- **Clés utilisées** : Traçabilité dans localStorage

### Monitoring

#### Vercel
- **Dashboard** : Analytics et performances
- **Logs** : Erreurs et accès
- **Uptime** : Disponibilité de l'application

#### GitHub
- **Actions** : Statut des déploiements
- **Issues** : Suivi des problèmes
- **Releases** : Gestion des versions

---

## 🛠️ Dépannage

### Problèmes Courants

#### Build Échoue
```bash
# Nettoyer le cache
npm run clean
rm -rf node_modules
npm install

# Vérifier les dépendances
npm audit fix
```

#### Déploiement Échoue
- **Vérifiez** les logs dans Vercel/GitHub Actions
- **Testez** en local : `npm run build`
- **Vérifiez** la configuration dans `vite.config.js`

#### Licences Ne Fonctionnent Pas
- **Vérifiez** le fichier `licenseManager.js`
- **Testez** le générateur de licences
- **Vérifiez** les clés utilisées dans localStorage

### Logs et Debug

#### Mode Développement
```bash
npm run dev
# Ouvrir la console du navigateur (F12)
```

#### Mode Production
- **Vercel** : Logs dans le dashboard
- **GitHub** : Logs dans Actions

---

## 📞 Support Technique

### Contact Développeur

- **Email** : [Votre email]
- **GitHub** : [Votre profil GitHub]
- **Documentation** : [Lien vers la documentation]

### Ressources

- **Manuel Utilisateur** : `MANUEL_UTILISATION.md`
- **Code Source** : [URL du repository]
- **Démo** : [URL de démonstration]

---

## 📝 Notes Importantes

### Sécurité

- **Clés de licence** : Ne jamais partager
- **Accès admin** : Limiter aux administrateurs
- **HTTPS** : Toujours utiliser en production

### Performance

- **Build** : Optimisé pour la production
- **Cache** : Configuration appropriée
- **CDN** : Utilisation de Vercel/GitHub Pages

### Évolutivité

- **Modulaire** : Architecture extensible
- **API** : Prêt pour intégrations futures
- **Base de données** : Peut être ajoutée si nécessaire

---

**© 2025 Nicolas Lefevre - Tous droits réservés**

*Ce guide est protégé par les droits d'auteur. Toute reproduction sans autorisation est interdite.* 