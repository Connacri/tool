/**
 * Calcul du versionName / versionCode Android a partir d'une version SemVer.
 *
 * Usage :
 *   node scripts/version.mjs            # deduit la version du tag git courant
 *   node scripts/version.mjs 1.2.3      # version explicite
 *   node scripts/version.mjs --ci 1.2.3 69   # build de CI, hors release
 *
 * Sortie (une ligne KEY=VALUE par sortie) :
 *   VERSION_NAME=1.2.3
 *   VERSION_CODE=1002003
 *   IS_PRERELEASE=false
 *   IS_RELEASE=true
 *
 * Regle de versionCode (norme Android / Google Play)
 * ------------------------------------------------
 * Play exige un versionCode strictement croissant et <= 2100000000. On l'derive
 * de la version SemVer plutot que de l'incrementer a la main, ce qui garantit
 * qu'il est reproductible depuis le tag et impossible a oublier :
 *
 *   versionCode = major * 1_000_000 + minor * 10_000 + patch * 10
 *
 * major est plafonne a 1999 pour rester sous le plafond de Play (2 009 009 990
 * < 2 100 000 000).
 *
 * Prereleases (1.2.0-rc.1)
 * -----------------------
 * Play refuse deux APK de meme versionCode, et une prerelease doit preceder sa
 * version finale tout en lui succedant dans l'ordre de publication. Chaque
 * version finale reserve donc dix codes : les neuf premiers, plus un, sont
 * pour ses prereleases.
 *
 *   1.2.0-rc.1 -> 1002011   1.2.0-rc.2 -> 1002012   1.2.0 -> 1002020
 *
 * Trois proprietes en decoulent : les prereleases d'une meme version sont
 * croissantes entre elles, elles restent inferieures a la finale, et elles
 * restent superieures a la finale precedente. Aucun code n'est partage.
 *
 * Pourquoi le facteur 10 sur le patch : sans lui, deux versions finales
 * consecutives occupent deux entiers adjacents (1.0.3 -> 1000003,
 * 1.0.4 -> 1000004) et il ne reste plus aucun entier entre elles ou placer une
 * prerelease. C'etait le defaut de l'encodage initial, qui attribuait une
 * prerelease a base - numero : rc.1 recevait base - 1 et rc.2 base - 2, donc
 * une version superieure se voyait attribuer un versionCode inferieur, que
 * Play rejette.
 *
 * Migration : la 1.0.3 publiee vaut 1000003 sous l'ancien encodage. Le
 * prochain tag calcule 1.0.4 -> 1000040, qui reste superieur, donc la
 * transition se fait sans saut de versionCode. Seuls les anciens tags
 * recalculeraient une valeur differente, ce qui est sans effet puisqu'ils ne
 * sont pas rebuildes.
 *
 * Builds de CI (--ci)
 * -------------------
 * Un build hors tag n'est pas une release : il ne doit pas consommer un slot de
 * prerelease, sinon le compteur de runs (non borne, deja a 69) deborderait la
 * plage de neuf codes de sa version de base.
 *
 * Chaque version finale reserve donc une plage complete pour ses builds de CI :
 * elle occupe le premier code, et les suivants jusqu'a la version finale
 * suivante sont attribues aux builds de main.
 *
 *   1.0.5        -> 1000050   (release, la finale)
 *   1.0.5-ci.1   -> 1000051   (push sur main)
 *   1.0.5-ci.2   -> 1000052
 *   1.0.6        -> 1000060   (relance la plage au multiple de 10 suivant)
 *
 * Deux proprietes en decoulent, toutes deux exigees par Google Play :
 * chaque APK a un versionCode unique, et l'ordre de publication reste coherent
 * (les builds de main occupent des codes strictement croissants, tous inferieurs
 * a la prochaine finale).
 *
 * Pourquoi une plage et non le versionCode de la base : Play refuse deux APK de
 * meme versionCode. Repartager celui de la base rendait l'archive de CI
 * inutilisable pour une soumission, alors que ces builds sont justement
 * installables et distribues.
 *
 * Comment les slots deja pris sont connus
 * --------------------------------------
 * Ni par les tags git, ni par GITHUB_RUN_NUMBER.
 *
 * Pas les tags : un build de main ne cree volontairement aucun tag (c'est
 * exactement ce qui a pollu le depot de tags build-* parasites), donc l'historique
 * des tags ne dit rien des codes deja distribues. Tenter cette deduplication
 * attribuait 1000051 a tous les builds, en boucle.
 *
 * Pas GITHUB_RUN_NUMBER : il est sans borne (on en est deja a 69) et ne tient
 * pas dans une plage de neuf codes.
 *
 * La seule source qui reflete ce que Google Play a recu est l'ensemble des
 * releases publiees. Comme chaque build de main produit desormais une release,
 * lister leurs noms suffit : le workflow extrait les suffixes « -ci.N » deja
 * utilises et les transmet a ce script, qui attribue le premier slot libre. Le
 * resultat est alors stable face a un run rejoue, a un build parallele ou a un
 * artefact expire, sans jamais reutiliser un code.
 *
 * Le suffixe « -ci.N » est un nom d'archive, pas une SemVer Android : il ne
 * doit jamais passer par parseVersion, qui l'interpreterait comme une prerelease
 * et lui attribuerait un autre code (1.0.5-ci.1 valait 1000041 par cette voie au
 * lieu de 1000051).
 *
 * Borne de la plage : CI_SLOTS codes par version, soit 9 apres la finale. Au
 * dela, le build echoue explicitement plutot que de deborder sur la version
 * suivante.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const MAX_VERSION_CODE = 2100000000;
const MAJOR_LIMIT = 1999;
const MINOR_LIMIT = 999;
const PATCH_LIMIT = 999;
// Codes reserves a chaque version finale pour ses prereleases. La finale occupe
// le premier de la plage, les prereleases les precedents (base - 9 a base - 1).
const PRERELEASE_SLOTS = 9;
// Codes reserves a chaque version finale pour ses builds de main, apres elle
// (base + 1 a base + 9). Les deux plages se rejoignent sans jamais se recouvrir.
const CI_SLOTS = 9;

function fail(message) {
  console.error(`[version] ERREUR : ${message}`);
  process.exit(1);
}

function readPackageVersion() {
  try {
    const pkg = JSON.parse(
      readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'package.json'), 'utf8')
    );
    return typeof pkg.version === 'string' ? pkg.version.trim() : '';
  } catch {
    return '';
  }
}

function readGitTag() {
  try {
    return execFileSync('git', ['describe', '--tags', '--exact-match'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return '';
  }
}

/**
 * Valide une version SemVer (sous-ensemble strict, sans '+build metadata' qui
 * n'a pas de sens pour un numero de version Android) et renvoie ses parties.
 */
