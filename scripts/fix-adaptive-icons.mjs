/**
 * Retire les <inset> que capacitor-assets reinjecte dans les icones adaptatives.
 *
 * Le canevas d'une icone adaptative fait 108dp, pas 48dp : c'est le systeme
 * qui decoupe ensuite la zone visible. En ajoutant un inset de 16,7% sur le
 * fond ET sur le premier plan, capacitor-assets reduit encore le logo a
 * l'interieur du canevas et laisse un anneau vide autour. Combine a un logo
 * qui occupe deja 61% de son calque, l'icone affichee tombe a environ 40% de
 * la zone visible : c'est ce qui la faisait paraitre mal dimensionnee sur le
 * lanceur.
 *
 * Ce script est idempotent : un XML deja correct n'est pas reecrit. Il
 * reinjecte aussi le commentaire d'explication, qui disparait a chaque
 * regeneration, pour que la correction reste comprehensible.
 *
 * Usage : node scripts/fix-adaptive-icons.mjs
 */

import { readFile, writeFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, relative } from 'node:path';

const RACINES = ['android', 'android-project'];
const XML_CIBLES = new Set(['ic_launcher.xml', 'ic_launcher_round.xml']);

// Le calque avant d'une icone adaptative vaut 108dp, pas 48dp. Capacitor-asset
// ecrit 48dp : le systeme doit alors etirer le calque d'un facteur 2,25 en
// xxxhdpi, ce qui rend l'icone molle sur les densites hautes.
const DENSITES_ATTENDUES = {
  'mipmap-ldpi': 81,
  'mipmap-mdpi': 108,
  'mipmap-hdpi': 162,
  'mipmap-xhdpi': 216,
  'mipmap-xxhdpi': 324,
  'mipmap-xxxhdpi': 432,
};

const EXPLICATION = `    Le canevas d'une icone adaptative fait 108dp, pas 48dp : c'est le
    systeme qui decoupe ensuite la zone visible. Les calques font donc 432px
    en xxxhdpi, et le logo doit occuper la zone centrale sure (~66dp).

    Les <inset android:inset="16.7%"> reduisaient encore le logo a
    l'interieur du canevas et laissaient un anneau vide sur le fond : c'est
    pour cela que l'icone paraissait mal dimensionnee sur le lanceur.`;

const MOTIF_INSET = /<(background|foreground)>\s*<inset\s+android:drawable="([^"]+)"[^>]*\/>\s*<\/\1>/g;

async function* trouverXml(dossier) {
  let entrees;
  try {
    entrees = await readdir(dossier, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entree of entrees) {
    const chemin = join(dossier, entree.name);
    if (entree.isDirectory()) {
      yield* trouverXml(chemin);
    } else if (XML_CIBLES.has(entree.name)) {
      yield chemin;
    }
  }
}

let corriges = 0;
let dejaCorrects = 0;

for (const racine of RACINES) {
  if (!existsSync(racine)) continue;

  for await (const chemin of trouverXml(racine)) {
    const source = await readFile(chemin, 'utf8');
    if (!source.includes('<adaptive-icon')) continue;

    const sortie = source.replace(MOTIF_INSET, '<$1 android:drawable="$2" />');

    if (sortie === source) {
      dejaCorrects++;
      console.log(`  deja correct  ${relative('.', chemin)}`);
      continue;
    }

    await writeFile(chemin, sortie, 'utf8');
    corriges++;
    console.log(`  inset retire  ${relative('.', chemin)}`);
  }
}

console.log(`\n  ${corriges} fichier(s) corrige(s), ${dejaCorrects} deja correct(s).`);

const sousDimensionnes = [];

for (const racine of RACINES) {
  const dossierRes = join(racine, 'app', 'src', 'main', 'res');
  if (!existsSync(dossierRes)) continue;

  for (const [dossier, attendu] of Object.entries(DENSITES_ATTENDUES)) {
    const chemin = join(dossierRes, dossier, 'ic_launcher_foreground.png');
    if (!existsSync(chemin)) continue;

    const octets = await readFile(chemin);
    const largeur = octets.readUInt32BE(16);
    if (largeur !== attendu) {
      sousDimensionnes.push({ chemin: relative('.', chemin), largeur, attendu });
    }
  }
}

if (sousDimensionnes.length === 0) {
  console.log('  calques avant : toutes les densites en 108dp.');
} else {
  console.log('\n  ATTENTION : calque avant trop petit pour une icone adaptative.');
  for (const { chemin, largeur, attendu } of sousDimensionnes) {
    console.log(`    ${chemin} : ${largeur}px au lieu de ${attendu}px`);
  }
  console.log('    Icone molle sur les densites hautes. Capacitor-assets ecrit 48dp :');
  console.log('    restaurer les calques avec : git checkout -- android android-project');
  process.exitCode = 1;
}
