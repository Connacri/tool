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
 * Un build hors tag n'est pas une release et ne doit surtout pas consommer un
 * slot de prerelease : GITHUB_RUN_NUMBER est non borne (on en est deja a 69)
 * alors que chaque version finale n'en reserve que neuf, donc la CI cassait
 * des que le compteur depassait 9.
 *
 * Un build de CI reprend donc le versionCode de la version de base, et ne
 * change que le nom, suffixe -ci.<run>. Deux proprietes en decoulent :
 * l'artefact est identifiable (nom affiche « 1.0.4-ci.69 ») et il ne peut pas
 * etre publie par accident a la place d'une release, puisque son versionCode
 * est deja pris par elle.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const MAX_VERSION_CODE = 2100000000;
const MAJOR_LIMIT = 1999;
const MINOR_LIMIT = 999;
const PATCH_LIMIT = 999;
// Codes reserves a chaque version finale pour ses prereleases. La finale
// occupe le dernier de la plage, les prereleases les precedents.
const PRERELEASE_SLOTS = 9;

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
 * Version d'un build de CI : meme versionCode que la version de base, nom
 * suffixe -ci.<run> pour qu'il ne soit pas confondu avec une release. Voir la
 * note « Builds de CI » en tete de fichier.
 */
export function buildCiVersion(baseVersion, runNumber) {
  const run = Number(runNumber);
  if (!Number.isInteger(run) || run < 1) {
    fail(`numero de run de CI invalide : "${runNumber}" (entier positif attendu).`);
  }
  const base = parseVersion(baseVersion);
  const parts = /^(\d+)\.(\d+)\.(\d+)/.exec(base.versionName);
  return {
    versionName: `${parts[1]}.${parts[2]}.${parts[3]}-ci.${run}`,
    versionCode: base.versionCode,
    isPrerelease: true,
    isRelease: false,
  };
}

function main() {
  const arg = process.argv[2];
  if (arg === '--ci') {
    const baseVersion = process.argv[3] ?? readGitTag();
    const runNumber = process.argv[4];
    emit(buildCiVersion(baseVersion, runNumber));
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