function parseSemVer(raw) {
  const match = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?$/.exec(raw);
  if (!match) {
    fail(
      `"${raw}" n'est pas une version SemVer valide. Format attendu : MAJOR.MINOR.PATCH, ` +
        'eventuellement suivi de -rc.1, -beta.2, etc.'
    );
  }
  const [, major, minor, patch, prerelease] = match;
  return {
    major: Number(major),
    minor: Number(minor),
    patch: Number(patch),
    prerelease: prerelease ?? '',
  };
}

export function computeVersionCode({ major, minor, patch, prerelease }) {
  if (major > MAJOR_LIMIT) {
    fail(
      `versionCode trop grand : major=${major} alors que la limite est ${MAJOR_LIMIT} ` +
        '(contrainte de Google Play, pas un choix arbitraire).'
    );
  }
  if (minor > MINOR_LIMIT) fail(`minor doit rester <= ${MINOR_LIMIT} (versionCode : ${minor}).`);
  if (patch > PATCH_LIMIT) fail(`patch doit rester <= ${PATCH_LIMIT} (versionCode : ${patch}).`);

  const base = major * 1000000 + minor * 10000 + patch * 10;

  if (!prerelease) return base;

  // Ordre des prereleases : rc.1 < rc.2 < version finale. La sequence est
  // decalee de facon a rester dans la plage reservee au-dessus de la version
  // finale precedente, et non en dessous de la finale courante comme le
  // faisait le decalage base - numero, qui rendait chaque prerelease
  // successive inferieure a la precedente.
  const sequenceMatch = /(\d+)(?!.*\d)/.exec(prerelease);
  const sequence = sequenceMatch ? Number(sequenceMatch[1]) : 1;
  if (sequence > PRERELEASE_SLOTS) {
    fail(
      `suffixe de prerelease "${prerelease}" : le numero doit rester <= ${PRERELEASE_SLOTS}, ` +
        'une version finale ne reserve que ce nombre de codes a ses prereleases.'
    );
  }
  const code = base - (PRERELEASE_SLOTS + 1 - sequence);
  if (code <= 0) {
    fail(
      `versionCode negatif (${code}) pour "${prerelease}". ` +
        'Une prerelease doit etre associee a une version superieure a 0.0.0.'
    );
  }
  return code;
}

