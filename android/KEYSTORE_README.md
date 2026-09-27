# Signature & Build de Production — AutoPost Studio (Android)

Ce guide couvre les 2 étapes restantes avant de pouvoir soumettre l'app sur
Google Play Console : générer ta clé de signature, puis produire le fichier
`.aab` (Android App Bundle) signé que Play Console attend.

⚠️ **Ceci se fait sur TA machine, jamais dans un environnement partagé ou
temporaire** (le mot de passe et la clé privée générés ici ne doivent
transiter nulle part ailleurs que ton propre poste).

---

## Étape 1 — Générer le keystore de signature (une seule fois, à vie)

Le keystore est le fichier qui prouve que c'est bien toi qui publies les
mises à jour de l'app. **Si tu le perds ou oublies le mot de passe, tu ne
pourras plus jamais mettre à jour cette app sur Play Store** — il faudrait
publier une toute nouvelle fiche avec un nouvel `applicationId`. Sauvegarde-le
immédiatement après génération (gestionnaire de mots de passe + copie hors
ligne, par exemple sur une clé USB rangée en lieu sûr).

Ouvre un terminal à la racine du projet et lance :

```bash
keytool -genkeypair -v \
  -keystore autopost-studio-release.keystore \
  -alias autopost-studio \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -storetype PKCS12
```

`keytool` va te poser plusieurs questions **de façon interactive et
masquée** (le mot de passe ne s'affiche pas à l'écran pendant la saisie) :

- **Mot de passe du keystore** (`storePassword`) — choisis-en un fort, unique,
  et note-le immédiatement.
- **Mot de passe de la clé** (`keyPassword`) — tu peux appuyer sur `Entrée`
  pour réutiliser le même que le keystore, ou en définir un différent.
- **Prénom Nom (CN)** : ton nom ou celui de Cabalink.
- **Unité organisationnelle (OU)** : laisse vide ou "Development".
- **Organisation (O)** : `Cabalink`
- **Ville (L)**, **État/Province (ST)** : Oran / Oran (ou laisse vide).
- **Code pays à 2 lettres (C)** : `DZ`

À la fin, confirme avec `oui` (ou `yes`). Un fichier
`autopost-studio-release.keystore` apparaît à la racine du projet.

### Renseigner `keystore.properties`

Crée un fichier `android/keystore.properties` (il est déjà exclu du Git via
`.gitignore` — il ne sera jamais commité) avec ce contenu, en remplaçant les
mots de passe par les tiens :

```properties
storeFile=../autopost-studio-release.keystore
storePassword=TON_MOT_DE_PASSE_KEYSTORE
keyAlias=autopost-studio
keyPassword=TON_MOT_DE_PASSE_CLE
```

`android/app/build.gradle` a déjà été configuré pour lire ce fichier
automatiquement et signer le build `release` s'il est présent — tu n'as rien
d'autre à modifier.

---

## Étape 2 — Configurer l'URL de l'API backend

Avant de builder, `server.ts` doit être déployé quelque part en public
(Render, Railway, Fly.io, un VPS...) — l'app mobile ne peut pas appeler
`localhost`. Une fois déployé, crée un fichier `.env.production` à la racine
(non commité, comme `.env`) :

```
VITE_API_BASE_URL=https://ton-serveur-deploye.exemple.com
```

Sans cette étape, l'app s'installera et fonctionnera normalement, mais les
3 fonctionnalités qui appellent le serveur resteront indisponibles :
génération de phrases par IA, génération des légendes réseaux sociaux, et
envoi vers un webhook d'export automatisé.

---

## Étape 3 — Builder l'AAB signé

```bash
npm run cap:sync
cd android
./gradlew bundleRelease
```

Le fichier signé apparaît à :

```
android/app/build/outputs/bundle/release/app-release.aab
```

C'est ce fichier `.aab` (pas un `.apk`) qu'il faut uploader dans Play
Console, dans la section "Production" (ou "Test interne" pour un premier
essai avant publication publique).

### Pour un simple APK de test (installation directe sur un téléphone, sans passer par Play Store)

```bash
cd android
./gradlew assembleRelease
```

Résultat : `android/app/build/outputs/apk/release/app-release.apk` —
installable directement via `adb install` ou en transférant le fichier sur
le téléphone (il faudra autoriser "Sources inconnues" dans les réglages
Android, une seule fois).

---

## Récapitulatif du versioning

À chaque nouvelle mise à jour publiée sur Play Store, il faut OBLIGATOIREMENT
incrémenter `versionCode` (un entier qui doit toujours augmenter, ex. 1 → 2 →
3...) dans `android/app/build.gradle`. `versionName` (ex. "1.0", "1.1") est
juste le numéro affiché à l'utilisateur, à ajuster librement.

```gradle
defaultConfig {
    ...
    versionCode 2       // incrémenté à chaque nouvelle soumission
    versionName "1.1"   // libre, format lisible par l'utilisateur
}
```
