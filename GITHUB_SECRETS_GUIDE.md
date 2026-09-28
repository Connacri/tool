# 🔐 Guide des Secrets et Variables GitHub Actions

Ce guide récapitule exactement toutes les variables et secrets à configurer dans votre dépôt GitHub pour le CI/CD automatique (déploiement Web sur **GitHub Pages** et génération des fichiers **APK** & **AAB** Android).

---

## 📍 Où les ajouter sur GitHub ?

1. Rendez-vous sur votre dépôt GitHub (ex. `https://github.com/votre-nom/votre-depot`).
2. Cliquez sur l'onglet **Settings** (Paramètres en haut à droite).
3. Dans le menu de gauche, descendez jusqu'à la section **Secrets and variables** puis cliquez sur **Actions**.
4. Vous avez 2 onglets :
   - **Secrets** (pour les mots de passe, clés d'API et le keystore Android) : bouton vert **New repository secret**.
   - **Variables** (pour les URLs publiques et identifiants non secrets) : bouton vert **New repository variable**.

---

## 1. Secrets recommandés pour la signature Android (Google Play & APK Release)

Ces 4 secrets permettent à GitHub Actions de signer automatiquement l'**APK Release** et l'**AAB (Android App Bundle)** avec votre propre certificat officiel pour publier sur Google Play.

| Nom du Secret GitHub | Description | Exemple / Valeur |
| :--- | :--- | :--- |
| `ANDROID_KEYSTORE_BASE64` | Le contenu de votre fichier keystore converti en texte Base64. | *Voir commande ci-dessous* |
| `KEYSTORE_PASSWORD` | Le mot de passe de votre fichier keystore. | `VotreMotDePasseFort123` |
| `KEY_ALIAS` | L'alias de la clé de signature dans le keystore. | `autopost-studio` |
| `KEY_PASSWORD` | Le mot de passe de la clé (souvent identique au keystore). | `VotreMotDePasseFort123` |

> 💡 **Comment obtenir la valeur de `ANDROID_KEYSTORE_BASE64` ?**
> 1. Générez votre keystore sur votre terminal :
>    ```bash
>    keytool -genkeypair -v -keystore autopost-studio-release.keystore -alias autopost-studio -keyalg RSA -keysize 2048 -validity 10000 -storetype PKCS12
>    ```
> 2. Convertissez-le en Base64 :
>    - **Sur Linux / WSL / Git Bash :**
>      ```bash
>      base64 -w 0 autopost-studio-release.keystore
>      ```
>    - **Sur macOS :**
>      ```bash
>      base64 -i autopost-studio-release.keystore
>      ```
>    - **Sur Windows PowerShell :**
>      ```powershell
>      [Convert]::ToBase64String([IO.File]::ReadAllBytes("autopost-studio-release.keystore")) | Set-Clipboard
>      ```
> 3. Copiez tout le texte généré et collez-le dans la valeur du secret `ANDROID_KEYSTORE_BASE64`.

*Remarque : Si vous ne configurez pas ces 4 secrets tout de suite, le workflow GitHub Actions génère automatiquement un certificat CI autonome valide pour que l'APK et l'AAB se compilent sans erreur.*

---

## 2. Variables / Secrets pour l'application (Backend, IA Gemini & Pubs)

Vous pouvez les ajouter soit dans **Repository Secrets**, soit dans **Repository Variables** :

| Nom | Type recommandé | Description |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | **Variable** ou **Secret** | **Très important pour l'application Android mobile :** L'adresse URL publique de votre serveur backend hébergé (ex. `https://autopost-api.onrender.com` ou `https://api.votre-domaine.com`). Permet à l'application mobile installée sur téléphone de contacter le serveur pour générer des phrases par IA et créer les légendes. |
| `GEMINI_API_KEY` | **Secret** | Clé API Google Gemini (utilisée si vous hébergez le backend `server.ts` sur un service comme Render, Railway ou VPS). |
| `VITE_ADMOB_APP_ID` *(Optionnel)* | **Variable** | Identifiant de votre application AdMob (ex: `ca-app-pub-XXXXX~XXXXX`). Si absent, l'ID de test officiel Google est utilisé par défaut. |
| `VITE_ADMOB_INTERSTITIAL_ID` *(Optionnel)* | **Variable** | Identifiant de bloc d'annonce interstitielle AdMob (ex: `ca-app-pub-XXXXX/XXXXX`). |
| `VITE_ADSENSE_CLIENT_ID` *(Optionnel)* | **Variable** | Identifiant client Google AdSense pour le Web (ex: `ca-pub-XXXXXXXXXXXXX`). |

---

## 3. Configuration requise pour GitHub Pages (1 seule fois)

Sur votre dépôt GitHub :
1. Allez dans **Settings** > **Pages**.
2. Sous **Build and deployment** > **Source**, sélectionnez **GitHub Actions**.
3. À chaque commit ou push sur `main`, votre site web sera déployé automatiquement et vos fichiers APK/AAB seront téléchargeables dans l'onglet **Actions** > **Artifacts**.
