/**
 * Verifications de non-regression sur le calcul de version.
 *
 * Pourquoi ces tests existent
 * --------------------------
 * Ce code decide du versionCode envoye a Google Play. Une erreur ici n'eclate
 * pas au build : elle se manifeste des semaines plus tard, quand Play refuse
 * un APK ou refuse une mise a jour. Le symptome (« duplicate versionCode »)
 * ne designe pas la cause, qui est une ligne de calcul ;
 *
 *   1.0.3 publiee vaut 1000003 sous l'ancien encodage. Le tag suivant calcule
 *   1.0.4 -> 1000040, qui reste superieur : la transition s'est faite sans
 *   saut. Seuls les anciens tags recalculeraient une valeur differente, ce
 *   qui est sans effet puisqu'ils ne sont pas rebuildes.
 *
 * Le suite verifie cette frontiere et les proprietes que Play impose :
 * unicite, croissance, et frontiere entre plage de CI et version suivante.
 *
 *   node scripts/version.test.mjs
 */
import { execFileSync } from 'node:child_process';
import { computeVersionCode, parseVersion, buildCiVersion } from './version.mjs';

let passed = 0;
const failures = [];

function check(label, actual, expected) {
  const got = JSON.stringify(actual);
  const want = JSON.stringify(expected);
  if (got === want) {
    passed += 1;
  } else {
    failures.push(`${label}\n     attendu : ${want}\n     obtenu  : ${got}`);
  }
}

function assert(label, condition, detail = '') {
  check(label, condition ? true : false, true);
  if (!condition && detail) failures.push(`${label} : ${detail}`);
}

/**
 * Verifie qu'un appel fait sortir le processus en erreur, sans arreter la suite.
 *
 * Les fonctions testees appellent process.exit(1) via fail(), ce qui est le
 * comportement voulu en CI mais tuerait le runner. On rejoue donc l'appel dans
 * un sous-processus et on observe son code de sortie.
 */
function exitsWithError(run) {
  const snippet = `
    import { computeVersionCode, parseVersion, buildCiVersion } from ${JSON.stringify(
      new URL('./version.mjs', import.meta.url).href
    )};
    (${run.toString()})();
  `;
  try {
    execFileSync(process.execPath, ['--input-type=module', '-e', snippet], { stdio: 'pipe' });
    return false;
  } catch {
    return true;
  }
}

// ---------------------------------------------------------------------------
// Encodage de base : major * 1 000 000 + minor * 10 000 + patch * 10
// ---------------------------------------------------------------------------
check('1.0.0', computeVersionCode({ major: 1, minor: 0, patch: 0, prerelease: '' }), 1000000);
check('1.0.4', computeVersionCode({ major: 1, minor: 0, patch: 4, prerelease: '' }), 1000040);
check('1.0.5', computeVersionCode({ major: 1, minor: 0, patch: 5, prerelease: '' }), 1000050);
check('1.0.6', computeVersionCode({ major: 1, minor: 0, patch: 6, prerelease: '' }), 1000060);
check('2.3.4', computeVersionCode({ major: 2, minor: 3, patch: 4, prerelease: '' }), 2030040);

// ---------------------------------------------------------------------------
// Facteur 10 sur le patch. Sans lui, deux versions finales consecutives
// occupent deux entiers adjacents et il ne reste plus de place pour une
// prerelease entre les deux.
// ---------------------------------------------------------------------------
check(
  '1.0.5 -> 1.0.6 laisse 9 codes',
  computeVersionCode({ major: 1, minor: 0, patch: 6, prerelease: '' }) -
    computeVersionCode({ major: 1, minor: 0, patch: 5, prerelease: '' }),
  10
);

// ---------------------------------------------------------------------------
// Prereleases : croissantes entre elles, inferieures a la finale, superieures
// a la finale precedente. C'est l'ordre qu'impose Google Play.
// ---------------------------------------------------------------------------
const rc1 = computeVersionCode({ major: 1, minor: 0, patch: 4, prerelease: 'rc.1' });
const rc2 = computeVersionCode({ major: 1, minor: 0, patch: 4, prerelease: 'rc.2' });
const final4 = computeVersionCode({ major: 1, minor: 0, patch: 4, prerelease: '' });
const final3 = computeVersionCode({ major: 1, minor: 0, patch: 3, prerelease: '' });

check('rc.1 (1000031)', rc1, 1000031);
check('rc.2 (1000032)', rc2, 1000032);
assert('rc.1 < rc.2', rc1 < rc2, `${rc1} !< ${rc2}`);
assert('rc.2 < finale', rc2 < final4, `${rc2} !< ${final4}`);
assert('finale precedente < rc.1', final3 < rc1, `${final3} !< ${rc1}`);

