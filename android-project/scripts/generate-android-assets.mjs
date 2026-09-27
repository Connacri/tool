// Génère les sources requises par @capacitor/assets (icônes adaptatives
// Android + splash screen) à partir du même SVG de marque que le PWA
// (public/icon.svg), sans dupliquer le design à la main.
//
// Convention @capacitor/assets : un dossier assets/ à la racine contenant
// icon-foreground.png (emblème seul, fond transparent, zone de sécurité
// centrale) + icon-background.png (fond plein cadre carré, sans coins
// arrondis — Android applique son propre masque de forme) + icon.png (icône
// combinée pour les contextes non-adaptatifs) + splash.png (écran de
// démarrage natif).
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const assetsDir = path.resolve('assets');
if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir, { recursive: true });

// --- Background : dégradé plein cadre carré, SANS coins arrondis (rx=0) et
// sans l'emblème "AP" — reprend exactement les mêmes couleurs et le même
// halo que public/icon.svg pour rester cohérent avec le PWA, mais sans le
// rectangle arrondi (le masque de forme est appliqué nativement par Android
// au moment de l'affichage, pas dans l'image source).
const backgroundSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0a0a0f"/>
      <stop offset="50%" stop-color="#121124"/>
      <stop offset="100%" stop-color="#07070a"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" fill="url(#bgGrad)"/>
  <circle cx="256" cy="256" r="160" fill="#6366f1" opacity="0.12" filter="blur(24px)"/>
</svg>
`;

// --- Foreground : uniquement le badge + emblème "AP", fond transparent.
// Android réserve une zone de sécurité centrale (~66% du canevas) pour le
// contenu du foreground car les launchers appliquent des masques ronds,
// squircle ou carrés qui rognent les bords — le badge (280/512 ≈ 55% du
// design original) tient déjà confortablement dans cette zone.
const foregroundSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="brandGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#818cf8"/>
      <stop offset="50%" stop-color="#6366f1"/>
      <stop offset="100%" stop-color="#4f46e5"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="#4f46e5" flood-opacity="0.45"/>
    </filter>
  </defs>
  <g filter="url(#shadow)">
    <rect x="116" y="116" width="280" height="280" rx="64" fill="url(#brandGrad)"/>
    <rect x="132" y="132" width="248" height="248" rx="50" fill="#0d0d16" fill-opacity="0.92"/>
    <path d="M196 332 L256 180 L316 332" fill="none" stroke="url(#brandGrad)" stroke-width="26" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M216 284 L296 284" fill="none" stroke="url(#brandGrad)" stroke-width="24" stroke-linecap="round"/>
    <path d="M336 176 L342 192 L358 198 L342 204 L336 220 L330 204 L314 198 L330 192 Z" fill="#ffffff"/>
    <circle cx="256" cy="226" r="10" fill="#ffffff"/>
  </g>
</svg>
`;

async function generate() {
  console.log('Génération des assets Android (icônes adaptatives + splash)...');

  const originalSvgBuffer = fs.readFileSync(path.resolve('public/icon.svg'));

  // icon-background.png — 1024x1024, plein cadre, sans transparence.
  await sharp(Buffer.from(backgroundSvg)).resize(1024, 1024).png().toFile(path.join(assetsDir, 'icon-background.png'));
  console.log('Créé assets/icon-background.png');

  // icon-foreground.png — 1024x1024, fond transparent.
  await sharp(Buffer.from(foregroundSvg)).resize(1024, 1024).png().toFile(path.join(assetsDir, 'icon-foreground.png'));
  console.log('Créé assets/icon-foreground.png');

  // icon.png — design original complet (coins arrondis inclus), pour les
  // contextes non-adaptatifs (ex. favicon store listing, anciens devices).
  await sharp(originalSvgBuffer).resize(1024, 1024).png().toFile(path.join(assetsDir, 'icon.png'));
  console.log('Créé assets/icon.png');

  // splash.png — écran de démarrage natif : fond uni identique au thème de
  // l'app (#0a0a0c, cohérent avec capacitor.config.json/manifest PWA) avec
  // l'emblème centré à taille modeste (évite qu'il paraisse écrasant sur un
  // canevas large comme recommandé par @capacitor/assets, 2732x2732).
  const splashEmblem = await sharp(Buffer.from(foregroundSvg)).resize(600, 600).toBuffer();
  await sharp({
    create: { width: 2732, height: 2732, channels: 4, background: { r: 10, g: 10, b: 12, alpha: 1 } },
  })
    .composite([{ input: splashEmblem, gravity: 'center' }])
    .png()
    .toFile(path.join(assetsDir, 'splash.png'));
  console.log('Créé assets/splash.png');

  console.log('Terminé.');
}

generate().catch((err) => {
  console.error('Erreur lors de la génération des assets Android:', err);
  process.exit(1);
});
