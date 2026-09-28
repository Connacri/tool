# Guide de remplissage — Formulaire "Sécurité des données" (Play Console)

Play Console impose de remplir ce formulaire avant toute publication. Voici
comment répondre à chaque section, basé sur le fonctionnement réel du code
de l'app à ce jour. Recoupe avec `PRIVACY_POLICY_DRAFT.md` (ce doit être
cohérent).

## Collecte et partage de données

**Est-ce que ton app collecte ou partage des types de données utilisateur
requis ?** → **Oui**

(Techniquement "oui" car le texte envoyé à Gemini pour la génération IA
compte comme donnée transmise à un tiers, même si tu ne la stockes pas
toi-même.)

### Type de données à déclarer

| Catégorie | Type précis | Collectée ? | Partagée ? | Avec un tiers | Objet |
|---|---|---|---|---|---|
| Photos et vidéos | Photos | Oui (si l'utilisateur importe une image) | Non (reste sur l'appareil, sauf export volontaire via webhook configuré par l'utilisateur) | — | Fonctionnalité de l'app |
| Messages | Autres contenus générés par l'utilisateur | Oui (le texte du visuel) | Oui, uniquement pour la fonction IA | Google (API Gemini) | Fonctionnalité de l'app (génération de contenu) |

Pour toutes les autres catégories proposées par le formulaire (position,
informations personnelles, contacts, historique de navigation,
identifiants d'appareil, données financières, santé...) → **Non collectée**,
car rien dans le code ne les touche.

### Pour chaque type de donnée déclaré, Play Console demande ensuite :

- **Est-ce que cette collecte est obligatoire ou optionnelle ?**
  → Optionnelle (l'app fonctionne sans utiliser la génération IA ni
  l'import d'image).
- **Pourquoi cette donnée est-elle collectée ?**
  → "Fonctionnalité de l'application" (App functionality).
- **Les données sont-elles chiffrées en transit ?**
  → Oui (HTTPS, à condition que ton serveur déployé serve bien en HTTPS —
  vérifie que ton hébergeur le fournit, la plupart le font par défaut).
- **L'utilisateur peut-il demander la suppression de ses données ?**
  → Oui, en effaçant les données de l'app depuis les réglages Android ou
  via le bouton de réinitialisation intégré — puisque tout est stocké
  localement, il n'y a rien à supprimer côté serveur pour ce qui concerne
  le contenu créé dans l'app.

## Pratiques de sécurité

- **Les données sont-elles chiffrées en transit ?** → Oui, si ton serveur
  déployé utilise HTTPS (recommandé, quasi systématique sur Render/
  Railway/Fly.io).
- **Peux-tu demander la suppression de tes données ?** → Oui (voir
  ci-dessus).

## URL de la politique de confidentialité

Play Console demande une **URL publique** (pas un fichier). Tu dois donc :
1. Finaliser `PRIVACY_POLICY_DRAFT.md` (compléter les champs entre crochets,
   idéalement faire relire).
2. L'héberger quelque part en accès public — par exemple une simple page
   sur ton propre site, un Gist GitHub rendu public, ou une page Notion
   publiée. L'essentiel est que l'URL soit stable et toujours accessible.
3. Coller cette URL dans le champ correspondant de la fiche Play Console
   (section "Présence sur le Store" → "Politique de confidentialité").

## Public cible et contenu

Dans la section "Public cible" de Play Console, indique la tranche d'âge
réelle visée par ton app (probablement 18+ ou tout public selon ton
positionnement), et réponds honnêtement à la question "cette app
intéresse-t-elle particulièrement les enfants ?" → Non, selon la nature de
l'app (outil de création de contenu pour réseaux sociaux, usage
professionnel/créatif).

## Déclaration sur les annonces (Ads)

Le code actuel ne contient aucun SDK publicitaire (AdMob ou autre) → réponds
**"Non, mon app ne contient pas d'annonces"**, sauf si tu comptes en ajouter
prochainement, auquel cas attends de les avoir intégrées pour remplir cette
section (une réponse "non" alors que l'app contient des pubs peut entraîner
un rejet ou une suspension).
