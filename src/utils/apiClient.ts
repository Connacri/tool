/**
 * Client JSON partagé pour les appels à l'API backend (server.ts).
 *
 * Pourquoi ce module existe : un frontal mono-page sert index.html pour
 * toute route inconnue. Firebase Hosting, par exemple, réécrit "**" vers
 * "/index.html". Un POST vers /api/generate-phrases reçoit donc une réponse
 * 200 servie en text/html — le corps est la page de l'application, pas du JSON.
 *
 * Tester response.ok ne suffit pas : le statut est bien 200. C'est
 * response.json() qui échoue ensuite sur une erreur incompréhensible côté
 * utilisateur ("Unexpected token '<', "<!doctype "... is not valid JSON").
 *
 * fetchJson retourne donc null dès que la réponse n'est pas du JSON, ce qui
 * laisse chaque appelant basculer sur son repli local au lieu de casser.
 */

import { getApiUrl } from './apiConfig';

type Json = Record<string, unknown>;

/** Indique si la réponse est servie en JSON, et non en page HTML. */
function isJsonResponse(response: Response): boolean {
  const contentType = response.headers.get('content-type') ?? '';
  return contentType.includes('application/json');
}

/**
 * POST JSON vers l'API. Retourne null si l'API est absente, répond en erreur,
 * ou renvoie autre chose que du JSON — dans tous ces cas l'appelant doit
 * utiliser son repli local.
 */
export async function postJson(path: string, body: unknown): Promise<Json | null> {
  try {
    const response = await fetch(getApiUrl(path), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok || !isJsonResponse(response)) return null;

    return (await response.json()) as Json;
  } catch {
    return null;
  }
}
