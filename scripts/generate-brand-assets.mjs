/**
 * Generation des sources d'assets Android (icone + splash) a partir du logo
 * vectoriel public/icon.svg, via sharp.
 *
 * Pourquoi ne pas utiliser directement le SVG :
 * @capacitor/assets attend des PNG d'une taille precise (1024x1024 pour
 * l'icone, 2732x2732 pour le splash). Un SVG ne peut pas garantir ces
 * dimensions, ni la taille exacte de la zone de securite affichee par Android 12.
 *
 * Sorties (dossier assets/ attendu par @capacitor/assets) :
 *   assets/icon-only.png        1024x1024  icone pleine, avec le fond arrondi
 *   assets/icon-foreground.png  1024x1024  glyphe seul, pour l'icone adaptative
 *   assets/icon-background.png  1024x1024  fond uni, pour l'icone adaptative
 *   assets/splash.png           2732x2732  splash sur fond de marque
 *   assets/splash-dark.png      2732x2732  variante sombre
 */
import { readFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import sharp from 'sharp';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const assetsDir = join(root, 'assets');
mkdirSync(assetsDir, { recursive: true });

const svg = readFileSync(join(root, 'public', 'icon.svg'), 'utf8');
const bgLight = '#0d0d16';
const bgDark = '#05050a';

/**
 * Rend le logo sans le fond arrondi : le glyphe seul, transparent autour.
 * Android masque lui-meme l'icone adaptative (cercle, carre arrondi, teaser),
 * garder le fond arrondi ici produirait un double arrondi et des bordsDX
 * transparents sur certains lanceurs.
 */
function foregroundSvg() {
  return svg
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<rect width="512" height="512" rx="112"[^/]*\/>/g, '')
    .replace(/<circle cx="256" cy="256" r="160"[^/]*\/>/g, '')
    .replace(
      /<rect x="116" y="116" width="280" height="280" rx="64" fill="url\(#brandGrad\)"\/>/,
      '<rect x="126" y="126" width="260" height="260" rx="60" fill="url(#brandGrad)"/>'
    )
    .replace(
      /<rect x="132" y="132" width="248" height="248" rx="50"[^/]*\/>/,
      '<rect x="142" y="142" width="228" height="228" rx="46" fill="#0d0d16" fill-opacity="0.92"/>'
    );
}

async function main() {
  // 1. Icone pleine (fond arrondi inclus) : utilisee par les lanceurs
  //    precedents et par l'icone "launcher" de l'app.
  await sharp(Buffer.from(svg), { density: 384 })
    .resize(1024, 1024)
    .png()
    .toFile(join(assetsDir, 'icon-only.png'));

  // 2. Icone adaptative : glyphe sur 1024x1024 avec la zone de securite
  //    respecte. Android 12+ reserve les 66% centraux au glyphe, d'ou le
  //    retrait a ~62% pour eviter que le logo soit coupe par un masque rond.
  await sharp(Buffer.from(foregroundSvg()), { density: 384 })
    .resize(660, 660)
    .extend({
      top: 182,
      bottom: 182,
      left: 182,
      right: 182,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toFile(join(assetsDir, 'icon-foreground.png'));

  // 3. Fond de l'icone adaptative. L'aplat evite tout degrade visible sur
  //    les=uicones adaptatifs, qui appliquent un masque sur le calque.
  await sharp({
    create: {
      width: 1024,
      height: 1024,
      channels: 4,
      background: bgLight,
    },
  })
    .png()
    .toFile(join(assetsDir, 'icon-background.png'));

  // 4. Splash : logo centre sur fond de marque. 2732x2732 est la taille de
  //    reference Android ; @capacitor/assets la recadre ensuite pour chaque
  //    densite et chaque orientation.
  for (const [name, background] of [
    ['splash.png', bgLight],
    ['splash-dark.png', bgDark],
  ]) {
    const logo = await sharp(Buffer.from(foregroundSvg()), { density: 384 })
      .resize(760, 760)
      .png()
      .toBuffer();
    await sharp({
      create: { width: 2732, height: 2732, channels: 4, background },
    })
      .composite([{ input: logo, gravity: 'center' }])
      .png()
      .toFile(join(assetsDir, name));
  }

  const files = [
    'icon-only.png',
    'icon-foreground.png',
    'icon-background.png',
    'splash.png',
    'splash-dark.png',
  ];
  for (const file of files) {
    const meta = await sharp(join(assetsDir, file)).metadata();
    console.log(`  ${file.padEnd(24)} ${meta.width}x${meta.height}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
