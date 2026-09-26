# 🚀 AutoPost Studio — Générateur Visuel & Export Réseaux Sociaux

> Créez automatiquement des séries de visuels percutants avec texte superposé sur images, filtres de flou dégradé cinématographique, voiles de couleurs dégradées artistiques (*duotone*), adaptation instantanée aux ratios des réseaux sociaux (1:1, 9:16, 4:5, 16:9, 2:3), logo personnalisable, sauvegarde automatique dans le `localStorage` et exportation automatisée (ZIP HD, Webhook, Calendrier .ICS).

---

## 🌟 Fonctionnalités Principales

### 1. 🖼️ Gestion des Phrases & Images Superposées
- **Édition complète par diapo** : Phrase principale, titre thématique (*kicker*), sous-titre / auteur et date/heure de publication.
- **Importation par lot** : Collez vos 6 phrases d'un coup ou téléversez vos 6 images en 1 clic.
- **Génération IA intégrée** : Générez 6 citations percutantes et accroches thématiques en un clic.
- **Typographie soignée** : 4 styles au choix (*Éditorial Fraunces, Avant-Garde Syne, Moderne Plus Jakarta, Monospace JetBrains*), alignement (Gauche, Centre, Droite), position (Haut, Centre, Bas) et taille ajustable.

### 2. 🎨 Filtres Dégradés & Effets Visuels (Nouveau !)
- **🌫️ Filtre de Flou Dégradé (Gradient Blur)** :
  - Applique un flou directionnel progressif pour magnifier la lisibilité des textes tout en conservant le piqué de l'image.
  - **5 directions au choix** :
    - *Vers le Bas* (flou progressif en bas, parfait pour les phrases positionnées en bas).
    - *Vers le Haut* (flou progressif en haut, idéal pour les phrases en haut).
    - *Tilt-Shift* (bande nette centrale avec haut et bas floutés, effet miniature cinéma).
    - *Radial* (vignettage flou circulaire centré).
    - *Complet* (fond flouté doux et velouté).
  - Curseur d'intensité du flou (4 px à 28 px).
- **🌈 Filtre de Couleurs Dégradées (Duotone / Mood Filter)** :
  - Voile bicolore artistique superposé pour donner une signature chromatique unique à votre carrousel.
  - **10 Palettes Prédéfinies** : *Sunset Gold, Cyber Teal, Warm Amber, Deep Indigo, Rose Quartz, Emerald Mist, Néon Violet, Pêche Sunset, Cyberpunk, Film Noir*.
  - **Mode Personnalisé** : Choix libre de la Couleur 1 et de la Couleur 2 avec sélecteur de couleurs interactif.
  - Réglage de l'angle du dégradé (0° à 360°).
  - Réglage de l'opacité (10% à 95%).
  - Modes de fusion professionnels : *Incrustation (Overlay), Lumière douce (Soft-light), Produit sombre (Multiply), Superposition claire (Screen), Couleur pure (Color), Normal*.
  - Rendu en direct dans le navigateur ET appliqué au pixel près dans les exports Canvas HD (PNG et ZIP).

### 3. 📐 Adaptation Multi-Ratios pour Tous les Réseaux Sociaux
- **1:1 Carré** (1080 × 1080 px) : *Instagram Feed, LinkedIn Post, Facebook*
- **9:16 Story / Reel** (1080 × 1920 px) : *Instagram Stories, Reels, TikTok, YouTube Shorts*
- **4:5 Portrait Feed** (1080 × 1350 px) : *Format portrait optimal pour maximiser la visibilité dans les flux Instagram et LinkedIn*
- **16:9 Paysage** (1920 × 1080 px) : *X / Twitter, LinkedIn Banner, YouTube*
- **2:3 Éditorial** (1000 × 1500 px) : *Pinterest Pin, Affiches*

