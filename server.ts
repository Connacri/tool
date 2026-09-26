import express from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';
const port = process.env.PORT || 3000;

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '50mb' }));

  // Initialize Gemini AI SDK if GEMINI_API_KEY is present
  const apiKey = process.env.GEMINI_API_KEY;
  const ai = apiKey ? new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  }) : null;

  // Endpoint to generate 6 phrases or batch phrases
  app.post('/api/generate-phrases', async (req, res) => {
    try {
      const { topic = 'Motivation & Entrepreneuriat', count = 6, tone = 'Inspirant & Professionnel', language = 'fr' } = req.body;
      if (!ai) {
        return res.status(503).json({ error: 'GEMINI_API_KEY non configurée sur le serveur' });
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

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        }
      });

      const text = response.text || '[]';
      const parsed = JSON.parse(text);
      res.json({ success: true, phrases: parsed });
    } catch (err: any) {
      console.error('Error generating phrases:', err);
      res.status(500).json({ error: err.message || 'Erreur lors de la génération des phrases' });
    }
  });

  // Endpoint to generate social copy & hashtags
  app.post('/api/generate-social-copy', async (req, res) => {
    try {
      const { phrase, kicker } = req.body;
      if (!ai) {
        return res.status(503).json({ error: 'GEMINI_API_KEY non configurée' });
      }

      const prompt = `Tu es un expert Social Media Manager. Rédige les légendes adaptées et les hashtags pour publier ce visuel:
Catégorie: ${kicker || 'Citation'}
Phrase du visuel: "${phrase}"

Réponds UNIQUEMENT avec un objet JSON valide:
{
  "instagram": {
    "caption": "Texte engageant avec call-to-action pour Instagram",
    "hashtags": "#entrepreneuriat #succes #motivation #mindset #business"
  },
  "linkedin": {
    "caption": "Texte avec recul et valeur ajoutée professionnelle pour LinkedIn",
    "hashtags": "#Leadership #Productivite #Croissance"
  },
  "twitter": {
    "caption": "Tweet concis et tranchant (moins de 200 caractères)",
    "hashtags": "#ConseilPro #Mindset"
  },
  "tiktok": {
    "caption": "Accroche rapide pour post ou carrousel photo TikTok",
    "hashtags": "#fyp #pourtoi #devperso"
  }
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        }
      });

      const parsed = JSON.parse(response.text || '{}');
      res.json({ success: true, copy: parsed });
    } catch (err: any) {
      console.error('Error generating social copy:', err);
      res.status(500).json({ error: err.message || 'Erreur lors de la génération des légendes' });
    }
  });

  // Endpoint to dispatch automated export to webhook (Zapier, Make, n8n, Buffer)
  app.post('/api/export-webhook', async (req, res) => {
    try {
      const { webhookUrl, payload } = req.body;
      if (!webhookUrl) {
        return res.status(400).json({ error: 'URL de Webhook manquante' });
      }

      const fetchRes = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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
      res.status(500).json({ error: `Impossible de contacter le Webhook: ${err.message}` });
    }
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

  app.listen(port, () => {
    console.log(`AutoPost Studio server running on port ${port}`);
  });
}

startServer();
