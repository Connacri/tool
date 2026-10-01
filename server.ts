import express from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import dns from 'node:dns/promises';
import net from 'node:net';
import type { NextFunction, Request, Response } from 'express';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';
const port = 3000;

/**
 * Origines autorisees a appeler l'API depuis un navigateur.
 */
const ALLOWED_ORIGINS = new Set(
  [
    'capacitor://localhost',
    'https://localhost',
    'http://localhost',
    'http://localhost:3000',
    'https://localhost:3000',
    'https://connacri.github.io',
    'https://tool-ee60c.web.app',
    'https://tool-ee60c.firebaseapp.com',
    ...(process.env.API_ALLOWED_ORIGINS || '')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
  ].map((origin) => origin.toLowerCase()),
);

function isOriginAllowed(origin: string, req: Request): boolean {
  if (!origin) return true;
  const lower = origin.toLowerCase();
  if (ALLOWED_ORIGINS.has(lower)) return true;

  // Same-origin matching request Host header
  const host = (req.headers.host || '').toLowerCase();
  if (host && (lower === `https://${host}` || lower === `http://${host}`)) {
    return true;
  }

  // Localhost (any port)
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(lower)) {
    return true;
  }

  // Google Cloud Run (*.run.app) or Firebase (*.web.app, *.firebaseapp.com)
  try {
    const parsed = new URL(lower);
    if (
      parsed.hostname.endsWith('.run.app') ||
      parsed.hostname.endsWith('.web.app') ||
      parsed.hostname.endsWith('.firebaseapp.com') ||
      parsed.hostname.endsWith('.github.io')
    ) {
      return true;
    }
  } catch {
    // ignore parsing failure
  }

  // In development mode, allow the origin
  if (!isProduction) {
    return true;
  }

  return false;
}

function cors(req: Request, res: Response, next: NextFunction): void {
  const origin = req.headers.origin;

  if (origin) {
    if (!isOriginAllowed(origin, req)) {
      res.status(403).json({ error: 'Origine non autorisee' });
      return;
    }
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }

  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Max-Age', '86400');
    res.status(204).end();
    return;
  }

  next();
}

/** Limite par IP sur les routes /api, fenetre glissante. */
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 20;
const rateBuckets = new Map<string, number[]>();

function rateLimit(req: Request, res: Response, next: NextFunction): void {
  const key = req.ip || req.socket.remoteAddress || 'inconnu';
  const now = Date.now();
  const hits = (rateBuckets.get(key) || []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);

  if (hits.length >= RATE_LIMIT_MAX) {
    const retryAfter = Math.ceil((RATE_LIMIT_WINDOW_MS - (now - hits[0])) / 1000);
    res.setHeader('Retry-After', String(Math.max(retryAfter, 1)));
    rateBuckets.set(key, hits);
    res.status(429).json({ error: 'Trop de requetes, reessayez dans un instant.' });
    return;
  }

  hits.push(now);
  rateBuckets.set(key, hits);

  // Purge paresseuse : la Map ne doit pas grossir indefiniment avec les IP
  // vues une seule fois. Un passage sur douze suffit largement, la fenetre est
  // d'une minute.
  if (rateBuckets.size > 5000) {
    for (const [bucketKey, timestamps] of rateBuckets) {
      if (timestamps.every((t) => now - t >= RATE_LIMIT_WINDOW_MS)) {
        rateBuckets.delete(bucketKey);
      }
    }
  }

  next();
}

/**
 * Une adresse IP est-elle interne, loopback, lien-local ou multicast ?
 *
 * C'est le coeur de la protection SSRF de /api/export-webhook : sans ce filtre,
 * n'importe qui sur Internet peut faire joindre par le serveur une adresse du
 * reseau prive de l'hebergeur, dont le port de liaison interne de Render.
 */
function isPrivateAddress(ip: string): boolean {
  const type = net.isIP(ip);
  if (type === 0) return true; // ni IPv4 ni IPv6 : ne peut pas etre une IP resolue

  if (type === 4) {
    const [a, b] = ip.split('.').map(Number);
    if (a === 0 || a === 10 || a === 127) return true;
    if (a === 169 && b === 254) return true; //dont 169.254.169.254, metadata cloud
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true; //CGNAT
    if (a === 192 && b === 0) return true;
    if (a === 198 && (b === 18 || b === 19)) return true;
    if (a >= 224) return true; //multicast et reserves
    return false;
  }

  // IPv6 : le ::ffff:0:0/96 encapsule une IPv4, un attaquant peut donc cacher
  // 127.0.0.1 ou 169.254.169.254 derriere cette forme. Il faut decomposer.
  const lower = ip.toLowerCase();
  const mapped = lower.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return isPrivateAddress(mapped[1]);

  if (lower === '::' || lower === '::1') return true;
  const head = parseInt(lower.split(':')[0] || '0', 16);
  if ((head & 0xfe00) === 0xfc00) return true; //fc00::/7, adresses locales uniques
  if ((head & 0xffc0) === 0xfe80) return true; //fe80::/10, lien-local
  if ((head & 0xff00) === 0xff00) return true; //ff00::/8, multicast
  return false;
}