### 4. 🏷️ Logo Prédéfini ou Personnalisé
- Intégration de 4 logos prédéfinis minimalistes (*Studio Minimal, Aura Crest, Modern Bold, Clean Geometric*).
- Téléversement de votre propre logo PNG/SVG transparent.
- Positionnement (*Haut Gauche, Haut Droite, Bas Gauche, Bas Droite, Haut Centré*), échelle, opacité et gestion du pseudo social (`@moncompte`).

### 5. 💾 Sauvegarde Automatique (`localStorage`) & Responsive 100%
- Sauvegarde continue de toutes vos données (textes, images, filtres, styles, ratios, logos) dans le stockage local du navigateur.
- Restauration instantanée au rechargement de la page, avec horodatage en direct.
- Bouton de réinitialisation vers les modèles d'origine.
- Interface responsive fluide : bascule *Éditeur / Aperçu* sur smartphone et tablette tactile.

### 6. ⚡ Automatisation & Exportation
- **Export ZIP Haute Définition** : Génère en 1 clic l'archive ZIP contenant les 6 images PNG haute résolution accompagnées d'un fichier `automation_manifest.json`.
- **Partage Direct** : Partage natif vers Instagram, WhatsApp, LinkedIn ou X via l'API Web Share.
- **Webhook d'automatisation** : Envoi direct du payload vers **Make.com**, **Zapier**, **Buffer** ou **n8n** avec programmation horaire.
- **Légendes & Hashtags IA** : Descriptions optimisées prêtes à être copiées pour Instagram, LinkedIn, X et TikTok.
- **Export Calendrier (.ICS)** : Synchronisation du calendrier éditorial avec Google Calendar, Notion ou Apple Calendar.

---

## 🛠️ Résolution de l'Erreur GitHub Actions

### ❌ Description de l'erreur rencontrée :
```text
Run actions/setup-node@v4
...
Error: Dependencies lock file is not found in /home/runner/work/... Supported file patterns: package-lock.json,npm-shrinkwrap.json,yarn.lock
```

### 🔍 Pourquoi cette erreur s'est produite ?
Lorsque vous activez GitHub Pages via l'interface web de GitHub avec un modèle générique, l'action `actions/setup-node@v4` est configurée avec l'option `cache: 'npm'`. 
Cette option exige obligatoirement la présence du fichier `package-lock.json` dans le dépôt Git. Si ce fichier n'a pas été commité et poussé (`git push`), GitHub Actions s'arrête immédiatement avec cette erreur.

---

### ✅ Comment corriger l'erreur en 2 étapes rapides :

#### Étape 1 : Pousser le fichier `package-lock.json`
Assurez-vous que le fichier `package-lock.json` est bien ajouté à Git et envoyé sur votre dépôt :

