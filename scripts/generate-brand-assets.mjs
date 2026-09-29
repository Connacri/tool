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

// Cible de remplissage : fraction du canevas occupee par le glyphe visible.
const ICON_CANVAS = 1024;
const SPLASH_CANVAS = 2732;
// Android 12+ reserve les 66% centraux au glyphe adaptatif. On vise 61% :
// assez pour que l'icone se voie sur un lanceur sombre, sans depasser la
// zone sure qu'un masque circulaire ou en carre arrondi finit par rogner.
// La valeur est legement inferieure a 61% parce que le degrade du logo
// déborde du rectangle de marque d'environ 10% : mesurer la sortie a 61%
// demande de demander ~55% sur le rectangle.
const ADAPTIVE_FILL = 0.55;
// Le splash est un carre de reference que @capacitor/assets recadre ensuite
// pour chaque densite et chaque orientation avec CENTER_CROP. Le recadrage
// conservant la fraction verticale, 26% ici donnent 26% de la hauteur sur
// l'ecran final, quelle que soit la densite.
const SPLASH_FILL = 0.26;

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

/**
 * Rend le glyphe seul, agrandi pour que sa partie visible occupe exactement
 * `fill` du canevas final.
 *
 * Pourquoi ne pas se fier au trim() : le rognage automatique se cale sur le
 * seuil de couleur et garde la bordure diffuse du degrade, dont l'ampleur
 * depend du rendu du SVG. Le resultat varie avec la palette, et il a ete
 * mesure a 82% du logo utile pour un seuil de 1. Une valeur de resize
 * calculée sur une image brute n'a donc aucune chance d'ouvrir juste.
 *
 * On passe par la geometrie : le rectangle de marque occupe 260 unites d'un
 * viewBox de 512, soit GLYPH_SPAN. Il suffit de rendre le viewBox entier a
 * la taille (canvas * fill / GLYPH_SPAN) pour que la partie visible tombe
 * pile sur la cible. Deterministe, et insensible au rendu.
 */
const GLYPH_SPAN = 260 / 512;

async function glyph(fill, canvas) {
  const side = Math.round((canvas * fill) / GLYPH_SPAN);
  const image = sharp(Buffer.from(foregroundSvg()), { density: 384 }).resize(side, side);
  if (side > canvas) {
    // Le viewBox rendu depasse le canevas final : ses marges transparentes
    //sortiraient, et sharp refuse de composer une image plus grande que la
    // cible. Le rectangle de marque est centre, on garde donc la zone
    // centree de la taille du canevas.
    const offset = Math.round((side - canvas) / 2);
    image.extract({ left: offset, top: offset, width: canvas, height: canvas });
  }
  return image.png().toBuffer();
}

async function main() {
  // 1. Icone pleine (fond arrondi inclus) : utilisee par les lanceurs
  //    precedents et par l'icone "launcher" de l'app.
  await sharp(Buffer.from(svg), { density: 384 })
    .resize(1024, 1024)
    .png()
    .toFile(join(assetsDir, 'icon-only.png'));

  // 2. Icone adaptative : glyphe sur 1024x1024, a 61% du canevas.
  await sharp({
    create: {
      width: ICON_CANVAS,
      height: ICON_CANVAS,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: await glyph(ADAPTIVE_FILL, ICON_CANVAS), gravity: 'center' }])
    .png()
    .toFile(join(assetsDir, 'icon-foreground.png'));

  // 3. Fond de l'icone adaptative. L'aplat evite tout degrade visible sur
  //    les=uicones adaptatifs, qui appliquent un masque sur le calque.
  await sharp({
    create: {
      width: ICON_CANVAS,
      height: ICON_CANVAS,
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
    const logo = await glyph(SPLASH_FILL, SPLASH_CANVAS);
    await sharp({
      create: { width: SPLASH_CANVAS, height: SPLASH_CANVAS, channels: 4, background },
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