export function parseVersion(raw) {
  const trimmed = (raw ?? '').trim().replace(/^v/i, '');
  if (!trimmed) {
    fail(
      'aucune version fournie et aucun tag git detecte. ' +
        'Creez un tag (ex. git tag v1.0.0) ou passez la version en argument.'
    );
  }
  const parsed = parseSemVer(trimmed);
  const versionCode = computeVersionCode(parsed);
  if (versionCode > MAX_VERSION_CODE) {
    fail(`versionCode ${versionCode} depasse le maximum Google Play (${MAX_VERSION_CODE}).`);
  }
  return {
    versionName: trimmed,
    versionCode,
    isPrerelease: Boolean(parsed.prerelease),
    isRelease: true,
  };
}

/**
 * Version d'un build de main, hors tag : versionCode dans la plage CI de la
 * version de base, nom suffixe -ci.<slot> pour qu'il ne soit jamais confondu
 * avec une release. Voir la note « Builds de CI » en tete de fichier.
 *
 * `usedSlots` est la liste des slots deja occupes pour cette version de base,
 * relevee par le workflow dans les noms des releases existantes.
 */
export function buildCiVersion(baseVersion, usedSlots = []) {
  const base = parseVersion(baseVersion);
  const parts = /^(\d+)\.(\d+)\.(\d+)/.exec(base.versionName);
  const taken = new Set(usedSlots.map(Number));

  for (let slot = 1; slot <= CI_SLOTS; slot += 1) {
    const code = base.versionCode + slot;
    if (code > MAX_VERSION_CODE) break;
    if (!taken.has(slot)) {
      return {
        versionName: `${parts[1]}.${parts[2]}.${parts[3]}-ci.${slot}`,
        versionCode: code,
        isPrerelease: true,
        isRelease: false,
      };
    }
  }

  fail(
    `plus de slot de versionCode libre pour les builds de CI de ${base.versionName} ` +
      `(${CI_SLOTS} codes reserves, de ${base.versionCode + 1} a ${base.versionCode + CI_SLOTS} : ` +
      `slots ${Array.from(taken).sort((a, b) => a - b).join(', ')} deja pris). ` +
      'Publiez une nouvelle version (par exemple 1.0.6) pour ouvrir une plage neuve.'
  );
}

/**
 * Relit les slots de CI deja occupes, passes par le workflow sous forme de
 * liste « N,N,N » (les suffixes -ci.N des noms de releases existants).
 * Les entrees invalides sont ignorees : mieux vaut un slot reutilise qu'un
 * build qui echoue, et le workflow construit cette liste depuis la seule API
 * qui fait foi.
 */
function parseUsedSlots(raw) {
  if (!raw) return [];
  return raw
    .split(',')
    .map((part) => Number(part.trim()))
    .filter((slot) => Number.isInteger(slot) && slot >= 1 && slot <= CI_SLOTS);
}

function main() {
  const arg = process.argv[2];
  if (arg === '--ci') {
    const baseVersion = process.argv[3] ?? readGitTag();
    const usedSlots = parseUsedSlots(process.argv[4] ?? process.env.USED_CI_SLOTS ?? '');
    emit(buildCiVersion(baseVersion, usedSlots));
    return;
  }
  const source = arg ?? readGitTag() ?? '';
  if (!source && readPackageVersion()) {
    // Aucune version en argument ni tag : on retombe sur package.json.
    const result = parseVersion(readPackageVersion());
    emit(result);
    return;
  }
  emit(parseVersion(source || readPackageVersion()));
}

function emit({ versionName, versionCode, isPrerelease, isRelease }) {
  console.log(`VERSION_NAME=${versionName}`);
  console.log(`VERSION_CODE=${versionCode}`);
  console.log(`IS_PRERELEASE=${isPrerelease}`);
  console.log(`IS_RELEASE=${isRelease}`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main();
}
