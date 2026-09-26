# 🚀 AutoPost Studio — Générateur Visuel & Export Réseaux Sociaux

> Créez automatiquement des séries de visuels percutants avec texte superposé sur images, adaptation instantanée aux ratios des réseaux sociaux (1:1, 9:16, 4:5, 16:9, 2:3), logo personnalisable, sauvegarde automatique et exportation automatisée (ZIP HD, Webhook, Calendrier .ICS).

---

## 🌟 Fonctionnalités Principales

- **🖼️ 6 Phrases & 6 Images Superposées** :
  - Génération visuelle avec typographie soignée (*Éditorial Serif, Avant-Garde Syne, Moderne Pro, Monospace*).
  - Styles de contraste avancés : dégradé cinématographique (*scrim*), verre dépoli (*frosted glass*), ombre nette ou cadre minimaliste bordé.
  - Placement du texte (Haut, Centre, Bas) et alignement (Gauche, Centré, Droite).
  - Titres *kicker*, signatures d'auteur et numérotation automatique des diapositives (`01 / 06`).
  - Importation par lot : collez vos phrases d'un coup ou téléversez vos 6 images simultanément.

- **📐 Adaptation Multi-Ratios pour Tous les Réseaux Sociaux** :
  - **1:1 Carré** (1080 × 1080 px) : *Instagram Feed, LinkedIn Post, Facebook*
  - **9:16 Story / Reel** (1080 × 1920 px) : *Instagram Stories, Reels, TikTok, YouTube Shorts*
  - **4:5 Portrait Feed** (1080 × 1350 px) : *Format optimal pour maximiser la visibilité dans les flux Instagram et LinkedIn*
  - **16:9 Paysage** (1920 × 1080 px) : *X / Twitter, LinkedIn Banner, YouTube*
  - **2:3 Éditorial** (1000 × 1500 px) : *Pinterest Pin, Affiches*

- **🏷️ Logo Prédéfini ou Personnalisé** :
  - Intégration de logos prédéfinis minimalistes (*Studio Minimal, Aura Crest, Modern Bold, Clean Geometric*).
  - Possibilité de téléverser votre propre logo transparent (PNG ou SVG).
  - Emplacement paramétrable (*Haut Gauche, Haut Droite, Bas Gauche, Bas Droite, Haut Centré*), réglage d'échelle, d'opacité et de pseudo social (`@moncompte`).

- **💾 Sauvegarde Automatique (`localStorage`)** :
  - Chaque modification apportée aux textes, images, ratios, styles et logos est automatiquement enregistrée en continu dans votre navigateur.
  - Restauration instantanée au rechargement de la page, avec indicateur d'horodatage en direct.
  - Bouton de réinitialisation si vous souhaitez retrouver les modèles d'origine.

- **⚡ Automatisation & Exportation** :
  - **Export ZIP Haute Définition** : téléchargez en 1 clic l'ensemble des 6 visuels en PNG haute résolution dans une archive ZIP avec fichier de métadonnées `automation_manifest.json`.
  - **Partage Direct** : partage direct vers Instagram, WhatsApp, X ou LinkedIn via l'API Web Share native de votre appareil.
  - **Webhook Réseaux Sociaux** : déclenchez directement vos scénarios d'automatisation sur **Make.com**, **Zapier**, **Buffer** ou **n8n** avec le payload complet (visuels, textes, programmations).
  - **Générateur de Légendes & Hashtags IA** : génère des légendes prêtes à publier pour Instagram, LinkedIn, X et TikTok.
  - **Export Calendrier (.ICS)** : synchronisez votre planning de publication avec Google Calendar, Notion ou Apple Calendar.

- **📱 100% Responsive** :
  - Interface adaptative pour mobile, tablette et grand écran.
  - Sélecteur tactile rapide *Édition / Aperçu* sur smartphone.

---

## 🛠️ Pourquoi le site ne s'affichait pas sur GitHub Pages et comment le régler ?

Sur GitHub Pages, les sites sont hébergés sous un sous-dossier correspondant au nom de votre dépôt :
`https://<votre-nom-d-utilisateur>.github.io/<nom-du-depot>/`

Par défaut, Vite cherchait les fichiers JavaScript et CSS à la racine du domaine (`/assets/...` au lieu de `./assets/...`), ce qui provoquait une page blanche avec des erreurs **404 Not Found**.

### ✅ Les corrections appliquées :
1. **`base: './'`** a été configuré dans `vite.config.ts` : les chemins d'accès aux fichiers compilés sont désormais relatifs et fonctionnent quel que soit le nom de votre dépôt GitHub.
2. Les images prédéfinies sont désormais directement importées en TypeScript, ce qui garantit qu'elles sont incluses et compressées dans le dossier `dist/assets/` lors du build.
3. Un fichier de déploiement automatique **GitHub Actions** a été ajouté dans `.github/workflows/deploy.yml`.