```bash
# Vérifier l'état des fichiers
git status

# Ajouter le fichier de lock
git add package-lock.json .github/workflows/deploy.yml

# Commiter
git commit -m "Fix: ajout package-lock.json et workflow GitHub Pages"

# Pousser sur GitHub
git push origin main
```
*(Si votre branche principale s'appelle `master`, remplacez `main` par `master`)*.

#### Étape 2 : Activer GitHub Actions pour GitHub Pages
1. Allez sur votre dépôt GitHub : `https://github.com/<votre-pseudo>/<nom-du-repo>`
2. Cliquez sur l'onglet **Settings** (Paramètres).
3. Dans la colonne de gauche, cliquez sur **Pages**.
4. Sous **Build and deployment > Source**, choisissez **GitHub Actions** (au lieu de *Deploy from a branch*).
5. Rendez-vous dans l'onglet **Actions** de votre dépôt : le workflow **Déploiement GitHub Pages** se lance automatiquement.
6. Une fois terminé (icône verte ✅, ~1 minute), votre site sera directement en ligne à l'adresse :
   `https://<votre-pseudo>.github.io/<nom-du-repo>/`

---

## 🌐 Pourquoi le site ne s'affichait pas (page blanche) et comment c'est résolu ?

Sur GitHub Pages, les applications sont servies dans un sous-dossier correspondant au nom de votre projet :
`https://pseudo.github.io/nom-du-projet/`

Par défaut, Vite utilise des chemins absolus (`/assets/...`). Sur GitHub Pages, le navigateur cherchait donc les scripts à la racine du domaine (`https://pseudo.github.io/assets/...`) au lieu du sous-dossier du projet, causant des erreurs **404 Not Found**.

### 🔧 Solutions implémentées dans ce projet :
1. **`base: './'`** dans `vite.config.ts` : tous les chemins d'assets générés sont désormais relatifs, fonctionnant sur n'importe quel domaine ou sous-dossier.
2. **Workflow résilient dans `.github/workflows/deploy.yml`** :
   - Installation tolérante : teste l'existence du lockfile (`npm install --legacy-peer-deps`).
   - Compilation automatique du dossier statique `dist`.
   - Déploiement automatique sécurisé via les actions officielles GitHub Pages (`actions/deploy-pages@v4`).

---

## 💻 Installation & Lancement en Local

### Prérequis
- [Node.js](https://nodejs.org/) (version 18, 20 ou 22)
- npm

### Commandes

```bash
# 1. Cloner le projet
git clone https://github.com/<votre-utilisateur>/<nom-du-depot>.git
cd <nom-du-depot>

# 2. Installer les dépendances
npm install

# 3. Lancer en mode développement
npm run dev

# 4. Compiler pour la production
npm run build
```

Le serveur de développement est accessible à l'adresse : **http://localhost:3000**.

---

## 🏗️ Structure du Projet

```text
├── .github/
│   └── workflows/
│       └── deploy.yml          # Workflow de déploiement GitHub Pages automatisé
├── src/
│   ├── assets/
│   │   └── images/             # Bibliothèque d'images photographiques HD
│   ├── components/
│   │   ├── Header.tsx          # En-tête avec navigation, autosave et mode mobile
│   │   ├── EditorSidebar.tsx   # Contrôles complets (phrases, photos, filtres dégradés, ratios, typographie, logo)
│   │   ├── CanvasPreview.tsx   # Rendu interactif (Grille 6 diapos, Focus diapo unique, Mockup réseau)
│   │   ├── AutomatedExportModal.tsx # Export ZIP HD, Webhooks (Make/Zapier), Calendrier .ICS
│   │   ├── BatchInputModal.tsx       # Modal de collage en lot de 6 phrases
│   │   └── SocialCopyModal.tsx       # Générateur de légendes et hashtags IA
│   ├── constants/
│   │   └── presets.ts          # Palettes de filtres, ratios, 6 diapos initiales et logos
│   ├── utils/
│   │   ├── canvasRenderer.ts   # Moteur Canvas pixel-perfect avec flou dégradé et voiles de couleur
│   │   └── storage.ts          # Module de sauvegarde automatique localStorage (debounce 300ms)
│   ├── types.ts                # Typage TypeScript
│   ├── App.tsx                 # Composant racine
│   ├── main.tsx                # Entrée React
│   └── index.css               # Feuilles de style Tailwind CSS
├── package.json
├── package-lock.json           # Fichier de verrouillage requis pour GitHub Actions
├── server.ts                   # Serveur Express optionnel avec Gemini API
├── tsconfig.json
└── vite.config.ts              # Configuration Vite avec base: './'
```

---

## 🛡️ Technologies

- **React 19** & **TypeScript**
- **Vite 8** (avec configuration relative `base: './'`)
- **Tailwind CSS v4**
- **JSZip** (compression d'archives ZIP côté navigateur)
- **Lucide React** (icônes)
- **HTML5 Canvas 2D API** (rendu haute fidélité avec composition graphique et masques de flou)

---

## 📄 Licence

Projet sous licence MIT — Libre d'utilisation pour vos projets personnels et commerciaux.
