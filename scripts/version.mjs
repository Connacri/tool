/**
 * Calcul du versionName / versionCode Android a partir d'une version SemVer.
 *
 * Usage :
 *   node scripts/version.mjs            # deduit la version du tag git courant
 *   node scripts/version.mjs 1.2.3      # version explicite
 *
 * Sortie (une ligne KEY=VALUE par sortie) :
 *   VERSION_NAME=1.2.3
 *   VERSION_CODE=1002003
 *   IS_PRERELEASE=false
 *
 * Regle de versionCode (norme Android / Google Play)
 * ------------------------------------------------
 * Play exige un versionCode strictement croissant et <= 2100000000. On l'derive
 * de la version SemVer plutot que de l'incrementer a la main, ce qui garantit
 * qu'il est reproductible depuis le tag et impossible a oublier :
 *
 *   versionCode = major * 1_000_000 + minor * 1_000 + patch
 *
 * major est plafonne a 1999 pour rester sous le plafond de Play (1 999 999 999
 * < 2 100 000 000).
 *
 * Prereleases (1.2.0-rc.1) : Play refuse deux APK de meme versionCode, donc
 * une prerelease occupe les codes juste inferieurs a la version finale, ce qui
 * conserve l'ordre chronologique : rc.1 -> 1001999, rc.2 -> 1001998, puis
 * 1.2.0 -> 1002000.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const MAX_VERSION_CODE = 2100000000;
const MAJOR_LIMIT = 1999;
const MINOR_LIMIT = 999;
const PATCH_LIMIT = 999;

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

  const base = major * 1000000 + minor * 1000 + patch;

  if (!prerelease) return base;

  // Ordre des prereleases : rc.1 > rc.2, c'est-a-dire un numero plus petit
  // doit avoir un versionCode plus grand pour rester avant la version finale.
  const sequenceMatch = /(\d+)(?!.*\d)/.exec(prerelease);
  const sequence = sequenceMatch ? Number(sequenceMatch[1]) : 1;
  if (sequence > 999) {
    fail(`suffixe de prerelease "${prerelease}" : le numero doit rester <= 999.`);
  }
  const code = base - sequence;
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
  };
}

function main() {
  const arg = process.argv[2];
  const source = arg ?? readGitTag() ?? '';
  if (!source && readPackageVersion()) {
    // Aucune version en argument ni tag : on retombe sur package.json.
    const result = parseVersion(readPackageVersion());
    emit(result);
    return;
  }
  emit(parseVersion(source || readPackageVersion()));
}

function emit({ versionName, versionCode, isPrerelease }) {
  console.log(`VERSION_NAME=${versionName}`);
  console.log(`VERSION_CODE=${versionCode}`);
  console.log(`IS_PRERELEASE=${isPrerelease}`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main();
}
