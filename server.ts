import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import { randomUUID } from "crypto";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Initialize Gemini
  const ai = new GoogleGenAI({ 
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  // API Route for recipe generation
  app.post("/api/generate-recipe", async (req, res) => {
    try {
      const { ingredients, style } = req.body;
      
      if (!ingredients) {
        return res.status(400).json({ error: "Ingredients are required" });
      }

      const prompt = `Create a step-by-step recipe based on the following available ingredients: ${ingredients}. 
      The cooking style should be: ${style || 'Any'}. 
      IMPORTANT: You MUST generate the recipe in BOTH English (en) and Indonesian (id) simultaneously.
      Include a recipe name, preparation time, cooking time, a list of precise ingredients, and clear step-by-step instructions.`;

      const translationSchema = {
        type: Type.OBJECT,
        properties: {
          recipeName: { type: Type.STRING, description: "The name of the recipe." },
          prepTime: { type: Type.STRING, description: "Preparation time (e.g. 15 mins)." },
          cookTime: { type: Type.STRING, description: "Cooking time (e.g. 30 mins)." },
          ingredientsList: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of ingredients with quantities." },
          instructions: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Step-by-step cooking instructions." }
        },
        required: ["recipeName", "prepTime", "cookTime", "ingredientsList", "instructions"]
      };

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              translations: {
                type: Type.OBJECT,
                properties: {
                  en: translationSchema,
                  id: translationSchema
                },
                required: ["en", "id"]
              }
            },
            required: ["translations"]
          },
        },
      });

      const recipeText = response.text;
      if (!recipeText) {
        throw new Error("Failed to generate recipe text.");
      }
      
      const parsedData = JSON.parse(recipeText);
      parsedData.id = randomUUID();
      
      res.json(parsedData);
    } catch (error) {
      console.error("Error generating recipe:", error);
      res.status(500).json({ error: "Failed to generate recipe" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
