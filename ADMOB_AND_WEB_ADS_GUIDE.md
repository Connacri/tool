# Guide Complet : Monétisation & Publicités (AdMob Android & Web) — AutoPost Studio

Ce document explique en détail le fonctionnement du système publicitaire intégré à **AutoPost Studio**, déclenché automatiquement à chaque export, téléchargement individuel ou sauvegarde HD.

---

## 1. Vue d'Ensemble & Fonctionnement Général

Le système publicitaire utilise une architecture hybride intelligente :

```
                        Clic de l'utilisateur
            [Télécharger cette diapo HD] ou [Exporter le lot ZIP]
                                   │
                                   ▼
                    adManager.triggerAd(options)
                                   │
                 ┌─────────────────┴─────────────────┐
                 ▼                                   ▼
        Sur Smartphone Android                 Sur Navigateur Web
          (Application Native)                   (Site / PWA)
                 │                                   │
                 ▼                                   ▼
   Google AdMob Interstitial           Interstitiel Publicitaire Web
   (Plein écran natif Android)         (Modal immersif avec décompte 4s)
                 │                                   │
                 ▼                                   ▼
       Fermeture de l'annonce              Fin du décompte ou Clic
                 └─────────────────┬─────────────────┘
                                   │
                                   ▼
                    Exécution du Téléchargement
                 (Génération Canvas HD / Fichier ZIP)
```

---

## 2. Fonctionnement sur le Web (Navigateur & PWA)

Sur le web, les SDK natifs Android ne sont pas disponibles. Le système déclenche automatiquement le composant **`AdInterstitialModal`** :

1. **Déclenchement immédiat** : Dès que l'utilisateur clique sur *Télécharger cette diapo HD*, *Exporter le lot (ZIP)* ou envoie vers un Webhook.
2. **Compte à rebours de déblocage (4 secondes)** :
   - Affiche une annonce visuelle sponsorisée (Canva, Buffer, Hostinger ou vos propres partenaires/AdSense).
   - Un badge officiel indique : `Annonce Publicitaire · Téléchargement HD`.
   - Pendant 4 secondes, l'utilisateur découvre l'annonce avec le temps restant affiché en temps réel.
3. **Déblocage & Téléchargement automatique** :
   - Dès la fin du décompte, le bouton passe en vert vibrant : `Télécharger mon fichier HD maintenant`.
   - L'utilisateur clique (ou l'action se valide) et le canvas haute définition (PNG 1080x1080, 1080x1920, 1080x1350...) se génère et se télécharge instantanément sur son disque.
4. **Tolérance aux pannes** : Si l'utilisateur clique sur la croix `X`, le téléchargement est simplement annulé sans altérer son projet ni ses diapos.

---

## 3. Fonctionnement sur Android (Google Play & APK)

Sur l'application native Android compilée avec Capacitor :

1. **Détection native automatique** : Le service détecte `Capacitor.isNativePlatform() === true`.
2. **Affichage de l'interstitiel plein écran** : L'app sollicite Google Play Services pour afficher une publicité interstitielle officielle AdMob.
3. **Événement `onAdDismissed`** : Dès que l'utilisateur ferme la publicité (après le délai imposé par Google), le callback est appelé et le téléchargement HD du visuel ou de l'archive ZIP s'effectue dans le stockage de l'appareil.
4. **Fallback sécurisé** : Si le téléphone est en mode avion (hors ligne) ou si l'ID d'annonce AdMob est en cours de validation chez Google, l'interstitiel web prend automatiquement le relais pour que l'utilisateur ne soit **jamais bloqué**.

---

## 4. Identifiants de Test vs Production

Par défaut, l'application est configurée avec les **identifiants de test officiels de Google AdMob** :

| Type | Identifiant de Test Google | Rôle |
|---|---|---|
| **App ID Android** | `ca-app-pub-3940256099942544~3347511713` | Identifie l'application auprès de Google Play Services |
| **Interstitial Ad Unit** | `ca-app-pub-3940256099942544/1033173712` | Déclenche l'annonce interstitielle de test |

> ⚠️ **Important pour la publication sur Google Play Store :**
> Lors des tests et du développement, l'utilisation des IDs de test est **obligatoire** selon les règles de Google pour éviter le bannissement de votre compte AdMob.
> 
> Quand vous serez prêt à publier sur Google Play :
> 1. Rendez-vous sur votre compte [Google AdMob](https://admob.google.com).
> 2. Créez une application Android "AutoPost Studio".
> 3. Créez un bloc d'annonces de type **Interstitiel**.
> 4. Remplacez la valeur `com.google.android.gms.ads.APPLICATION_ID` dans `android/app/src/main/AndroidManifest.xml` par votre véritable App ID (`ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX`).
> 5. Renseignez votre bloc d'annonce dans `.env` :
>    ```env
>    VITE_ADMOB_INTERSTITIAL_ID=ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX
>    ```

---

## 5. Fichiers Modifiés & Architecture

- **`src/services/adService.ts`** : Gestionnaire universel qui intercepte les téléchargements et coordonne l'affichage mobile ou web.
- **`src/components/AdInterstitialModal.tsx`** : Modal d'annonce interstitielle web avec décompte, créatif sponsorisé et déclenchement sécurisé du téléchargement HD.
- **`src/components/CanvasPreview.tsx`** : Bouton de téléchargement individuel d'une diapo HD relié au gestionnaire publicitaire.
- **`src/components/AutomatedExportModal.tsx`** : Export global ZIP HD et dispatch webhook reliés au gestionnaire publicitaire.
- **`src/App.tsx`** : Montage du composant `AdInterstitialModal` au niveau racine.
- **`android/app/src/main/AndroidManifest.xml`** : Balise `<meta-data android:name="com.google.android.gms.ads.APPLICATION_ID" ... />` configurée.