/** Erreur de validation d'URL : distinguee des pannes pour repondre en 400. */
class InvalidWebhookUrl extends Error {}

async function assertPublicWebhookUrl(rawUrl: string): Promise<void> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new InvalidWebhookUrl('URL de webhook invalide.');
  }

  if (url.protocol !== 'https:') {
    throw new InvalidWebhookUrl('Le webhook doit utiliser HTTPS.');
  }

  // Les enregistrements DNS peuvent pointer vers une adresse interne : on
  // resout donc avant de laisser fetch partir.
  let addresses: Array<{ address: string }>;
  try {
    addresses = await dns.lookup(url.hostname, { all: true });
  } catch {
    throw new InvalidWebhookUrl(`Impossible de resoudre l'hote "${url.hostname}".`);
  }

  if (addresses.length === 0) {
    throw new InvalidWebhookUrl(`Aucun adresse pour l'hote "${url.hostname}".`);
  }

  if (addresses.some((entry) => isPrivateAddress(entry.address))) {
    throw new InvalidWebhookUrl('Le webhook pointe vers une adresse reseau interne.');
  }
}

async function startServer() {
  const app = express();

  // Render termine le trafic par un proxy : sans cela req.ip vaut l'adresse
  // interne de Render pour toutes les requetes, et le rate limit bloquerait
  // tout le monde d'un bloc. « 1 » fait confiance au premier saut, le proxy.
  app.set('trust proxy', 1);

  app.use('/api', cors);
  app.use('/api', rateLimit);
  app.use(express.json({ limit: '1mb' }));

  // Initialize Gemini AI SDK if GEMINI_API_KEY is present
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  let ai: GoogleGenAI | null = null;

  /**
   * Modeles appeles, du plus capable au plus econome.
   *
   * Les valeurs par defaut visent le palier gratuit de Google AI Studio, qui
   * ne couvre plus que la serie 2.5 depuis le 1er avril 2026 : la serie Pro
   * est passee en payant, et un compte gratuit ne peut pas appeler
   * gemini-3.x. Sans carte bancaire, gemini-2.5-flash tient 10 requetes
   * par minute et 250 par jour, gemini-2.5-flash-lite 15 et 1 000.
   *
   * Ils restent configurables : les modeles gratuits changent, et un compte
   * payant dispose de modeles plus recents qu'il vaut mieux pouvoir viser
   * sans toucher au code.
   */
// Alias stables plutot que des noms de version figes : Google retire
// gemini-2.5-flash pour les nouveaux comptes, et un nom fige casse des
// mois apres la sortie du modele. « -latest » suit la derniere version stable.
const MODEL_PRIMARY = process.env.GEMINI_MODEL_PRIMARY || 'gemini-2.5-flash';
const MODEL_FALLBACK = process.env.GEMINI_MODEL_FALLBACK || 'gemini-2.5-flash-lite';

  try {
    ai = apiKey ? new GoogleGenAI({ apiKey }) : new GoogleGenAI();
  } catch (e) {
    console.warn('GoogleGenAI client could not be created (using local fallbacks):', e);
  }

  // Sonde de sante pour l'hebergeur (health check Render) et pour verifier
  // qu'un deploiement repond. Volontairement sans authentification et sans
  // appel a Gemini : elle doit rester rapide et ne rien consummer du quota.
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      aiConfigured: Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY),
      model: MODEL_PRIMARY,
    });
  });

  // Endpoint to generate 6 phrases or batch phrases
  app.post('/api/generate-phrases', async (req, res) => {
    const { topic = 'Motivation & Entrepreneuriat', count = 6, tone = 'Inspirant & Professionnel', language = 'fr' } = req.body;
    const isArabic = language === 'ar' || /[\u0600-\u06FF]/.test(topic);

    const getFallbackPhrases = () => isArabic
      ? [
          { id: 1, text: "الوضوح يسبق النجاح دائماً: حدد وجهتك أولاً ثم انطلق بثبات.", kicker: "الوضوح الاستراتيجي", subtitle: "حكمة اليوم", imagePrompt: "minimalist architecture clean light" },
          { id: 2, text: "الاستمرارية الهادئة تتفوق دائماً على الحماس المؤقت والمتقطع.", kicker: "قوة العادة", subtitle: "تطوير الذات", imagePrompt: "calm zen ocean path stones" },
          { id: 3, text: "لا تنتظر الفرصة المثالية، بل اصنعها بخطوة صغيرة تخطوها الآن.", kicker: "المبادرة", subtitle: "ريادة الأعمال", imagePrompt: "sunrise golden mountain peak" },
          { id: 4, text: "الإبداع ليس موهبة نادرة، بل نظرة شجاعة ومختلفة إلى العالم.", kicker: "الابتكار", subtitle: "عقلية متجددة", imagePrompt: "abstract modern geometric light" },
          { id: 5, text: "استثمر في عقلك ومعرفتك، فالقيمة الحقيقية تبدأ من داخلك.", kicker: "النمو المستمر", subtitle: "استثمار مستدام", imagePrompt: "warm cozy library workspace" },
          { id: 6, text: "ابنِ أفكارك لتدوم وتلهم الآخرين، وليس لمجرد لفت الانتباه المؤقت.", kicker: "أثر مستمر", subtitle: "احفظ هذا المنشور 📌", imagePrompt: "inspiring starry night sky" },
        ]
      : [
          { id: 1, text: "La clarté précède toujours l'efficacité : définissez votre cap avant d'accélérer.", kicker: "STRATÉGIE", subtitle: "Règle #1 du succès", imagePrompt: "minimalist modern architecture clean lines" },
          { id: 2, text: "La constance bat l'intensité : 1% d'amélioration quotidienne crée un avantage cumulé.", kicker: "MINDSET", subtitle: "Discipline quotidienne", imagePrompt: "calm ocean morning light stones" },
          { id: 3, text: "N'attendez pas le moment parfait : le courage commence par une première action concrète.", kicker: "PASSAGE À L'ACTION", subtitle: "Entrepreneuriat", imagePrompt: "golden sunrise mountain horizon" },
          { id: 4, text: "Votre valeur réside dans ce que vous construisez sur le long terme, pas dans le buzz éphémère.", kicker: "VISION LONG TERME", subtitle: "Impact durable", imagePrompt: "urban skyline at dawn glowing light" },
          { id: 5, text: "L'apprentissage continu est le meilleur levier pour transformer vos ambitions en réalités.", kicker: "ÉVOLUTION", subtitle: "Croissance personnelle", imagePrompt: "aesthetic warm design studio library" },
          { id: 6, text: "Enregistrez ce rappel pour vos moments de doute et partagez-le à votre équipe.", kicker: "ENGAGEMENT", subtitle: "AutoPost Studio 📌", imagePrompt: "serene nature atmospheric misty forest" },
        ];

    try {
      if (!ai) {
        return res.json({ success: true, phrases: getFallbackPhrases().slice(0, count), notice: 'Mode autonome actif' });
      }

      const prompt = `Tu es un créateur de contenu visuel viral pour réseaux sociaux (Instagram, LinkedIn, X, TikTok).
Génère exactement ${count} phrases captivantes et mémorables pour créer une série/carrousel de visuels.
Thématique: "${topic}"
Ton: "${tone}"
Langue: "${language}".

Réponds UNIQUEMENT avec un tableau JSON valide respectant ce schéma exact, sans markdown ni texte autour:
[
  {
    "id": 1,
    "text": "La phrase principale percutante (10 à 25 mots maximum, percutante)",
    "kicker": "CATÉGORIE EN MAJUSCULES (1 à 3 mots)",
    "subtitle": "Sous-titre, citation ou auteur",
    "imagePrompt": "Description visuelle suggérée en anglais pour le fond de l'image"
  }
]`;

      let response;
      try {
        response = await ai.models.generateContent({
          model: MODEL_PRIMARY,
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
          },
        });
      } catch (firstErr: any) {
        console.warn(`Echec sur ${MODEL_PRIMARY}, repli sur ${MODEL_FALLBACK} :`, firstErr?.message);
        try {
          response = await ai.models.generateContent({
            model: MODEL_FALLBACK,
            contents: prompt,
            config: {
              responseMimeType: 'application/json',
            },
          });
        } catch (secondErr: any) {
          console.warn('Quota exceeded or API unavailable, returning curated local fallback phrases:', secondErr?.message);
          return res.json({ success: true, phrases: getFallbackPhrases().slice(0, count), notice: 'Phrases générées via le catalogue curaté' });
        }
      }

      const text = response?.text || '[]';
      const parsed = JSON.parse(text);
      res.json({ success: true, phrases: parsed });
    } catch (err: any) {
      console.warn('Error generating phrases, using fallback:', err);
      res.json({ success: true, phrases: getFallbackPhrases().slice(0, count), notice: 'Catalogue curaté local' });
    }
  });

  // Endpoint to generate phrases AND complete social pack in one unified call
  app.post('/api/generate-phrases-with-social', async (req, res) => {
    const { topic = 'Motivation & Entrepreneuriat', count = 6, tone = 'Inspirant & Professionnel', language = 'fr' } = req.body;
    const isArabic = language === 'ar' || /[\u0600-\u06FF]/.test(topic);

    try {
      if (!ai) {
        // Return structured curated fallback if AI SDK not initialized with key
        const fallbackPhrases = isArabic
          ? [
              { id: 1, text: "الوضوح يسبق النجاح دائماً: حدد وجهتك أولاً ثم انطلق بثبات.", kicker: "الوضوح الاستراتيجي", subtitle: "حكمة اليوم 01" },
              { id: 2, text: "الاستمرارية الهادئة تتفوق دائماً على الحماس المؤقت والمتقطع.", kicker: "قوة العادة", subtitle: "تطوير الذات 02" },
              { id: 3, text: "لا تنتظر الفرصة المثالية، بل اصنعها بخطوة صغيرة تخطوها الآن.", kicker: "المبادرة", subtitle: "ريادة الأعمال 03" },
              { id: 4, text: "الإبداع ليس موهبة نادرة، بل نظرة شجاعة ومختلفة إلى العالم.", kicker: "الابتكار", subtitle: "عقلية متجددة 04" },
              { id: 5, text: "استثمر في عقلك ومعرفتك، فالقيمة الحقيقية تبدأ من داخلك.", kicker: "النمو المستمر", subtitle: "استثمار مستدام 05" },
              { id: 6, text: "ابنِ أفكارك لتدوم وتلهم الآخرين، وليس لمجرد لفت الانتباه المؤقت.", kicker: "أثر مستمر", subtitle: "احفظ هذا المنشور 📌 06" },
            ].slice(0, count)
          : [
              { id: 1, text: "La clarté précède toujours l'efficacité : définissez votre cap avant d'accélérer.", kicker: "STRATÉGIE", subtitle: "Règle #1 du succès" },
              { id: 2, text: "La constance bat l'intensité : 1% d'amélioration quotidienne crée un avantage cumulé.", kicker: "MINDSET", subtitle: "Discipline quotidienne" },
              { id: 3, text: "N'attendez pas le moment parfait : le courage commence par une première action concrète.", kicker: "PASSAGE À L'ACTION", subtitle: "Entrepreneuriat" },
              { id: 4, text: "Votre valeur réside dans ce que vous construisez sur le long terme, pas dans le buzz éphémère.", kicker: "VISION LONG TERME", subtitle: "Impact durable" },
              { id: 5, text: "L'apprentissage continu est le meilleur levier pour transformer vos ambitions en réalités.", kicker: "ÉVOLUTION", subtitle: "Croissance personnelle" },
              { id: 6, text: "Enregistrez ce rappel pour vos moments de doute et partagez-le à votre équipe.", kicker: "ENGAGEMENT", subtitle: "AutoPost Studio 📌" },
            ].slice(0, count);

        return res.json({
          success: true,
          phrases: fallbackPhrases,
          socialCopy: {},
          notice: 'Mode autonome actif'
        });
      }

      const prompt = `Tu es un expert mondial en Content Marketing et Réseaux Sociaux.
Génère pour cette demande :
1) Exactement ${count} phrases captivantes pour un carrousel visuel.
2) Le Social Pack complet (légendes, hashtags, titres et conseils) optimisé pour chaque réseau social.
Thématique: "${topic}"
Ton: "${tone}"
Langue: "${language}".

Réponds STRICTEMENT avec un JSON valide respectant cette structure sans markdown:
{
  "phrases": [
    {
      "id": 1,
      "text": "Phrase principale percutante",
      "kicker": "TITRE EN MAJUSCULES (1 à 3 mots)",
      "subtitle": "Sous-titre ou signature",
      "imagePrompt": "Description visuelle suggérée en anglais"
    }
  ],
  "socialCopy": {
    "instagram": { "title": "Instagram (Carrousel & Post)", "caption": "...", "hashtags": "#...", "tips": "Astuce algo..." },
    "tiktok": { "title": "TikTok (Carrousel & Vidéo)", "caption": "...", "hashtags": "#...", "tips": "..." },
    "youtube": { "title": "YouTube (Shorts & Post)", "caption": "...", "hashtags": "#...", "tips": "..." },
    "facebook": { "title": "Facebook (Post)", "caption": "...", "hashtags": "#...", "tips": "..." },
    "linkedin": { "title": "LinkedIn (Post Pro)", "caption": "...", "hashtags": "#...", "tips": "..." },
    "twitter": { "title": "X / Twitter", "caption": "...", "hashtags": "#...", "tips": "..." },
    "pinterest": { "title": "Pinterest", "caption": "...", "hashtags": "#...", "tips": "..." },
    "snapchat": { "title": "Snapchat", "caption": "...", "hashtags": "#...", "tips": "..." },
    "discord": { "title": "Discord", "caption": "...", "hashtags": "", "tips": "..." },
    "masterPrompt": "Prompt universel prêt à copier pour ChatGPT / Claude..."
  }
}`;

      let response;
      try {
        response = await ai.models.generateContent({
          model: MODEL_PRIMARY,
          contents: prompt,
          config: { responseMimeType: 'application/json' },
        });
      } catch (firstErr: any) {
        console.warn('Fallback in generate-phrases-with-social:', firstErr?.message);
        response = await ai.models.generateContent({
          model: MODEL_FALLBACK,
          contents: prompt,
          config: { responseMimeType: 'application/json' },
        });
      }

      const text = response?.text || '{}';
      const parsed = JSON.parse(text);
      res.json({
        success: true,
        phrases: parsed.phrases || [],
        socialCopy: parsed.socialCopy || {},
      });
    } catch (err: any) {
      console.warn('Error in generate-phrases-with-social, returning fallback:', err?.message);
      // Clean fallback so user never gets blocked
      const isArabic = language === 'ar' || /[\u0600-\u06FF]/.test(topic || '');
      const fallbackPhrases = isArabic
        ? [
            { id: 1, text: "الوضوح يسبق النجاح دائماً: حدد وجهتك أولاً ثم انطلق بثبات.", kicker: "الوضوح الاستراتيجي", subtitle: "حكمة اليوم 01" },
            { id: 2, text: "الاستمرارية الهادئة تتفوق دائماً على الحماس المؤقت والمتقطع.", kicker: "قوة العادة", subtitle: "تطوير الذات 02" },
            { id: 3, text: "لا تنتظر الفرصة المثالية، بل اصنعها بخطوة صغيرة تخطوها الآن.", kicker: "المبادرة", subtitle: "ريادة الأعمال 03" },
          ]
        : [
            { id: 1, text: "La clarté précède toujours l'efficacité : définissez votre cap avant d'accélérer.", kicker: "STRATÉGIE", subtitle: "Règle #1 du succès" },
            { id: 2, text: "La constance bat l'intensité : 1% d'amélioration quotidienne crée un avantage cumulé.", kicker: "MINDSET", subtitle: "Discipline quotidienne" },
            { id: 3, text: "N'attendez pas le moment parfait : le courage commence par une première action concrète.", kicker: "PASSAGE À L'ACTION", subtitle: "Entrepreneuriat" },
          ];
      res.json({ success: true, phrases: fallbackPhrases, socialCopy: {} });
    }
  });

  // Endpoint to generate social copy & hashtags
  app.post('/api/generate-social-copy', async (req, res) => {
    const { phrase = '', kicker = '' } = req.body;
    const cleanKicker = kicker || 'Conseil';
    const tagKicker = cleanKicker.replace(/\s+/g, '');
    const getLocalCopy = () => ({
      instagram: {
        title: "Instagram (Carrousel & Post)",
        caption: `✨ "${phrase}"\n\nUne réflexion essentielle pour transformer votre vision en résultats concrets. Qu'en pensez-vous ? Partagez votre expérience en commentaire !\n\n📌 Sauvegardez ce post pour y revenir quand vous en aurez besoin.`,
        hashtags: `#${tagKicker.toLowerCase()} #motivation #entrepreneuriat #succes #creation #autopost`,
        tips: "Astuce algo: Encouragez la sauvegarde du carrousel pour maximiser la portée.",
      },
      tiktok: {
        title: "TikTok (Carrousel Photo & Vidéo)",
        caption: `👀 Swipe pour la suite de la série !\n\n"${phrase}"\n\nTu valides ce principe ou pas du tout ? Dis-le en commentaire !`,
        hashtags: `#${tagKicker.toLowerCase()} #fyp #pourtoi #devperso #motivation #viral`,
        tips: "Astuce algo: 3-5 hashtags max et mots-clés dans les 2 premières lignes.",
      },
      youtube: {
        title: "YouTube (Shorts & Post Communauté)",
        caption: `${cleanKicker} : ${phrase.slice(0, 60)}...\n\nDécouvrez cette règle fondamentale pour débloquer votre potentiel. Abonnez-vous pour un conseil percutant chaque matin !`,
        hashtags: `#Shorts #${tagKicker.toLowerCase()} #Conseil`,
        tips: "Astuce algo: Titre accrocheur sous 70 caractères pour un taux de clic maximal.",
      },
      facebook: {
        title: "Facebook (Post & Page)",
        caption: `Bonjour à tous 🌟\n\n"${phrase}"\n\nComment appliquez-vous ce principe dans vos projets ou au quotidien ? Hâte de lire vos retours !`,
        hashtags: `#${tagKicker.toLowerCase()}`,
        tips: "Astuce algo: Privilégiez les questions ouvertes pour déclencher des conversations.",
      },
      snapchat: {
        title: "Snapchat (Spotlight & Story)",
        caption: `💡 Le rappel du jour : "${phrase}"`,
        hashtags: `#${tagKicker.toLowerCase()}`,
        tips: "Astuce algo: Texte court, percutant et direct.",
      },
      linkedin: {
        title: "LinkedIn (Post d'expertise & Carrousel)",
        caption: `💡 "${phrase}"\n\nDans un environnement où tout va vite, prendre du recul sur cette idée permet souvent de débloquer de nouveaux paliers d'excellence.\n\nCe que l'expérience m'a appris :\n1. La clarté précède toujours l'efficacité.\n2. La constance bat l'intensité ponctuelle.\n\nQuelle est votre approche sur ce sujet dans vos équipes ?`,
        hashtags: `#Leadership #${tagKicker} #Management #Strategie`,
        tips: "Astuce algo: Format aéré avec retour d'expérience et question finale invitant aux commentaires.",
      },
      twitter: {
        title: "X / Twitter (Tweet & Fil)",
        caption: `"${phrase}"\n\nÀ méditer aujourd'hui.`,
        hashtags: `#${tagKicker.toLowerCase()}`,
        tips: "Astuce algo: Moins de 250 caractères pour un impact maximal.",
      },
      pinterest: {
        title: "Pinterest (Épingle Idée & Standard)",
        caption: `Inspiration du jour : ${phrase}\n\nEnregistrez cette épingle dans votre tableau d'objectifs pour garder le cap.`,
        hashtags: `#${tagKicker.toLowerCase()} #inspiration #motivation`,
        tips: "Astuce algo: Mots-clés intentionnistes pour la recherche.",
      },
      discord: {
        title: "Discord (Annonce & Discussion)",
        caption: `📢 **Pensée du jour sur le serveur**\n\n> "${phrase}"\n\n💬 Qu'est-ce que cela vous inspire pour vos projets actuels ? On en discute dans le salon général !`,
        hashtags: "",
        tips: "Format Markdown adapté aux serveurs et communautés.",
      },
      quora: {
        title: "Quora (Réponse experte & Espace)",
        caption: `Question : Quelle est la clé principale pour réussir dans la durée ?\n\nRéponse :\nTout part de ce constat : "${phrase}". En concentrant vos efforts sur la constance plutôt que sur la perfection immédiate, vous créez un avantage cumulé durable.`,
        hashtags: `#${tagKicker.toLowerCase()}`,
        tips: "Apportez une perspective d'expert avec des conseils concrets.",
      },
      vk: {
        title: "VKontakte (Mur & Communauté)",
        caption: `Вдохновение дня ✨\n\n"${phrase}"\n\nДелитесь вашим мнением в комментариях!`,
        hashtags: `#${tagKicker.toLowerCase()} #мотивация #успех`,
        tips: "Format convivial adapté aux communautés VK.",
      },
      masterPrompt: `Tu es un expert mondial en stratégie de contenu viral et Copywriting pour les réseaux sociaux. Rédige un pack complet de publications captivantes pour le visuel suivant :\n\nThématique : ${cleanKicker}\nTexte : "${phrase}"\nObjectif : Maximiser les sauvegardes, partages et commentaires qualifiés. Fournis des variantes adaptées pour Instagram, TikTok, LinkedIn, YouTube Shorts et Twitter avec les accroches (hooks), les corps de texte et les hashtags de niche pertinents.`
    });

    try {
      if (!ai) {
        return res.json({ success: true, copy: getLocalCopy(), notice: 'Mode autonome actif' });
      }

      const prompt = `Tu es un expert mondial en Social Media Marketing et Algorithmes des Réseaux Sociaux.
Analyse ce visuel et rédige les légendes, tags et hashtags optimisés pour chaque plateforme selon ses règles strictes et types de publication (Carrousel, Post, Short/Reel, Story):
Catégorie/Kicker: ${kicker || 'Citation'}
Phrase du visuel: "${phrase}"

Règles par plateforme:
- instagram: Hook percutant dans les 125 premiers caractères, format carrousel/post, 4 à 6 hashtags de niche ciblés, appel à sauvegarder 📌
- tiktok: Accroche mystère/curiosité, 3 à 5 hashtags (#fyp, #pourtoi, mots-clés de recherche SEO TikTok)
- youtube: Titre YouTube Shorts / Communauté (<70 chars), description avec mots-clés SEO, 3 tags #Shorts
- facebook: Ton conversationnel et communautaire, question ouverte pour générer des commentaires, 1 ou 2 hashtags max
- snapchat: Texte court et percutant pour Story ou Spotlight, appel à l'action direct
- linkedin: Post à forte valeur ajoutée, format aéré, 3 hashtags professionnels, question d'ouverture
- twitter: Moins de 250 caractères, phrase tranchante, 1 ou 2 hashtags max
- pinterest: Titre riche en mots-clés recherche SEO, description inspirante, épingles associées
- discord: Message formaté en Markdown Discord (**gras**, listes à puces, emojis, questions de débat)
- quora: Réponse experte structurée avec introduction, points clés et conclusion
- vk: Post de communauté VK engageant et chaleureux avec 3-4 hashtags
- masterPrompt: Le prompt détaillé et prêt à l'emploi que l'utilisateur peut copier-coller dans ChatGPT, Claude ou Gemini pour générer des variantes infinies sur ce sujet

Réponds STRICTEMENT avec un objet JSON valide suivant cette structure exacte:
{
  "instagram": { "title": "Instagram (Carrousel & Post)", "caption": "...", "hashtags": "...", "tips": "Astuce algo: Encouragez la sauvegarde du carrousel." },
  "tiktok": { "title": "TikTok (Carrousel Photo & Vidéo)", "caption": "...", "hashtags": "...", "tips": "Astuce algo: 3-5 hashtags max pour le référencement de recherche." },
  "youtube": { "title": "YouTube (Shorts & Post Communauté)", "caption": "...", "hashtags": "...", "tips": "Astuce algo: Titre accrocheur sous 70 caractères." },
  "facebook": { "title": "Facebook (Post & Page)", "caption": "...", "hashtags": "...", "tips": "Astuce algo: Privilégiez les questions ouvertes pour les commentaires." },
  "snapchat": { "title": "Snapchat (Spotlight & Story)", "caption": "...", "hashtags": "...", "tips": "Astuce algo: Texte court, percutant et visuel." },
  "linkedin": { "title": "LinkedIn (Post d'expertise & Carrousel)", "caption": "...", "hashtags": "...", "tips": "Astuce algo: Format aéré avec retour d'expérience." },
  "twitter": { "title": "X / Twitter (Tweet & Fil)", "caption": "...", "hashtags": "...", "tips": "Astuce algo: Moins de 250 caractères pour un impact maximal." },
  "pinterest": { "title": "Pinterest (Épingle Idée & Standard)", "caption": "...", "hashtags": "...", "tips": "Astuce algo: Mots-clés intentionnistes pour la recherche." },
  "discord": { "title": "Discord (Annonce & Discussion)", "caption": "...", "hashtags": "...", "tips": "Format Markdown adapté aux serveurs et communautés." },
  "quora": { "title": "Quora (Réponse experte & Espace)", "caption": "...", "hashtags": "...", "tips": "Apportez une perspective d'expert avec des conseils concrets." },
  "vk": { "title": "VKontakte (Mur & Communauté)", "caption": "...", "hashtags": "...", "tips": "Format convivial adapté aux communautés VK." },
  "masterPrompt": "Tu es un expert en création de contenu viral..."
}`;

      let response;
      try {
        response = await ai.models.generateContent({
          model: MODEL_PRIMARY,
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
          },
        });
      } catch (firstErr: any) {
        console.warn(`Echec sur ${MODEL_PRIMARY}, repli sur ${MODEL_FALLBACK} :`, firstErr?.message);
        try {
          response = await ai.models.generateContent({
            model: MODEL_FALLBACK,
            contents: prompt,
            config: {
              responseMimeType: 'application/json',
            },
          });
        } catch (secondErr: any) {
          console.warn('Gemini quota exhausted for social copy, returning structured local fallback:', secondErr?.message);
          const cleanKicker = kicker || 'Conseil';
          const tagKicker = cleanKicker.replace(/\s+/g, '');
          const localCopy = {
            instagram: {
              title: "Instagram (Carrousel & Post)",
              caption: `✨ "${phrase}"\n\nUne réflexion essentielle pour transformer votre vision en résultats concrets. Qu'en pensez-vous ? Partagez votre expérience en commentaire !\n\n📌 Sauvegardez ce post pour y revenir quand vous en aurez besoin.`,
              hashtags: `#${tagKicker.toLowerCase()} #motivation #entrepreneuriat #succes #creation #autopost`,
              tips: "Astuce algo: Encouragez la sauvegarde du carrousel pour maximiser la portée.",
            },
            tiktok: {
              title: "TikTok (Carrousel Photo & Vidéo)",
              caption: `👀 Swipe pour la suite de la série !\n\n"${phrase}"\n\nTu valides ce principe ou pas du tout ? Dis-le en commentaire !`,
              hashtags: `#${tagKicker.toLowerCase()} #fyp #pourtoi #devperso #motivation #viral`,
              tips: "Astuce algo: 3-5 hashtags max et mots-clés dans les 2 premières lignes.",
            },
            youtube: {
              title: "YouTube (Shorts & Post Communauté)",
              caption: `${cleanKicker} : ${phrase.slice(0, 60)}...\n\nDécouvrez cette règle fondamentale pour débloquer votre potentiel. Abonnez-vous pour un conseil percutant chaque matin !`,
              hashtags: `#Shorts #${tagKicker.toLowerCase()} #Conseil`,
              tips: "Astuce algo: Titre accrocheur sous 70 caractères pour un taux de clic maximal.",
            },
            facebook: {
              title: "Facebook (Post & Page)",
              caption: `Bonjour à tous 🌟\n\n"${phrase}"\n\nComment appliquez-vous ce principe dans vos projets ou au quotidien ? Hâte de lire vos retours !`,
              hashtags: `#${tagKicker.toLowerCase()}`,
              tips: "Astuce algo: Privilégiez les questions ouvertes pour déclencher des conversations.",
            },
            snapchat: {
              title: "Snapchat (Spotlight & Story)",
              caption: `💡 Le rappel du jour : "${phrase}"`,
              hashtags: `#${tagKicker.toLowerCase()}`,
              tips: "Astuce algo: Texte court, percutant et direct.",
            },
            linkedin: {
              title: "LinkedIn (Post d'expertise & Carrousel)",
              caption: `💡 "${phrase}"\n\nDans un environnement où tout va vite, prendre du recul sur cette idée permet souvent de débloquer de nouveaux paliers d'excellence.\n\nCe que l'expérience m'a appris :\n1. La clarté précède toujours l'efficacité.\n2. La constance bat l'intensité ponctuelle.\n\nQuelle est votre approche sur ce sujet dans vos équipes ?`,
              hashtags: `#Leadership #${tagKicker} #Management #Strategie`,
              tips: "Astuce algo: Format aéré avec retour d'expérience et question finale invitant aux commentaires.",
            },
            twitter: {
              title: "X / Twitter (Tweet & Fil)",
              caption: `"${phrase}"\n\nÀ méditer aujourd'hui.`,
              hashtags: `#${tagKicker.toLowerCase()}`,
              tips: "Astuce algo: Moins de 250 caractères pour un impact maximal.",
            },
            pinterest: {
              title: "Pinterest (Épingle Idée & Standard)",
              caption: `Inspiration du jour : ${phrase}\n\nEnregistrez cette épingle dans votre tableau d'objectifs pour garder le cap.`,
              hashtags: `#${tagKicker.toLowerCase()} #inspiration #motivation`,
              tips: "Astuce algo: Mots-clés intentionnistes pour la recherche.",
            },
            discord: {
              title: "Discord (Annonce & Discussion)",
              caption: `📢 **Pensée du jour sur le serveur**\n\n> "${phrase}"\n\n💬 Qu'est-ce que cela vous inspire pour vos projets actuels ? On en discute dans le salon général !`,
              hashtags: "",
              tips: "Format Markdown adapté aux serveurs et communautés.",
            },
            quora: {
              title: "Quora (Réponse experte & Espace)",
              caption: `Question : Quelle est la clé principale pour réussir dans la durée ?\n\nRéponse :\nTout part de ce constat : "${phrase}". En concentrant vos efforts sur la constance plutôt que sur la perfection immédiate, vous créez un avantage cumulé durable.`,
              hashtags: `#${tagKicker.toLowerCase()}`,
              tips: "Apportez une perspective d'expert avec des conseils concrets.",
            },
            vk: {
              title: "VKontakte (Mur & Communauté)",
              caption: `Вдохновение дня ✨\n\n"${phrase}"\n\nДелитесь вашим мнением в комментариях!`,
              hashtags: `#${tagKicker.toLowerCase()} #мотивация #успех`,
              tips: "Format convivial adapté aux communautés VK.",
            },
            masterPrompt: `Tu es un expert mondial en stratégie de contenu viral et Copywriting pour les réseaux sociaux. Rédige un pack complet de publications captivantes pour le visuel suivant :\n\nThématique : ${cleanKicker}\nTexte : "${phrase}"\nObjectif : Maximiser les sauvegardes, partages et commentaires qualifiés. Fournis des variantes adaptées pour Instagram, TikTok, LinkedIn, YouTube Shorts et Twitter avec les accroches (hooks), les corps de texte et les hashtags de niche pertinents.`
          };
          return res.json({ success: true, copy: localCopy, notice: 'Légendes générées via le moteur local (quota API Gemini temporairement atteint)' });
        }
      }

      const parsed = JSON.parse(response.text || '{}');
      res.json({ success: true, copy: parsed });
    } catch (err: any) {
      console.warn('Error generating social copy, using fallback:', err);
      res.json({ success: true, copy: getLocalCopy(), notice: 'Légendes catalogue local' });
    }
  });

  // Endpoint to dispatch automated export to webhook (Zapier, Make, n8n, Buffer)
  app.post('/api/export-webhook', async (req, res) => {
    try {
      const { webhookUrl, payload } = req.body;
      if (!webhookUrl) {
        return res.status(400).json({ error: 'URL de Webhook manquante' });
      }

      // Sans cette validation, la route etait une SSRF ouverte : n'importe qui
      // pouvait faire joindre par le serveur le reseau prive de l'hebergeur, et
      // faire relayer du trafic a sa place.
      await assertPublicWebhookUrl(webhookUrl);

      const fetchRes = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        // Une redirection renverrait le serveur vers une cible interne meme si
        // l'URL de depart est propre : elle est refusee plutot que suivie.
        redirect: 'manual',
        signal: AbortSignal.timeout(10_000),
      });

      const text = await fetchRes.text();
      res.json({
        success: fetchRes.ok,
        status: fetchRes.status,
        message: fetchRes.ok
          ? 'Données transmises avec succès au Webhook de publication automatisée.'
          : `Erreur du serveur webhook (${fetchRes.status}): ${text.slice(0, 300)}`
      });
    } catch (err: any) {
      // Une URL rejetee par la validation SSRF est une erreur du client, pas une
      // panne : la repondre en 500 ferait croire a un incident et la masquerait
      // dans les journaux d'erreur.
      if (err instanceof InvalidWebhookUrl) {
        res.status(400).json({ error: err.message });
        return;
      }
      res.status(502).json({ error: `Impossible de contacter le Webhook: ${err.message}` });
    }
  });

  // Toute erreur survenue dans /api repond en JSON, jamais en HTML. Le
  // client appelle response.json() sans repeter : une page HTML le ferait
  // echouer sur « Unexpected token '<' ». C'est exactement ce que visiteur le
  // fallback SPA renvoyait, pour une route d'API mal orthographiee ou un corps
  // JSON invalide.
  app.use('/api', (err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = Number(err?.status || err?.statusCode) >= 400 ? Number(err.status || err.statusCode) : 500;

    if (status >= 500) {
      console.error('[api] Erreur non geree :', err);
      res.status(500).json({ error: 'Erreur interne du serveur.' });
      return;
    }

    // 413 = corps au-dela de la limite, 400 = JSON illisible : ce sont des
    // erreurs du client, on lui dit ce qui ne va pas sans divulguer d'internes.
    const message =
      status === 413
        ? 'Requete trop volumineuse.'
        : status === 400
          ? 'Corps de requete JSON invalide.'
          : 'Requete invalide.';
    res.status(status).json({ error: message });
  });

  // Idem pour une route /api inexistante : sans ce garde-fou, elle traversait
  // jusqu'au fallback SPA et renvoyait index.html.
  app.use('/api', (_req: Request, res: Response) => {
    res.status(404).json({ error: 'Route API inconnue.' });
  });

  // Mount Vite or serve static
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
    app.get('*', (_req, res) => {
      res.sendFile('index.html', { root: 'dist' });
    });
  }

  app.listen(Number(port), '0.0.0.0', () => {
    console.log(`AutoPost Studio server running on port ${port}`);
  });
}

startServer();
