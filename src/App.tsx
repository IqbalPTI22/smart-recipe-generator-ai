/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { ChefHat, Loader2, Utensils, Clock, Heart, BookOpen, Globe } from 'lucide-react';
import type { Recipe } from './types';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI, Type } from "@google/genai";

const t = {
  id: {
    appTitle: 'Resep Pintar',
    favorites: 'Favorit',
    yourSavedRecipes: 'Resep Tersimpan Anda',
    noSavedRecipes: 'Anda belum menyimpan resep apa pun.',
    prep: 'Persiapan',
    cook: 'Masak',
    ingredientsTitle: 'Bahan-bahan',
    instructionsTitle: 'Langkah-langkah',
    removeFavorite: 'Hapus dari favorit',
    saved: 'Tersimpan',
    save: 'Simpan',
    whatsInKitchen: 'Apa yang ada di dapur Anda?',
    availableIngredients: 'Bahan yang Tersedia',
    ingredientsPlaceholder: 'mis. dada ayam, nasi, brokoli, kecap...',
    cookingStyle: 'Gaya Memasak',
    apiKeyLabel: 'Gemini API Key (Opsional)',
    apiKeyPlaceholder: 'Masukkan API Key Anda...',
    generateRecipe: 'Buat Resep',
    cookingUpIdeas: 'Meracik ide...',
    pleaseEnterIngredients: 'Mohon masukkan beberapa bahan.',
    errorGenerating: 'Terjadi kesalahan saat membuat resep. Silakan coba lagi.',
    readyToCook: 'Siap memasak?',
    enterIngredients: 'Masukkan bahan-bahan Anda untuk membuat resep.',
    styleOptions: {
      Any: 'Bebas',
      Indonesian: 'Indonesia',
      Western: 'Barat',
      Japanese: 'Jepang',
      Italian: 'Italia',
      Indian: 'India',
      Mexican: 'Meksiko',
      Healthy: 'Sehat / Rendah Kalori',
      Quick: 'Cepat & Mudah'
    }
  },
  en: {
    appTitle: 'Smart Recipe',
    favorites: 'Favorites',
    yourSavedRecipes: 'Your Saved Recipes',
    noSavedRecipes: "You haven't saved any recipes yet.",
    prep: 'Prep',
    cook: 'Cook',
    ingredientsTitle: 'Ingredients',
    instructionsTitle: 'Instructions',
    removeFavorite: 'Remove from favorites',
    saved: 'Saved',
    save: 'Save',
    whatsInKitchen: "What's in your kitchen?",
    availableIngredients: 'Available Ingredients',
    ingredientsPlaceholder: 'e.g. chicken breast, rice, broccoli, soy sauce...',
    cookingStyle: 'Cooking Style',
    apiKeyLabel: 'Gemini API Key (Optional)',
    apiKeyPlaceholder: 'Enter your API Key...',
    generateRecipe: 'Generate Recipe',
    cookingUpIdeas: 'Cooking up ideas...',
    pleaseEnterIngredients: 'Please enter some ingredients.',
    errorGenerating: 'An error occurred while generating the recipe. Please try again.',
    readyToCook: 'Ready to cook?',
    enterIngredients: 'Enter your ingredients to generate a recipe.',
    styleOptions: {
      Any: 'Any Style',
      Indonesian: 'Indonesian',
      Western: 'Western',
      Japanese: 'Japanese',
      Italian: 'Italian',
      Indian: 'Indian',
      Mexican: 'Mexican',
      Healthy: 'Healthy / Low Calorie',
      Quick: 'Quick & Easy'
    }
  }
};

