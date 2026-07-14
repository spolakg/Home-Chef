import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "15mb" }));

// Initialize GoogleGenAI client on the server side
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// Helper to check if API key exists
const checkApiKey = () => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured. Please add it in Settings > Secrets.");
  }
};

// POST endpoint to analyze a fridge image
app.post("/api/analyze-fridge", async (req: express.Request, res: express.Response) => {
  try {
    checkApiKey();
    const { image, sampleKey, pantry } = req.body;
    let base64Data = "";
    let mimeType = "image/jpeg";

    if (sampleKey) {
      // Look up files in src/assets/images
      let fileName = "";
      if (sampleKey === "vegetables") {
        fileName = "fridge_vegetables_1784068930018.jpg";
      } else if (sampleKey === "protein") {
        fileName = "fridge_protein_1784068941426.jpg";
      }

      if (fileName) {
        const filePath = path.join(process.cwd(), "src", "assets", "images", fileName);
        if (fs.existsSync(filePath)) {
          const fileBuffer = fs.readFileSync(filePath);
          base64Data = fileBuffer.toString("base64");
          mimeType = "image/jpeg";
        } else {
          return res.status(404).json({ error: `Sample file ${fileName} not found on server` });
        }
      }
    } else if (image) {
      // Parse base64 and mime from data URI
      const matches = image.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        mimeType = matches[1];
        base64Data = matches[2];
      } else {
        base64Data = image;
      }
    }

    if (!base64Data) {
      return res.status(400).json({ error: "No image or sample selected." });
    }

    const pantryText = pantry && Array.isArray(pantry) && pantry.length > 0
      ? pantry.map((item: any) => `${item.name} (${item.quantity})`).join(", ")
      : "None";

    const prompt = `Analyze this photo of an open refrigerator:
1. Identify all visible ingredients. Be specific (e.g. "broccoli", "eggs", "milk", "carrot", "bell pepper", "yogurt").
2. Suggest 3 delicious, diverse recipes that can be prepared with these identified ingredients, optionally combining them with the following pantry staple ingredients if helpful: ${pantryText}.
3. For each recipe:
   - Provide a unique, simple slug-like id (e.g. "veggie-stir-fry").
   - List both available ingredients (missing: false) (which includes items found in the fridge or those listed as available in the pantry) and missing ingredients that are essential but not available in either (missing: true).
   - Rate the recipe's difficulty: "Easy", "Medium", or "Hard".
   - Estimate prepTime in minutes.
   - Estimate calorie count per serving.
   - Assign dietaryTags such as "Vegetarian", "Vegan", "Keto", "Gluten-Free", "Dairy-Free", "Low-Carb" based on ingredients.
   - Detail step-by-step clear instructions for cooking.

Return the result strictly conforming to the requested JSON structure.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        {
          inlineData: {
            mimeType,
            data: base64Data,
          },
        },
        { text: prompt },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            ingredients: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "All detected visible ingredients from the fridge image.",
            },
            recipes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  name: { type: Type.STRING },
                  description: { type: Type.STRING },
                  difficulty: { type: Type.STRING, description: "Must be Easy, Medium, or Hard" },
                  prepTime: { type: Type.INTEGER, description: "Estimated cooking time in minutes" },
                  calories: { type: Type.INTEGER, description: "Estimated calories per serving" },
                  dietaryTags: { type: Type.ARRAY, items: { type: Type.STRING } },
                  ingredients: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        name: { type: Type.STRING },
                        amount: { type: Type.STRING },
                        essential: { type: Type.BOOLEAN },
                        missing: { type: Type.BOOLEAN },
                      },
                      required: ["name", "amount", "essential", "missing"],
                    },
                  },
                  steps: { type: Type.ARRAY, items: { type: Type.STRING } },
                },
                required: [
                  "id",
                  "name",
                  "description",
                  "difficulty",
                  "prepTime",
                  "calories",
                  "dietaryTags",
                  "ingredients",
                  "steps",
                ],
              },
            },
          },
          required: ["ingredients", "recipes"],
        },
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response content from Gemini API.");
    }

    const data = JSON.parse(text);
    res.json(data);
  } catch (err: any) {
    console.error("Error in analyze-fridge:", err);
    res.status(500).json({ error: err.message || "An error occurred while analyzing the image." });
  }
});

// POST endpoint to generate/refresh recipes based on manual ingredients list and filters
app.post("/api/generate-recipes", async (req: express.Request, res: express.Response) => {
  try {
    checkApiKey();
    const { ingredients, dietaryFilters, pantry } = req.body;

    if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
      return res.status(400).json({ error: "Please provide a non-empty list of ingredients." });
    }

    const filtersText =
      dietaryFilters && dietaryFilters.length > 0
        ? `The recipes MUST strictly satisfy these dietary requirements: ${dietaryFilters.join(", ")}.`
        : "Suggest recipes representing various styles.";

    const pantryText = pantry && Array.isArray(pantry) && pantry.length > 0
      ? pantry.map((item: any) => `${item.name} (${item.quantity})`).join(", ")
      : "None";

    const prompt = `We have the following list of available ingredients from the fridge: ${ingredients.join(", ")}.
In addition, we have these pantry staples already in stock: ${pantryText}.
Suggest 3-4 creative, tasty, and realistic recipes that can be made using these ingredients.
${filtersText}

For each recipe:
- Specify which ingredients are available (missing: false) (either present in the fridge or listed as available in the pantry), and which essential ingredients are missing (missing: true).
- Categorize difficulty as "Easy", "Medium", or "Hard".
- Set prepTime (minutes), calories, and applicable dietaryTags.
- Outline clear, sequential cooking steps.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            recipes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  name: { type: Type.STRING },
                  description: { type: Type.STRING },
                  difficulty: { type: Type.STRING },
                  prepTime: { type: Type.INTEGER },
                  calories: { type: Type.INTEGER },
                  dietaryTags: { type: Type.ARRAY, items: { type: Type.STRING } },
                  ingredients: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        name: { type: Type.STRING },
                        amount: { type: Type.STRING },
                        essential: { type: Type.BOOLEAN },
                        missing: { type: Type.BOOLEAN },
                      },
                      required: ["name", "amount", "essential", "missing"],
                    },
                  },
                  steps: { type: Type.ARRAY, items: { type: Type.STRING } },
                },
                required: [
                  "id",
                  "name",
                  "description",
                  "difficulty",
                  "prepTime",
                  "calories",
                  "dietaryTags",
                  "ingredients",
                  "steps",
                ],
              },
            },
          },
          required: ["recipes"],
        },
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response content from Gemini API.");
    }

    const data = JSON.parse(text);
    res.json(data);
  } catch (err: any) {
    console.error("Error in generate-recipes:", err);
    res.status(500).json({ error: err.message || "An error occurred while generating recipes." });
  }
});

// Setup Express and static/Vite assets
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    // Serve index.html for non-API client routes
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT} with NODE_ENV=${process.env.NODE_ENV}`);
  });
}

startServer();
