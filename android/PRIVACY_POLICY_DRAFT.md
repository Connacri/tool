# Politique de confidentialité — AutoPost Studio

**Dernière mise à jour : [À COMPLÉTER — date de publication]**

Ce document décrit comment AutoPost Studio ("l'Application"), éditée par
Cabalink, traite les informations lorsque vous utilisez l'Application.

⚠️ **Ce document est un brouillon de base rédigé à partir du fonctionnement
réel du code de l'Application au [date]. Il ne constitue pas un avis
juridique.** Avant publication, fais-le relire par un professionnel du
droit si tu vises une audience dans l'Union européenne (RGPD) ou toute
autre juridiction avec des exigences spécifiques, adapte les champs entre
crochets, et mets-le à jour à chaque évolution des fonctionnalités
décrites ci-dessous (en particulier si tu ajoutes une authentification,
un stockage cloud, des publicités ou des achats intégrés).

---

## 1. Données stockées sur votre appareil

L'Application enregistre votre travail (textes, réglages visuels, images
importées) **uniquement dans le stockage local de votre navigateur ou de
votre appareil** (`localStorage`). Ces données :

- ne sont jamais transmises à un serveur pour y être stockées ;
- restent sur votre appareil tant que vous ne désinstallez pas
  l'Application ou n'effacez pas ses données depuis les réglages Android ;
- sont sous votre contrôle exclusif — vous pouvez les effacer à tout
  moment via la fonction de réinitialisation intégrée à l'Application, ou
  en désinstallant l'Application.

Aucun compte utilisateur, aucune inscription ni identifiant personnel
(nom, e-mail, numéro de téléphone) n'est requis pour utiliser
l'Application.

## 2. Génération de contenu par intelligence artificielle

Lorsque vous utilisez la fonction de génération automatique de phrases ou
de légendes pour réseaux sociaux, le texte que vous fournissez (thème, ton
souhaité, texte de votre visuel) est envoyé à notre serveur, qui le
transmet à l'API Gemini de Google (Google AI) pour générer une réponse.

- Ce texte est traité par Google conformément à sa propre politique de
  confidentialité : [https://policies.google.com/privacy](https://policies.google.com/privacy)
- Nous ne conservons pas ce texte au-delà du temps nécessaire pour
  transmettre votre demande et vous renvoyer la réponse.
- Cette fonctionnalité est optionnelle : l'Application reste utilisable
  sans elle, en saisissant votre texte manuellement.

## 3. Export automatisé vers un webhook (optionnel)

Si vous configurez vous-même une URL de webhook (par exemple vers Zapier,
Make ou n8n) pour automatiser la publication de vos visuels, l'Application
transmet à cette URL, à votre demande explicite, le contenu du visuel
concerné (texte, catégorie, date programmée, et une référence à l'image).
Cette fonctionnalité :

- n'est activée que si vous renseignez vous-même une URL de webhook ;
- transmet les données au service tiers que VOUS avez choisi et configuré
  — nous n'avons aucun contrôle sur la façon dont ce service tiers traite
  ensuite ces données, et vous invitons à consulter sa propre politique de
  confidentialité.

## 4. Polices et ressources externes

L'Application charge certaines polices de caractères depuis Google Fonts
(fonts.googleapis.com, fonts.gstatic.com) afin d'afficher correctement les
différents styles typographiques proposés. Cela peut entraîner une requête
réseau standard vers les serveurs de Google. Voir la politique de
confidentialité de Google Fonts :
[https://developers.google.com/fonts/faq/privacy](https://developers.google.com/fonts/faq/privacy)

## 5. Permissions demandées par l'Application

- **Accès à Internet** : nécessaire pour les fonctionnalités de
  génération par IA, le chargement des polices, et l'envoi vers un
  webhook si vous en configurez un.
- **Accès aux photos / à la galerie** (si vous importez vos propres
  images) : utilisé uniquement pour insérer l'image choisie dans votre
  visuel. Les images restent sur votre appareil, sauf lorsqu'elles font
  partie d'un contenu que vous exportez ou transmettez vous-même via la
  fonction de webhook.

## 6. Ce que nous ne faisons PAS

- Nous ne vendons ni ne partageons vos données avec des tiers à des fins
  publicitaires.
- Nous n'affichons pas de publicités dans l'Application [À CONFIRMER —
  ajuste cette section si tu ajoutes de la publicité ou des achats intégrés].
- Nous ne suivons pas votre activité en dehors de l'Application.
- Nous ne collectons pas d'identifiants publicitaires, de données de
  géolocalisation précise, ni de données de contacts.

## 7. Enfants

L'Application n'est pas spécifiquement conçue pour les enfants de moins de
13 ans et ne collecte sciemment aucune donnée personnelle les concernant.

## 8. Vos droits

Puisque vos données sont stockées localement sur votre appareil et non sur
nos serveurs, vous en gardez la maîtrise complète : vous pouvez les
consulter, les modifier ou les supprimer à tout moment directement dans
l'Application ou via les réglages de votre appareil.

Pour toute question concernant cette politique, vous pouvez nous contacter
à : **[À COMPLÉTER — ton adresse e-mail de contact professionnel]**

## 9. Modifications de cette politique

Nous pouvons mettre à jour cette politique de confidentialité si les
fonctionnalités de l'Application évoluent. La date de dernière mise à jour
figure en haut de ce document.
