# 🧠 MedAssist AI – Smart Healthcare Assistant

🚀 **MedAssist AI** is an AI-powered healthcare assistant designed to provide early-stage symptom understanding and guidance through an intelligent conversational interface.

---

## 🏆 Hackathon Project

This project is being developed for:

👉 **Build for Bengaluru Hackathon**

🚧 Status: *Actively under development*

---

## 🎯 Overview

MedAssist AI helps users understand their symptoms, receive AI-generated insights, and take appropriate next steps — all through a simple chat interface.

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

## ✨ Features

* 💬 **Symptom Checker**

  * Chat-based interaction
  * Multi-turn conversation
  * Context-aware responses

* 🤖 **AI-Powered Insights**

  * Uses Google Gemini for analysis
  * Natural language understanding

* 📊 **Medical Context Awareness**

  * Uses previous records for better accuracy

* 👨‍⚕️ **Doctor Recommendation**

  * Suggests specialists based on symptoms

* 📁 **Chat History & Storage**

  * Stores user interactions in Firestore

* 📎 **File Upload Support**

  * Upload medical reports/images

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

* Uses **Google Gemini (LLM)** for intelligent symptom analysis
* Natural Language Processing (NLP) for understanding user input
* Multi-turn conversation handling
* Context-based responses using chat history
* Rule-based fallback system for reliability
* Safety-focused responses (no direct diagnosis)

---

## ⚙️ How It Works

1. User enters symptoms in chat
2. Chat history + medical context is sent to Gemini AI
3. AI analyzes and generates insights
4. Response is displayed in chat
5. Data is stored in Firebase Firestore
6. Relevant doctors are suggested

---

## 🎯 Target Users

* Students and working professionals
* People with limited access to healthcare
* General users seeking quick medical guidance

---

## 🌍 Impact

* Promotes early detection of health issues
* Reduces delay in medical intervention
* Encourages preventive healthcare
* Improves accessibility to basic health guidance

---

## 🚀 Getting Started

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/your-username/MedAssist_AI.git
cd MedAssist_AI
```

---

### 2️⃣ Install Dependencies

```bash
npm install
```

---

### 3️⃣ Setup Environment Variables

Create a `.env` file in the root directory:

```bash
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

---

### 4️⃣ Run the Project

```bash
npm run dev
```

---

## ⚠️ Note

* Authentication is currently bypassed for demo purposes
* Core AI functionality works without login
* Designed primarily for **hackathon demonstration**

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

## 🔮 Future Improvements

* 🚨 Emergency detection system
* 🧠 More accurate AI analysis
* 📱 Mobile responsiveness
* 🔐 Complete authentication flow
* 🏥 Integration with real doctors / APIs

---

## 👨‍💻 Author

**Tejas Kumar**

---

## ⭐ Support

If you like this project, consider giving it a ⭐ on GitHub!