export default function App() {
  const [language, setLanguage] = useState<'id' | 'en'>('id');
  const lang = t[language];

  const [ingredients, setIngredients] = useState('');
  const [style, setStyle] = useState('Any');
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [error, setError] = useState('');
  const [favorites, setFavorites] = useState<Recipe[]>([]);
  const [showFavorites, setShowFavorites] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('recipe_favorites');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Filter out old schema favorites that don't have translations or id
        const validFavorites = parsed.filter((f: any) => f.translations && f.translations.en && f.translations.id && f.id);
        setFavorites(validFavorites);
      } catch (e) {
        console.error('Failed to parse favorites', e);
      }
    }
  }, []);

  const saveFavorites = (newFavorites: Recipe[]) => {
    setFavorites(newFavorites);
    localStorage.setItem('recipe_favorites', JSON.stringify(newFavorites));
  };

  const toggleFavorite = (recipeToToggle: Recipe) => {
    const isFav = favorites.some((f) => f.id === recipeToToggle.id);
    if (isFav) {
      saveFavorites(favorites.filter((f) => f.id !== recipeToToggle.id));
    } else {
      saveFavorites([...favorites, recipeToToggle]);
    }
  };

  const isFavorite = (recipeId: string) => {
    return favorites.some((f) => f.id === recipeId);
  };

  const handleGenerate = async () => {
    if (!ingredients.trim()) {
      setError(lang.pleaseEnterIngredients);
      return;
    }

    if (!apiKey.trim()) {
      setError(lang.apiKeyPlaceholder);
      return;
    }

    setLoading(true);
    setError('');
    setRecipe(null);

    try {
      const ai = new GoogleGenAI({ 
        apiKey: apiKey.trim(),
      });

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
      parsedData.id = crypto.randomUUID();
      setRecipe(parsedData);
    } catch (err: any) {
      console.error(err);
      setError(err.message || lang.errorGenerating);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans">
      <header className="bg-white border-b border-stone-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-orange-600 font-semibold text-lg">
            <ChefHat className="w-6 h-6" />
            <span>{lang.appTitle}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative flex items-center">
              <Globe className="w-4 h-4 text-stone-400 absolute left-2" />
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as 'id' | 'en')}
                className="pl-8 pr-3 py-1.5 rounded-full border border-stone-200 text-sm font-medium text-stone-600 bg-stone-50 hover:bg-stone-100 transition-colors appearance-none cursor-pointer outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="id">ID</option>
                <option value="en">EN</option>
              </select>
            </div>
            <button
              onClick={() => setShowFavorites(!showFavorites)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-stone-100 transition-colors text-sm font-medium text-stone-600"
            >
              <Heart className={`w-4 h-4 ${showFavorites ? 'fill-orange-500 text-orange-500' : ''}`} />
              {lang.favorites} ({favorites.length})
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {showFavorites ? (
            <motion.div
              key="favorites"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-3 mb-6">
                <button
                  onClick={() => setShowFavorites(false)}
                  className="p-2 hover:bg-stone-200 rounded-full transition-colors bg-stone-100"
                >
                  <BookOpen className="w-5 h-5" />
                </button>
                <h1 className="text-2xl font-bold">{lang.yourSavedRecipes}</h1>
              </div>

              {favorites.length === 0 ? (
                <div className="text-center py-12 text-stone-500 bg-white rounded-2xl border border-stone-200 shadow-sm">
                  <Heart className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p>{lang.noSavedRecipes}</p>
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2">
                  {favorites.map((fav, index) => {
                    const favT = fav.translations[language];
                    return (
                    <div key={fav.id || index} className="bg-white rounded-2xl p-6 shadow-sm border border-stone-200 flex flex-col h-full">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-xl font-bold">{favT.recipeName}</h3>
                        <button
                          onClick={() => toggleFavorite(fav)}
                          className="p-1.5 hover:bg-stone-100 rounded-full text-orange-500 transition-colors"
                          title={lang.removeFavorite}
                        >
                          <Heart className="w-5 h-5 fill-current" />
                        </button>
                      </div>
                      <div className="flex gap-4 text-sm text-stone-500 mb-6 font-medium">
                        <div className="flex items-center gap-1.5 bg-stone-100 px-2.5 py-1 rounded-md">
                          <Clock className="w-4 h-4" /> {lang.prep}: {favT.prepTime}
                        </div>
                        <div className="flex items-center gap-1.5 bg-stone-100 px-2.5 py-1 rounded-md">
                          <Utensils className="w-4 h-4" /> {lang.cook}: {favT.cookTime}
                        </div>
                      </div>
                      <div className="space-y-4 flex-grow">
                        <div>
                          <h4 className="font-semibold mb-2 text-sm uppercase tracking-wider text-stone-500">{lang.ingredientsTitle}</h4>
                          <ul className="list-disc pl-5 space-y-1 text-sm">
                            {favT.ingredientsList.map((ing, i) => (
                              <li key={i}>{ing}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-semibold mb-2 text-sm uppercase tracking-wider text-stone-500">{lang.instructionsTitle}</h4>
                          <ol className="list-decimal pl-5 space-y-2 text-sm text-stone-700">
                            {favT.instructions.map((inst, i) => (
                              <li key={i}>{inst}</li>
                            ))}
                          </ol>
                        </div>
                      </div>
                    </div>
                  )})}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="generator"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid md:grid-cols-12 gap-8"
            >
              {/* Form Column */}
              <div className="md:col-span-5 lg:col-span-4 space-y-6">
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-200">
                  <h2 className="text-xl font-bold mb-4">{lang.whatsInKitchen}</h2>
                  
                  <div className="space-y-4">
                    <div className="bg-stone-50 p-4 rounded-xl border border-stone-200">
                      <label htmlFor="apiKey" className="block text-sm font-medium text-stone-700 mb-1.5 flex items-center justify-between">
                        {lang.apiKeyLabel}
                      </label>
                      <input
                        id="apiKey"
                        type="password"
                        className="w-full rounded-lg border-stone-300 border bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-shadow"
                        placeholder={lang.apiKeyPlaceholder}
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                      />
                    </div>

                    <div>
                      <label htmlFor="ingredients" className="block text-sm font-medium text-stone-700 mb-1.5">
                        {lang.availableIngredients}
                      </label>
                      <textarea
                        id="ingredients"
                        rows={4}
                        className="w-full rounded-xl border-stone-300 border bg-stone-50 px-4 py-3 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-shadow resize-none"
                        placeholder={lang.ingredientsPlaceholder}
                        value={ingredients}
                        onChange={(e) => setIngredients(e.target.value)}
                      />
                    </div>

                    <div>
                      <label htmlFor="style" className="block text-sm font-medium text-stone-700 mb-1.5">
                        {lang.cookingStyle}
                      </label>
                      <select
                        id="style"
                        className="w-full rounded-xl border-stone-300 border bg-stone-50 px-4 py-3 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-shadow appearance-none"
                        value={style}
                        onChange={(e) => setStyle(e.target.value)}
                      >
                        <option value="Any">{lang.styleOptions.Any}</option>
                        <option value="Indonesian">{lang.styleOptions.Indonesian}</option>
                        <option value="Western">{lang.styleOptions.Western}</option>
                        <option value="Japanese">{lang.styleOptions.Japanese}</option>
                        <option value="Italian">{lang.styleOptions.Italian}</option>
                        <option value="Indian">{lang.styleOptions.Indian}</option>
                        <option value="Mexican">{lang.styleOptions.Mexican}</option>
                        <option value="Healthy">{lang.styleOptions.Healthy}</option>
                        <option value="Quick">{lang.styleOptions.Quick}</option>
                      </select>
                    </div>

                    {error && (
                      <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm border border-red-100">
                        {error}
                      </div>
                    )}

                    <button
                      onClick={handleGenerate}
                      disabled={loading}
                      className="w-full bg-orange-600 hover:bg-orange-700 text-white font-medium py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-sm"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          {lang.cookingUpIdeas}
                        </>
                      ) : (
                        <>
                          <ChefHat className="w-5 h-5" />
                          {lang.generateRecipe}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Result Column */}
              <div className="md:col-span-7 lg:col-span-8">
                {recipe ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-stone-200"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6 pb-6 border-b border-stone-100">
                      <div>
                        <h2 className="text-2xl md:text-3xl font-bold text-stone-900 mb-3">{recipe.translations[language].recipeName}</h2>
                        <div className="flex flex-wrap gap-3 text-sm font-medium text-stone-600">
                          <span className="flex items-center gap-1.5 bg-orange-50 text-orange-700 px-3 py-1.5 rounded-lg border border-orange-100">
                            <Clock className="w-4 h-4" /> {lang.prep}: {recipe.translations[language].prepTime}
                          </span>
                          <span className="flex items-center gap-1.5 bg-orange-50 text-orange-700 px-3 py-1.5 rounded-lg border border-orange-100">
                            <Utensils className="w-4 h-4" /> {lang.cook}: {recipe.translations[language].cookTime}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => toggleFavorite(recipe)}
                        className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${
                          isFavorite(recipe.id)
                            ? 'bg-orange-50 border-orange-200 text-orange-600'
                            : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
                        }`}
                      >
                        <Heart className={`w-5 h-5 ${isFavorite(recipe.id) ? 'fill-current' : ''}`} />
                        {isFavorite(recipe.id) ? lang.saved : lang.save}
                      </button>
                    </div>

                    <div className="grid md:grid-cols-12 gap-8">
                      <div className="md:col-span-4 space-y-4">
                        <h3 className="text-lg font-bold flex items-center gap-2">
                          <span className="bg-stone-100 w-8 h-8 rounded-full flex items-center justify-center text-sm">🛒</span>
                          {lang.ingredientsTitle}
                        </h3>
                        <ul className="space-y-2">
                          {recipe.translations[language].ingredientsList.map((ing, i) => (
                            <li key={i} className="flex items-start gap-2 text-stone-700">
                              <span className="text-orange-500 mt-1">•</span>
                              <span className="leading-snug">{ing}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div className="md:col-span-8 space-y-4">
                        <h3 className="text-lg font-bold flex items-center gap-2">
                          <span className="bg-stone-100 w-8 h-8 rounded-full flex items-center justify-center text-sm">🍳</span>
                          {lang.instructionsTitle}
                        </h3>
                        <div className="space-y-4">
                          {recipe.translations[language].instructions.map((step, i) => (
                            <div key={i} className="flex gap-4">
                              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-stone-900 text-white flex items-center justify-center text-sm font-bold mt-0.5">
                                {i + 1}
                              </span>
                              <p className="text-stone-700 leading-relaxed pt-0.5">{step}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-stone-400 bg-white rounded-2xl border border-stone-200 border-dashed">
                    <ChefHat className="w-16 h-16 mb-4 opacity-20" />
                    <p className="text-lg font-medium text-stone-500">{lang.readyToCook}</p>
                    <p className="text-sm">{lang.enterIngredients}</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

