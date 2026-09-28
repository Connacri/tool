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

## 5. Mesure d'audience (Firebase Analytics)

Sur la **version web** de l'Application, nous utilisons [Firebase
Analytics](https://firebase.google.com/docs/analytics) (un service de Google)
pour mesurer l'usage de façon agrégée et comprendre quelles fonctionnalités
sont utilisées.

Ce que cette mesure peut collecter :

- le fait d'ouvrir l'Application et d'y naviguer ;
- les pages et fonctionnalités visitées ;
- des informations techniques sur l'appareil et le navigateur (modèle,
  système d'exploitation, langue, résolution d'écran, pays) ;
- des données de performance (temps de chargement, erreurs techniques).

Ce qu'elle ne collecte pas :

- le **contenu** que vous créez ou exportez (textes, images, visuels) ;
- vos identifiants de compte ou de réseau social ;
- votre géolocalisation précise, vos contacts, vos fichiers.

Ces données sont agrégées et ne permettent pas de vous identifier
individuellement. Elles sont traitées par Google selon sa politique de
confidentialité :
[https://policies.google.com/privacy](https://policies.google.com/privacy)

Vous pouvez désactiver cette mesure à tout moment : les règles de
consentement de votre navigateur (par exemple « Bloquer les cookies
tiers ») l'empêchent déjà de fonctionner, et le paramètre
`VITE_FIREBASE_ANALYTICS_ENABLED=false` permet de la couper sans modifier
le code.

[À CONFIRMER — cette mesure n'est active que sur la version web. Dans
l'application Android, le module d'Analytics est volontairement inactif.
Si tu actives plus tard le SDK Analytics natif pour Android, cette section
et le formulaire « Sécurité des données » de la Play Console doivent être
mis à jour.]

## 6. Publicités (Google AdSense)

La version web de l'Application affiche des publicités grâce à
[Google AdSense](https://www.google.com/adsense/start/).

Google et ses annonceurs utilisent des cookies et d'autres identifiants
(appareil, adresse IP) pour servir des annonces, mesurer leurs performances
et, si vous y avez consenti, vous proposer des annonces adaptées à vos
centres d'intérêt. Aucun de ces contenus publicitaires ne modifie le prix :
l'Application reste entièrement gratuite.

Vous pouvez gérer ou désactiver les annonces personnalisées ici :
[Paramètres des annonces Google](https://www.google.com/settings/ads).
Pour des réglages plus fins, voir
[aboutads.info](https://www.aboutads.info/choices/) ou
[Google Privacy & Terms](https://policies.google.com/technologies/partner-sites).
Le désactivation via un bloqueur ou le refus des cookies tiers empêche
également l'affichage des annonces.

Dans l'espace économique européen, au Royaume-Uni et en Suisse, la diffusion
d'annonces dépend d'un consentement préalable obtenu via un bandeau.

[À CONFIRMER — dépend de tes réglages dans la console AdSense :
  - si tu as activé les annonces personnalisées, mentionne-le explicitement
    et ajoute le lien de désactivation ci-dessus dans le bandeau ;
  - si tu n'as pas installé de bandeau de consentement, AdSense peut limiter
    ou bloquer la diffusion dans l'EEE, et Google peut refuser l'approbation
    du site ;
  - le "numéro de éditeur" et l'adresse du site doivent être renseignés dans
    les paramètres AdSense avant toute demande de paiement.]

## 7. Permissions demandées par l'Application

- **Accès à Internet** : nécessaire pour les fonctionnalités de
  génération par IA, le chargement des polices, et l'envoi vers un
  webhook si vous en configurez un.
- **Accès aux photos / à la galerie** (si vous importez vos propres
  images) : utilisé uniquement pour insérer l'image choisie dans votre
  visuel. Les images restent sur votre appareil, sauf lorsqu'elles font
  partie d'un contenu que vous exportez ou transmettez vous-même via la
  fonction de webhook.

## 8. Ce que nous ne faisons PAS

- Nous ne vendons ni ne partageons vos données avec des tiers à des fins
  publicitaires.
- Nous n'affichons pas de publicités dans l'Application Android. La version
  web, elle, affiche des annonces Google AdSense décrites en section 6 :
  nous n'y avons accès à aucun résultat personnel, nous ne choisissons pas
  les annonceurs et nous n'en tirons aucun revenu direct.
- Nous ne suivons pas votre activité en dehors de l'Application.
- Nous ne collectons pas d'identifiants publicitaires, de données de
  géolocalisation précise, ni de données de contacts.
- La mesure d'audience décrite en section 5 reste anonyme et agrégée : elle
  n'identifie pas les personnes et ne sert pas à diffuser de publicité
  ciblée.

## 9. Enfants

L'Application n'est pas spécifiquement conçue pour les enfants de moins de
13 ans et ne collecte sciemment aucune donnée personnelle les concernant.

## 10. Vos droits

Puisque vos données sont stockées localement sur votre appareil et non sur
nos serveurs, vous en gardez la maîtrise complète : vous pouvez les
consulter, les modifier ou les supprimer à tout moment directement dans
l'Application ou via les réglages de votre appareil.

Pour toute question concernant cette politique, vous pouvez nous contacter
à : **[À COMPLÉTER — ton adresse e-mail de contact professionnel]**

## 11. Modifications de cette politique

Nous pouvons mettre à jour cette politique de confidentialité si les
fonctionnalités de l'Application évoluent. La date de dernière mise à jour
figure en haut de ce document.
