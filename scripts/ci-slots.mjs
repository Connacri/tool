/**
 * Relit les slots de versionCode de CI deja occupes pour une version donnee.
 *
 * Entree  : JSON renvoye par « gh release list --json name » sur stdin.
 * Sortie : « 1,3,4 » — les slots utilises, sans doublon, dans l'ordre.
 *
 * Pourquoi une source aussi externe au depot
 * ------------------------------------------
 * Un build de main ne peut pas deduire son versionCode des tags git : il n'en
 * cree volontairement aucun, donc l'historique des tags ne dit rien de ce qui a
 * deja ete distribue. Google Play refusant deux APK de meme versionCode, il
 * faut une source qui reflete ce que Play a reellement recu. Les noms de
 * releases sont cette source : chaque build de main en produit une, nommee
 * « AutoPost Studio <version>-ci.<slot> (build <run>) ».
 *
 * Exit 0 avec une sortie vide signifie « aucun slot occupe », ce qui est le
 * cas normal pour la premiere version de la plage. Une erreur de lecture de
 * l'entree JSON, elle, doit faire echouer le build : mieux vaut un run en
 * echec, visible, qu'un versionCode duplique refuse plus tard par le Play
 * Console, trois jours plus tard et sans lien avec la cause.
 */
import { readFileSync } from 'node:fs';

const base = (process.argv[2] ?? '').trim();
if (!base) {
  console.error('[ci-slots] ERREUR : nom de la version de base attendu en argument.');
  process.exit(1);
}

let releases;
try {
  releases = JSON.parse(readFileSync(0, 'utf8') || '[]');
} catch (error) {
  console.error(
    `[ci-slots] ERREUR : liste des releases illisible (${error.message}). ` +
      'Sans elle, le versionCode attribuer pourrait deja etre pris.'
  );
  process.exit(1);
}

if (!Array.isArray(releases)) {
  console.error('[ci-slots] ERREUR : liste des releases inattendue (tableau attendu).');
  process.exit(1);
}

// Chaque entree doit etre un objet portant un nom. Sans ce controle, une liste
// de la mauvaise forme produirait une sortie vide, donc « aucun slot occupe »,
// donc un versionCode deja pris : un echec silencieux aux consequences
// differees sur le Play Console, le pire des deux cas.
for (const [index, release] of releases.entries()) {
  if (!release || typeof release !== 'object' || typeof release.name !== 'string') {
    console.error(
      `[ci-slots] ERREUR : entree ${index} de la liste des releases sans nom lisible. ` +
        'Le format attendu est celui de « gh release list --json name ».'
    );
    process.exit(1);
  }
}

// Les releases officielles portent le nom de la version seule, les archives de
// main le suffixe -ci.<slot>. Le nom de release est donc la seule donnee qui
// distingue les deux, d'ou le choix de « --json name » dans le workflow.
const pattern = /^AutoPost Studio (\d+\.\d+\.\d+)-ci\.(\d+)/;
const slots = new Set();

for (const release of releases) {
  const match = pattern.exec(release?.name ?? '');
  if (match && match[1] === base) {
    slots.add(Number(match[2]));
  }
}

process.stdout.write([...slots].sort((a, b) => a - b).join(','));