---

## 🌐 Guide de Déploiement sur GitHub Pages (Méthode Recommandée)

### Option 1 : Déploiement Automatique via GitHub Actions (Le plus simple)

1. **Poussez votre code sur GitHub** :
   ```bash
   git add .
   git commit -m "Configuration GitHub Pages et base relative"
   git push origin main
   ```

2. **Activez GitHub Actions dans les paramètres de votre dépôt GitHub** :
   - Allez sur votre dépôt GitHub.
   - Cliquez sur l'onglet **Settings** (Paramètres).
   - Dans le menu de gauche, cliquez sur **Pages**.
   - Dans la section **Build and deployment > Source**, sélectionnez **GitHub Actions** (au lieu de *Deploy from a branch*).

3. **C'est tout !**
   - GitHub va automatiquement lancer le workflow de compilation `.github/workflows/deploy.yml`.
   - Dès que le workflow est vert (environ 1 minute), votre site sera accessible en ligne sur l'URL indiquée en haut de la page **Settings > Pages** !

---

### Option 2 : Déploiement Manuel avec la branche `gh-pages`

Si vous préférez compiler vous-même avant d'envoyer :

1. Installez `gh-pages` (facultatif mais pratique) :
   ```bash
   npm install --save-dev gh-pages
   ```

2. Compilez le projet :
   ```bash
   npm run build
   ```

3. Déployez le contenu du dossier `dist` :
   ```bash
   npx gh-pages -d dist
   ```

4. Dans **Settings > Pages**, sélectionnez la branche `gh-pages` et le dossier `/ (root)`.

---

## 💻 Installation et Lancement en Local

### Prérequis
- [Node.js](https://nodejs.org/) (version 18 ou supérieure recommandée)
- npm ou yarn

### Commandes

```bash
# 1. Cloner le projet
git clone https://github.com/<votre-utilisateur>/<nom-du-depot>.git
cd <nom-du-depot>

# 2. Installer les dépendances
npm install

# 3. Lancer en mode développement (avec serveur full-stack Express + Vite)
npm run dev

# 4. Compiler pour la production (génère le dossier statique /dist)
npm run build
```

Le serveur local sera accessible sur **http://localhost:3000**.

---

## 🏗️ Structure du Projet

```text
├── .github/
│   └── workflows/
│       └── deploy.yml         # Workflow GitHub Actions pour déploiement auto sur GitHub Pages
├── src/
│   ├── assets/
│   │   └── images/            # Visuels photographiques haute résolution
│   ├── components/
│   │   ├── Header.tsx         # En-tête avec indicateur de sauvegarde auto et bascule mobile
│   │   ├── EditorSidebar.tsx  # Panneau de contrôle (textes, images, ratios, styles, logos, export)
│   │   ├── CanvasPreview.tsx  # Rendu interactif (Grille 6x, Diapo unique, Mockup smartphone)
│   │   ├── AutomatedExportModal.tsx # Export ZIP, Webhooks (Make/Zapier), Calendrier .ICS
│   │   ├── BatchInputModal.tsx      # Collage rapide en lot de phrases
│   │   └── SocialCopyModal.tsx      # Générateur de légendes et hashtags IA
│   ├── constants/
│   │   └── presets.ts         # Modèles de logos, ratios et 6 diapositives initiales
│   ├── utils/
│   │   ├── canvasRenderer.ts  # Moteur de rendu Canvas HD (1080p, 2K) pixel-perfect
│   │   └── storage.ts         # Gestionnaire de sauvegarde automatique localStorage
│   ├── types.ts               # Définitions TypeScript
│   ├── App.tsx                # Composant racine
│   ├── main.tsx               # Point d'entrée React
│   └── index.css              # Styles Tailwind CSS
├── server.ts                  # Serveur Express optionnel avec intégration Gemini API
├── vite.config.ts             # Configuration Vite avec base: './'
└── package.json
```

---

## 🛡️ Technologies Utilisées

- **React 19** & **TypeScript**
- **Vite 8** (avec configuration `base: './'` pour support universel des hébergements statiques)
- **Tailwind CSS v4**
- **JSZip** (compression et génération d'archives ZIP côté client)
- **Lucide React** (icônes modernes)
- **HTML5 Canvas API** (génération d'images haute fidélité sans dépendance tierce lourde)

---

## 📄 Licence

Ce projet est sous licence MIT. Libre d'utilisation pour vos projets personnels et professionnels.
