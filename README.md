# 🍳 Smart Recipe Generator (Resep Pintar)

A lightweight, fully client-side AI-powered web application that generates step-by-step cooking recipes based on available ingredients. This project was developed during my exploration of Google Developer technologies and Generative AI using Google AI Studio.

## 🌐 Live Demo & Deployment
The project is built using modern web frameworks and deployed seamlessly on Netlify.
- **Hosted on:** [Netlify](https://netlify.com)
- **AI Model:** Gemini 2.5 Flash (via Google AI Studio integration)

## ✨ Features
- **Smart Ingredient Matching:** Instantly creates practical, creative recipes from whatever ingredients you type.
- **Bilingual Interface:** Supports fluid toggle options between English and Indonesian.
- **Secure Client-Side Architecture:** Users can input their own Gemini API Key directly into the UI. The key is processed safely in the browser without backend data leaks.
- **Dynamic Content Formatting:** Outputs clean markdown text containing preparation time, ingredient measurements, and structured cooking instructions.

## 🛠️ Tech Stack & Architecture
- **Framework & Build Tool:** Vite + TypeScript
- **Styling:** Tailwind CSS (or standard components generated via AI Studio)
- **AI Integration:** Direct HTTPS Fetch / Google Gen AI SDK utilizing client-supplied credentials.

## 🚀 How to Run Locally & Configure

### Prerequisites
Make sure you have an active API Key from [Google AI Studio](https://google.com).

### Installation Steps
1. Clone this repository to your local computer:
   ```bash
   git clone https://github.com
   ```
2. Navigate into the project folder:
   ```bash
   cd smart-recipe-generator-ai
   ```
3. Install the required dependencies:
   ```bash
   npm install
   ```
4. Start the local development server:
   ```bash
   npm run dev
   ```

## ⚠️ Troubleshooting & API Notes

### Handling HTTP 503 (UNAVAILABLE) Errors
Since this project runs on Google's Free Tier API, you might occasionally encounter a `503 Service Unavailable` red error alert when clicking the **"Buat Resep"** button. 
- **Cause:** This happens when the public Gemini free-tier servers are experiencing temporary spikes in high demand.
- **Solution:** Simply wait for 10–30 seconds and click the button again. The rate-limits reset dynamically.

### CORS & Restrictions
If you plan to lock down your API key inside the Google Cloud Console, make sure to add your Netlify deployment URL under the **"Allowed Referrers / CORS origins"** section in your Google AI Studio API Key settings.
