/**
 * Relit les slots de versionCode de CI deja occupes pour une version donnee.
 *
 * Entree  : JSON sur stdin, de la forme [{ "tag_name": "..." }, ...] — celle de
 *           l'API GitHub « list releases ».
 * Sortie : « 1,3,4 » sur stdout, sans doublon, dans l'ordre.
 *
 * Pourquoi l'API et pas « gh release list »
 * -----------------------------------------
 * « gh » a besoin d'un GH_TOKEN explicite pour fonctionner dans un workflow, et
 * le token fourni par defaut a `actions/checkout` ne lui est pas transmis. C'est
 * ce qui faisait echouer le premier run (exit 4, « set the GH_TOKEN
 * environment variable »). Utiliser l'API directement evite d'ajouter un secret
 * dans une etape de build : c'est une lecture publique, et le depot est public.
 *
 * Pourquoi cette source et pas les tags git
 * -----------------------------------------
 * Un build de main ne cree volontairement aucun tag — c'est ce qui hadonne
 * evite de pollu l'historique avec des tags build-* parasites. L'historique des
 * tags ne dit donc rien de ce qui a deja ete distribue, alors que Google Play
 * refuse deux APK de meme versionCode. Les releases, elles, sont creees pour
 * chaque build de main, et constituent la seule source a jour de ce que le Play
 * Console a recu.
 *
 * Exit 0 avec une sortie vide signifie « aucun slot occupe », cas normal pour la
 * premiere version d'une plage. Toute autre anomalie doit faire echouer le build :
 * une erreur de lecture qui retournerait une liste vide attribuerait un
 * versionCode deja pris, et le Play Console le refuserait trois jours plus tard,
 * sans lien de causalite visible avec la cause reelle.
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
    `[ci-slots] ERREUR : reponse de l'API GitHub illisible (${error.message}). ` +
      'Sans elle, le versionCode attribuer pourrait deja etre pris.'
  );
  process.exit(1);
}

if (!Array.isArray(releases)) {
  console.error('[ci-slots] ERREUR : reponse inattendue de l API GitHub (tableau attendu).');
  process.exit(1);
}

for (const [index, release] of releases.entries()) {
  if (!release || typeof release !== 'object') {
    console.error(
      `[ci-slots] ERREUR : release ${index} invalide. Le format attendu est celui de l'API GitHub « list releases ».`
    );
    process.exit(1);
  }
  if (typeof release.tag_name !== 'string' && typeof release.name !== 'string') {
    console.error(
      `[ci-slots] ERREUR : release ${index} sans tag_name ni name lisible. ` +
        'Le format attendu est celui de l API « list releases ».'
    );
    process.exit(1);
  }
}

// Le tag d'une release d'archive vaut « build-<run> » et ne porte pas le
// suffixe -ci.N ; c'est le corps (« AutoPost Studio 1.0.5-ci.2 (build 123) »)
// qui le porte. On lit donc le nom affiche, pas l'identifiant du tag.
const pattern = /^AutoPost Studio (\d+\.\d+\.\d+)-ci\.(\d+)/;
const slots = new Set();

for (const release of releases) {
  const match = pattern.exec(release.name ?? '');
  if (match && match[1] === base) {
    slots.add(Number(match[2]));
  }
}

process.stdout.write([...slots].sort((a, b) => a - b).join(','));