// Le defaut que cet encodage corrigeait : une prerelease receive base - numero,
// ce qui donnait a une version superieure un versionCode inferieur.
// 1.0.5-rc.1 valait 1000041 par cette voie, au lieu de 1000041 attendu ici
// pour 1.0.4. On verifie que la suite est bien decalee.
check('1.0.5-rc.1 (1000041)', computeVersionCode({ major: 1, minor: 0, patch: 5, prerelease: 'rc.1' }), 1000041);

// ---------------------------------------------------------------------------
// Builds de CI : apres la finale, croissants, tous inferieurs a la finale
// suivante. C'est ce qui rend chaque APK du main soumettable a Play.
// ---------------------------------------------------------------------------
const ci1 = buildCiVersion('1.0.5', []);
const ci2 = buildCiVersion('1.0.5', [1]);
const ci3 = buildCiVersion('1.0.5', [1, 2]);

check('ci.1 -> 1000051', ci1.versionCode, 1000051);
check('ci.2 -> 1000052', ci2.versionCode, 1000052);
check('ci.3 -> 1000053', ci3.versionCode, 1000053);
check('nom ci.3', ci3.versionName, '1.0.5-ci.3');
assert('ci est marque prerelease', ci1.isPrerelease === true);
assert('ci n est pas une release', ci1.isRelease === false);
assert('ci.1 < ci.2 < ci.3', ci1.versionCode < ci2.versionCode && ci2.versionCode < ci3.versionCode);
assert(
  'ci.3 < 1.0.6',
  ci3.versionCode < computeVersionCode({ major: 1, minor: 0, patch: 6, prerelease: '' }),
  'un build de CI doit rester soumettable avant la prochaine finale'
);

// Un slot deja occupe n'est jamais rendu deux fois : c'est la propriete qui
// empeche Play de refuser un APK des semaines plus tard.
const apresReprise = buildCiVersion('1.0.5', [1, 2, 4, 5]);
check('premier slot libre apres 1,2,4,5', apresReprise.versionName, '1.0.5-ci.3');
check('son versionCode', apresReprise.versionCode, 1000053);

// ---------------------------------------------------------------------------
// Plange complete : la dixieme tentative doit echouer plutot que deborder sur
// la version suivante, ou reutiliser un code deja distribue.
//
// fail() appelle process.exit, ce qui tuerait le process de test : la
// verification se fait donc dans un sous-processus, seul endroit ou un exit 1
// est observable sans arreter la suite.
// ---------------------------------------------------------------------------
assert(
  'plange CI saturee : echec explicite',
  exitsWithError(() => buildCiVersion('1.0.5', [1, 2, 3, 4, 5, 6, 7, 8, 9])),
  'buildCiVersion a rendu un code au-dela de la plage'
);

// ---------------------------------------------------------------------------
// Le suffixe « -ci.N » est un nom d'archive, pas une SemVer Android.
//
// parseVersion l'accepte et produit 1000041 pour « 1.0.5-ci.1 », la ou
// buildCiVersion produit 1000051 : deux codes differents pour le meme nom.
// C'est exactement la divergence que la note « Builds de CI » du script
// signale, et la raison pour laquelle le workflow passe par --ci.
//
// Ce test ne verifie donc pas un refus — il n'y en a pas. Il verrouille
// l'ecart, pour qu'un ref futur qui choisirait la mauvaise voie se voie.
// ---------------------------------------------------------------------------
check('parseVersion("1.0.5-ci.1") -> 1000041', parseVersion('1.0.5-ci.1').versionCode, 1000041);
check('buildCiVersion -> 1000051', buildCiVersion('1.0.5', []).versionCode, 1000051);
assert(
  'les deux voies divergent (raison de passer par --ci)',
  parseVersion('1.0.5-ci.1').versionCode !== buildCiVersion('1.0.5', []).versionCode,
  'si les deux voies concordaient, le choix de --ci deviendrait indifferent'
);

// ---------------------------------------------------------------------------
// Bornes Google Play : versionCode <= 2 100 000 000.
// ---------------------------------------------------------------------------
assert(
  'major plafonne sous le plafond de Play',
  exitsWithError(() => computeVersionCode({ major: 2000, minor: 0, patch: 0, prerelease: '' })),
  'versionCode au-dela de 2 100 000 000 accepte'
);

// ---------------------------------------------------------------------------
// Migration depuis l'ancien encodage : c'est ce qui empeche de se retrouver
// avec un versionCode deja distribue apres le changement de regle.
// ---------------------------------------------------------------------------
assert(
  '1.0.4 recalcule reste superieur a 1.0.3 publiee (1000003)',
  computeVersionCode({ major: 1, minor: 0, patch: 4, prerelease: '' }) > 1000003,
  'la transition aurait produit un versionCode deja pris'
);

// ---------------------------------------------------------------------------
console.log(`${passed} verification(s) reussie(s).`);
if (failures.length > 0) {
  console.error(`\n${failures.length} echec(s) :\n`);
  for (const failure of failures) console.error(`  - ${failure}\n`);
  process.exit(1);
}