<<<<<<< HEAD
<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/5d1b7d70-73bb-474c-9a7c-82f95d0cd90b

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
=======
# 🧠 MedAssist AI – Smart Healthcare Assistant

🚀 **MedAssist AI** is an AI-powered healthcare assistant designed to provide early-stage symptom understanding and guidance through an intelligent conversational interface.

---

## 🏆 Hackathon Project

This project is developed for:

👉 **Build for Bengaluru Hackathon**

🚧 Status: *Actively under development*

---

## 🎯 Overview

MedAssist AI enables users to describe their symptoms and receive AI-powered insights, helping them take informed next steps — all through a simple and interactive chat interface.

---

## 🧠 Problem

Many individuals delay seeking medical help due to:

* Lack of awareness
* Time constraints
* Limited access to healthcare

👉 Early symptoms are often ignored, leading to serious health complications.

---

## 💡 Solution

MedAssist AI:

* Interacts with users via chat
* Asks intelligent follow-up questions
* Provides preliminary health insights
* Suggests next steps like self-care or consulting a doctor

---

## ✨ Key Features

* 💬 **AI Symptom Checker**

  * Chat-based interface
  * Multi-turn conversation
  * Context-aware responses

* 🤖 **Gemini AI Integration**

  * Powered by Google Gemini
  * Natural language understanding

* 📊 **Medical Context Awareness**

  * Uses previous interactions for better analysis

* 👨‍⚕️ **Doctor Recommendation**

  * Suggests relevant specialists based on symptoms

* 📁 **Chat History & Storage**

  * Stores conversations using Firebase Firestore

* 📎 **File Upload Support**

  * Upload reports or medical documents

* 🔐 **Authentication (Optional)**

  * Firebase Google Login (currently bypassed for demo)

---

## 🛠 Tech Stack

* **Frontend:** React + Vite + TypeScript
* **Backend:** Firebase (Firestore, Authentication)
* **AI:** Google Gemini API
* **UI:** Tailwind CSS + Lucide Icons

---

## 🤖 AI Approach

* Uses **Google Gemini (LLM)** for symptom analysis
* Natural Language Processing (NLP) for understanding user input
* Multi-turn conversational flow
* Context-based reasoning using chat history
* Rule-based fallback for stability
* Safety-first responses (no direct diagnosis)

---

## ⚙️ How It Works

1. User enters symptoms in chat
2. AI processes input using Gemini
3. Context (chat history + records) is considered
4. AI generates insights and suggestions
5. Data is stored in Firestore
6. Relevant doctors are recommended

---

## 🎯 Target Users

* Students and working professionals
* People with limited access to healthcare
* General users seeking quick guidance

---

## 🌍 Impact

* Encourages early detection of health issues
* Reduces delay in medical consultation
* Promotes preventive healthcare
* Improves accessibility to basic health guidance

---

## 📊 Project Status

| Module         | Status                  |
| -------------- | ----------------------- |
| UI             | ✅ Completed             |
| Chat System    | ✅ Working               |
| Firebase       | ✅ Integrated            |
| Firestore      | ✅ Working               |
| Gemini AI      | ⚠️ Optimization ongoing |
| Authentication | ⚠️ Temporarily bypassed |

---

## 🎤 Hackathon Pitch

> “MedAssist AI is an intelligent healthcare assistant that leverages Google Gemini AI for symptom analysis and Firebase for real-time data handling, providing users with instant, context-aware medical insights.”

---

## 🔮 Future Scope

* 🚨 Emergency detection system
* 🧠 Improved AI accuracy
* 📱 Mobile optimization
* 🔐 Full authentication system
* 🏥 Integration with real healthcare providers

---

## 👨‍💻 Author

**Tejas Kumar**

---

## ⭐ Support

If you like this project, consider giving it a ⭐
>>>>>>> d02acf233798df52917dea3d6834f5829927b17c
