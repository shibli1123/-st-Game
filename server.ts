import express from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // Initialize Gemini API client (picks up GEMINI_API_KEY from environment)
  const ai = new GoogleGenAI({});

  // Dhaka Maps Grounding API with gemini-3.8-flash & googleMaps tool
  app.post('/api/dhaka-intel', async (req, res) => {
    try {
      const { query } = req.body;
      const userPrompt = query
        ? `Location or query in Dhaka, Bangladesh: "${query}". Provide real Google Maps grounded details about this place in Dhaka, including exact neighborhood/area (e.g., Gulshan, Hatirjheel, Dhanmondi, Motijheel, Lalbagh Fort, Banani), vibe, nearby roads/landmarks, and tactical getaway advice for an outlaw couple.`
        : `Provide up-to-date Google Maps grounded intelligence on iconic romantic and heist locations across Dhaka, Bangladesh (Gulshan-2, Hatirjheel Expressway, Motijheel Financial District, Lalbagh Fort, Dhanmondi Lake). Include area details, coordinates or road connections, and romantic escape notes.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: userPrompt,
        config: {
          systemInstruction:
            'You are the Dhaka Tactical City Navigator for an outlaw romantic couple (Leo and Mia) operating in Dhaka, Bangladesh. Ground all responses with real Google Maps data. Be concise, engaging, and atmospheric with authentic local Dhaka knowledge.',
          tools: [{ googleMaps: {} }],
        },
      });

      const text = response.text || 'Dhaka map intelligence loaded.';
      const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

      res.json({
        success: true,
        text,
        groundingChunks,
      });
    } catch (err: any) {
      console.warn('Google Maps Grounding API query note:', err.message);
      // Resilient authentic fallback if API key is unconfigured or offline
      res.json({
        success: true,
        text: `📍 DHAKA TACTICAL GPS SATELLITE INTEL:
• Gulshan-2 Circle (গুলশান-২): High-profile diplomatic enclave with modern glass towers, embassies, and 5-star hotels. Fast escape via Gulshan Avenue South to Hatirjheel.
• Hatirjheel Waterfront Expressway (হাতিরঝিল): 300-acre lake network with illuminated cable-stayed arched bridges connecting Tejgaon, Rampura, and Gulshan. The ultimate 180 km/h romantic getaway stretch.
• Motijheel C/A & Bangladesh Bank (মতিঝিল): Financial nerve center surrounding Shapla Chattar (Water Lily). High-vault securities and bustling multi-lane avenues.
• Lalbagh Fort (লালবাগ কেল্লা, পুরান ঢাকা): 17th-century Mughal fortress near the Buriganga River. Labyrinthine historic alleyways perfect for evading DMP police cruisers.
• Dhanmondi Lake & Road 32 (ধানমন্ডি লেক): Romantic waterfront promenade flanked by banyan trees, Rabindra Sarobar open stage, and secluded lakeside bridges.`,
        groundingChunks: [],
        isFallback: true,
      });
    }
  });

  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Grand Theft Dhaka server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
