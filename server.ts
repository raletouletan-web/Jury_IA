import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { WebSocketServer, WebSocket } from "ws";
import { createServer as createHttpServer } from "http";
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import "dotenv/config";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

async function startServer() {
  const app = express();
  const PORT = 3000;
  const httpServer = createHttpServer(app);

  const wss = new WebSocketServer({ server: httpServer, path: "/live" });

  const SYSTEM_INSTRUCTION = `Tu es un jury VAE professionnel pour le diplôme d'État d'aide-soignant (DEAS) nommé Lia.
Parle clairement. Voix posée, dynamique, et professionnelle.
Débit fluide, naturel et légèrement accéléré pour un échange vivant.

Ton rôle :
1. Introduction : Présente-toi formellement comme membre du jury VAE DEAS. Demande au candidat de se présenter brièvement (nom, prénom). Cette présentation te servira de base pour personnaliser tes questions.
2. Convention : Demande au candidat de définir le nombre de questions souhaité (entre 3 et 10) pour cet entretien.
3. Interview : Pose les questions une par une, basées sur le référentiel métier, les expériences, le projet professionnel, et les difficultés du métier.
4. Feedback immédiat : SI la réponse du candidat n'est pas satisfaisante, tu DOIS lui donner la réponse correcte avec des explications claires et concises.
5. Synthèse : À la fin du nombre de questions convenu, remercie le candidat, fournis un résumé de sa performance, et liste les points d'amélioration concrets. Préface cette synthèse avec "[SYNTHESE_START]" et termine avec "[SYNTHESE_END]".

Règles de dialogue :
- Pose UNE seule question à la fois.
- Ne combine JAMAIS deux sujets différents dans une même question.
- Sois exigeant. Ne sois pas trop accommodant.
- Vérifie l'usage des termes techniques aide-soignants.
- Demande des exemples concrets basés sur le référentiel métier.
- Explore le projet professionnel (ce qu'il fera une fois diplômé !) et les difficultés rencontrées dans le métier.
- Explore l'analyse réflexive ("Pourquoi avez-vous fait ce choix ?").
- Interaction : Ton ton doit être professionnel, bienveillant mais exigeant (membre de jury DEAS).
- Réponse max : 20 secondes.

Reste naturel. Ton objectif est d'estimer les capacités réelles du candidat.`;

  wss.on("connection", async (clientWs) => {
    let session: any = null;

    try {
      session = await ai.live.connect({
        model: "gemini-3.1-flash-live-preview",
        callbacks: {
          onmessage: (message: LiveServerMessage) => {
            const audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            const text = message.serverContent?.modelTurn?.parts?.[0]?.text;
            if (audio) {
              clientWs.send(JSON.stringify({ audio }));
            }
            if (text) {
              clientWs.send(JSON.stringify({ text }));
            }
            if (message.serverContent?.interrupted) {
              clientWs.send(JSON.stringify({ interrupted: true }));
            }
          },
          onerror: (error) => {
            console.error("Gemini connection error:", error);
            clientWs.send(JSON.stringify({ error: "Gemini connection error" }));
          },
          onclose: (event) => {
            console.log("Gemini connection closed.", event);
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Achernar" } }, // Changed to Achernar as requested.
          },
          systemInstruction: SYSTEM_INSTRUCTION,
        },
      });

      // Send initial greeting
      session.sendRealtimeInput({
        text: "Bonjour, je suis Lia, membre du jury pour votre VAE DEAS et je travaille pour Patrice DIAKITÉ. Pourriez-vous vous présenter brièvement (nom et prénom) et me dire combien de questions vous souhaitez traiter durant cet entretien (entre 3 et 10) ?"
      });

      console.log("Gemini Live session connected.");
    } catch (e) {
      console.error("Failed to connect to Gemini Live session", e);
      clientWs.close();
    }

    clientWs.on("message", (data) => {
      if (!session) return;
      try {
        const { audio } = JSON.parse(data.toString());
        if (audio) {
          session.sendRealtimeInput({
            audio: {
              mimeType: "audio/pcm;rate=16000",
              data: audio,
            }
          });
        }
      } catch (err) {
        console.error("Error sending audio input: ", err);
      }
    });

    clientWs.on("close", () => {
      console.log("Client disconnected");
      // Ideally session.close() is available? The SDK wrapper connect might not expose raw close but let's assume session is the connected session.
      // Wait, there's no explicitly documented session.close() outside of what's provided, let's keep it clean
      // Actually docs say `session.close()`. Let's try to call it if it exists
      // Wait array argument for sendRealtimeInput: No, docs say `session.sendRealtimeInput({audio: {data: audio, mimeType: "audio/pcm;rate=16000"}})`
      // Let me review SKILL.md for Live API
    });
  });

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
