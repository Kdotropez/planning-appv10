# 📋 Manuel d'Utilisation - Planning App v9

**Version :** 1.0.0  
**Éditeur :** Nicolas Lefevre  
**Copyright :** © 2025 Nicolas Lefevre - Tous droits réservés

---

## 🎯 Table des Matières

1. [Introduction](#introduction)
2. [Installation et Démarrage](#installation-et-démarrage)
3. [Interface Principale](#interface-principale)
4. [Configuration Initiale](#configuration-initiale)
5. [Gestion des Boutiques](#gestion-des-boutiques)
6. [Gestion des Employés](#gestion-des-employés)
7. [Planification des Semaines](#planification-des-semaines)
8. [Fonctionnalités Avancées](#fonctionnalités-avancées)
9. [Export et Import](#export-et-import)
10. [Système de Licences](#système-de-licences)
11. [Dépannage](#dépannage)
12. [Support](#support)

---

## 📖 Introduction

**Planning App v9** est une application web moderne et intuitive conçue pour la gestion des plannings d'équipe dans le commerce de détail. Elle permet de créer et gérer facilement les horaires de travail pour plusieurs boutiques et employés.

### ✨ Fonctionnalités Principales

- **Gestion multi-boutiques** : Gérez plusieurs magasins depuis une seule interface
- **Planification intuitive** : Interface drag-and-drop pour créer les horaires
- **Calculs automatiques** : Heures travaillées, pauses, congés
- **Recaps détaillés** : Rapports par semaine, mois et employé
- **Export/Import** : Sauvegarde et restauration des données
- **Système de licences** : Protection et contrôle d'accès

---

## 🚀 Installation et Démarrage

### Accès à l'Application

1. **Ouvrez votre navigateur web** (Chrome, Firefox, Safari, Edge)
2. **Accédez à l'URL** fournie par votre administrateur
3. **L'application se charge automatiquement**

### Première Utilisation

Lors de votre première connexion, vous devrez :
1. **Activer votre licence** (voir section "Système de Licences")
2. **Configurer vos boutiques et employés**
3. **Créer votre premier planning**

---

## 🖥️ Interface Principale

### Écran de Démarrage

L'écran principal propose trois options :

- **🆕 Nouveau Planning** : Créer un nouveau projet de planning
- **📁 Importer** : Restaurer des données sauvegardées
- **🗝️ Gestionnaire de Licences** : Accès administrateur (si autorisé)

### Navigation

L'application utilise un système de navigation par étapes :

1. **Configuration** → 2. **Boutiques** → 3. **Employés** → 4. **Sélection Semaine** → 5. **Planning**

---

## ⚙️ Configuration Initiale

### Étape 1 : Configuration Générale

1. Cliquez sur **"Nouveau Planning"**
2. Configurez les paramètres de base :
   - **Heures d'ouverture** : Heures de début et fin de journée
   - **Pauses** : Durée et horaires des pauses
   - **Créneaux** : Intervalles de temps pour les plannings

### Étape 2 : Création des Boutiques

1. **Ajoutez vos boutiques** une par une
2. Pour chaque boutique, renseignez :
   - **Nom de la boutique**
   - **Adresse** (optionnel)
   - **Heures d'ouverture spécifiques** (si différentes)

### Étape 3 : Gestion des Employés

1. **Ajoutez vos employés** à chaque boutique
2. Pour chaque employé, indiquez :
   - **Nom et prénom**
   - **Poste** (optionnel)
   - **Boutiques d'affectation** (peut travailler dans plusieurs boutiques)

---

## 🏪 Gestion des Boutiques

### Ajouter une Boutique

1. Dans l'étape "Boutiques", cliquez sur **"Ajouter une boutique"**
2. Remplissez les informations :
   - **Nom** : Nom de votre magasin
   - **Adresse** : Adresse complète (optionnel)
3. Cliquez sur **"Ajouter"**

### Modifier une Boutique

1. Cliquez sur le **nom de la boutique** dans la liste
2. Modifiez les informations souhaitées
3. Cliquez sur **"Sauvegarder"**

### Supprimer une Boutique

⚠️ **Attention** : La suppression d'une boutique supprime également tous les plannings associés.

1. Cliquez sur **"Supprimer"** à côté de la boutique
2. Confirmez la suppression

---

## 👥 Gestion des Employés

### Ajouter un Employé

1. Sélectionnez la **boutique** où ajouter l'employé
2. Cliquez sur **"Ajouter un employé"**
3. Remplissez les informations :
   - **Nom** : Nom de famille
   - **Prénom** : Prénom
   - **Poste** : Fonction (optionnel)
4. Cliquez sur **"Ajouter"**

### Affecter un Employé à Plusieurs Boutiques

1. Dans l'étape "Employés", sélectionnez l'employé
2. Cliquez sur **"Modifier"**
3. Cochez les **boutiques** où l'employé peut travailler
4. Cliquez sur **"Sauvegarder"**

### Supprimer un Employé

1. Cliquez sur **"Supprimer"** à côté de l'employé
2. Confirmez la suppression

---

## 📅 Planification des Semaines

### Sélection de la Semaine

1. **Choisissez une semaine** dans le calendrier
2. Ou sélectionnez une **semaine sauvegardée** dans la liste
3. Cliquez sur **"Continuer"**

### Interface de Planning

L'écran de planning affiche :
- **Boutique sélectionnée** en haut
- **Semaine** avec dates
- **Employés** dans la colonne de gauche
- **Créneaux horaires** en colonnes

### Créer un Planning

#### Méthode 1 : Clic Simple
1. **Cliquez sur un créneau** (intersection employé/horaire)
2. Le créneau devient **vert** (présence)
3. **Cliquez à nouveau** pour marquer "Congé" (orange)
4. **Troisième clic** pour effacer

#### Méthode 2 : Planning Rapide
1. **Sélectionnez un employé**
2. **Cliquez sur "Planifier"**
3. Choisissez les **heures de début et fin**
4. Sélectionnez les **jours de la semaine**
5. Cliquez sur **"Appliquer"**

### Modifier un Planning

- **Cliquez sur un créneau** pour le modifier
- Les changements sont **sauvegardés automatiquement**

---

## 🔧 Fonctionnalités Avancées

### Navigation dans le Planning

Utilisez les boutons de navigation :
- **"Semaine précédente"** / **"Semaine suivante"** : Changer de semaine
- **Sélecteur de boutique** : Changer de boutique
- **"Retour Employés"** : Modifier la liste des employés
- **"Retour Boutique"** : Changer de boutique
- **"Retour Semaine"** : Choisir une autre semaine
- **"Retour Configuration"** : Modifier la configuration

### Sélecteur de Mois

- **Cliquez sur le sélecteur de mois** à côté de "Semaine suivante"
- **Choisissez le mois** souhaité
- L'application affiche la **première semaine** du mois sélectionné

### Bouton Réinitialiser

1. Cliquez sur **"Réinitialiser"**
2. Choisissez l'option :
   - **"Tous les employés"** : Efface tous les créneaux cochés
   - **"Employé spécifique"** : Efface seulement les créneaux d'un employé
3. Confirmez la réinitialisation

---

## 📊 Recaps et Rapports

### Boutons de Recap

L'interface propose plusieurs boutons de recap :

#### 🏪 Recap Boutique
- **"SEMAINE"** : Détails de la semaine pour la boutique actuelle
- **"MOIS"** : Résumé du mois pour la boutique actuelle
- **"MOIS GLOBAL"** : Total des heures du mois pour la boutique actuelle

#### 👥 Recap Employés
- **"SEMAINE"** : Planning détaillé de la semaine par employé
- **"MOIS"** : Résumé mensuel par employé (toutes boutiques)
- **"MOIS DÉTAIL"** : Planning complet du mois par employé

### Contenu des Recaps

#### Recap SEMAINE
- **Colonnes** : Jour, Entrée, Pause, Retour, Sortie, Heures effectives
- **Congés** : Affichés avec ☀️
- **Export** : PDF et Excel disponibles

#### Recap MOIS
- **Résumé** : Total des heures par boutique
- **Format** : Tableau avec boutiques en colonnes
- **Total** : Ligne "Total mois" en bas

#### Recap MOIS DÉTAIL
- **Planning complet** : Tous les jours du mois
- **Couleurs** : Code couleur par semaine
- **Multi-boutiques** : Toutes les boutiques dans un seul tableau
- **Impression** : Optimisé pour format A4

---

## 💾 Export et Import

### Exporter les Données

1. Cliquez sur **"Export"** dans l'écran de démarrage
2. L'application génère un **fichier JSON**
3. **Téléchargez** le fichier sur votre ordinateur
4. **Sauvegardez** le fichier en lieu sûr

### Importer les Données

1. Cliquez sur **"Importer"** dans l'écran de démarrage
2. **Sélectionnez** le fichier JSON sauvegardé
3. Cliquez sur **"Importer"**
4. L'application restaure **toutes vos données**

### Export des Recaps

Dans chaque modal de recap :
- **Bouton "PDF"** : Génère un rapport PDF
- **Bouton "Excel"** : Génère un fichier Excel
- **Bouton "Imprimer"** (MOIS DÉTAIL) : Impression directe

---

## 🗝️ Système de Licences

### Types de Licences

#### Licence Provisoire
- **Durée** : 7 jours
- **Limites** : 2 boutiques, 8 employés, 6 semaines
- **Renouvellement** : Possible
- **Fonctionnalités** : Complètes avec watermark

#### Licence Illimitée
- **Durée** : 100 ans
- **Limites** : Aucune
- **Renouvellement** : Non nécessaire
- **Fonctionnalités** : Toutes sans watermark

### Activation d'une Licence

#### Méthode 1 : Licence Provisoire
1. **Remplissez** votre nom et email
2. Cliquez sur **"Activer Licence Provisoire"**
3. La licence est **activée immédiatement**

#### Méthode 2 : Clé de Licence
1. **Collez** la clé fournie par votre administrateur
2. **Remplissez** votre nom et email
3. Cliquez sur **"Activer avec Clé"**
4. La licence est **activée**

### Renouvellement de Licence

Pour une licence provisoire :
1. Cliquez sur **"Renouveler Licence"**
2. La licence est **prolongée de 7 jours**

### Informations de Licence

L'application affiche :
- **Type de licence** active
- **Date d'expiration**
- **Limites** actuelles
- **Statut** (active/expirée)

---

## 🔧 Dépannage

### Problèmes Courants

#### L'application ne se charge pas
- **Vérifiez** votre connexion internet
- **Actualisez** la page (F5)
- **Videz le cache** du navigateur

#### Les données ne se sauvegardent pas
- **Vérifiez** que JavaScript est activé
- **Essayez** un autre navigateur
- **Vérifiez** l'espace disque disponible

#### Erreur de licence
- **Vérifiez** que votre licence n'est pas expirée
- **Contactez** votre administrateur pour renouveler
- **Vérifiez** que vous n'avez pas dépassé les limites

#### Les recaps ne s'affichent pas
- **Vérifiez** qu'il y a des données de planning
- **Actualisez** la page
- **Vérifiez** que la semaine/mois contient des données

### Messages d'Erreur

#### "Format de clé incorrect"
- **Vérifiez** que la clé est copiée complètement
- **Vérifiez** qu'il n'y a pas d'espaces en trop
- **Demandez** une nouvelle clé à votre administrateur

#### "Cette clé a déjà été utilisée"
- **Demandez** une nouvelle clé à votre administrateur
- **Vérifiez** que vous n'avez pas déjà activé cette clé

#### "Limite de licence atteinte"
- **Supprimez** des boutiques/employés/semaines
- **Demandez** une licence illimitée
- **Contactez** votre administrateur

---

## 📞 Support

### Contact Administrateur

Pour toute question ou problème :
- **Email** : [Votre email de support]
- **Téléphone** : [Votre numéro de support]
- **Horaires** : [Vos horaires de support]

### Informations Techniques

- **Version** : Planning App v9 v1.0.0
- **Navigateur recommandé** : Chrome, Firefox, Safari, Edge
- **Résolution minimale** : 1024x768
- **Connexion** : Internet requise pour le chargement initial

### Mise à Jour

L'application se met à jour automatiquement. Aucune action de votre part n'est nécessaire.

---

## 📝 Notes Importantes

### Sauvegarde Régulière

- **Exportez** vos données régulièrement
- **Sauvegardez** les fichiers d'export en lieu sûr
- **Testez** la restauration de temps en temps

### Bonnes Pratiques

- **Planifiez** vos semaines à l'avance
- **Vérifiez** les recaps avant validation
- **Utilisez** les fonctionnalités d'export pour vos rapports
- **Contactez** le support en cas de doute

### Sécurité

- **Ne partagez pas** vos clés de licence
- **Fermez** l'application après utilisation
- **Ne laissez pas** l'application ouverte sur un ordinateur public

---

**© 2025 Nicolas Lefevre - Tous droits réservés**

*Ce manuel est protégé par les droits d'auteur. Toute reproduction sans autorisation est interdite.* 