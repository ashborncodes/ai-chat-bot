# 🚑 RescueTriage AI — Emergency Triage & SOS 112

> **AI-powered emergency triage and first-aid assistance for first responders in India.**

🌐 **Live Demo:** https://rescuetriageai.ai.studio/

RescueTriage AI is an emergency-response web application designed to help first responders quickly assess a patient's condition, understand urgency, and follow concise first-aid guidance while professional medical help is on the way.

The system combines **AI-powered triage, voice/text input, first-aid guidance, Indian emergency context, SOS 112 access, and PWA capabilities** into a single interface.

> ⚠️ **Medical Safety Notice:** RescueTriage AI is a prototype intended to support emergency response and education. It does not replace trained medical professionals, emergency services, or professional medical judgment. In a life-threatening emergency in India, contact **112** immediately.

---

## 🌐 Live Demo

### 🚨 Try RescueTriage AI

**https://rescuetriageai.ai.studio/**

Use the application to:

* 🩺 Describe symptoms or injuries
* 🎙️ Use voice input
* 🤖 Receive an AI-assisted urgency classification
* 🔴🟡🟢⚫ View triage status
* 🩹 Follow step-by-step first-aid guidance
* 📞 Quickly access India's emergency number **112**
* 📱 Use the application as a PWA
* 📡 Continue using supported offline functionality

---

# 🎯 Problem

During an emergency, the first few minutes can be critical.

A bystander or first responder may need to answer questions such as:

* How serious is the situation?
* Which patient needs attention first?
* What should I do right now?
* Should emergency services be contacted?
* What information should be communicated to responders?
* What can safely be done while waiting for professional help?

Under stress, finding and interpreting information quickly can be difficult.

**RescueTriage AI aims to provide a simple, fast, and accessible interface for emergency decision support.**

---

# 💡 Solution

RescueTriage AI provides an AI-assisted emergency workflow:

```text
User describes emergency
          ↓
Voice / Text Input
          ↓
AI analyzes the information
          ↓
Urgency classification
          ↓
RED / YELLOW / GREEN / BLACK
          ↓
Immediate first-aid guidance
          ↓
Emergency services / 112
```

The interface is designed around **speed, clarity, and actionable information** rather than complicated medical terminology.

---

# 🚦 Triage System

RescueTriage AI uses four emergency triage categories:

| Tag           | Meaning                                                                                       | General Priority            |
| ------------- | --------------------------------------------------------------------------------------------- | --------------------------- |
| 🔴 **RED**    | Immediate / life-threatening emergency                                                        | Immediate attention         |
| 🟡 **YELLOW** | Serious condition requiring urgent assessment                                                 | Urgent attention            |
| 🟢 **GREEN**  | Minor / currently stable condition                                                            | Lower priority              |
| ⚫ **BLACK**   | Extremely critical / deceased or not expected to survive under the applicable triage protocol | Specialized triage category |

> The triage label is an **AI-assisted classification**, not a medical diagnosis. Real-world responders should follow their training and local emergency protocols.

---

# ✨ Key Features

## 🤖 AI Emergency Triage

Users can describe symptoms, injuries, or an emergency situation in natural language.

The system analyzes the information and provides an urgency category.

### Example

```text
"I found someone who is unconscious and not responding."

                ↓

        🔴 RED — IMMEDIATE

        Call emergency services.
        Begin appropriate emergency
        response according to training.
```

---

## 🎙️ Voice & Text Input

Emergency situations aren't always convenient for typing.

RescueTriage AI supports:

* 📝 Text-based descriptions
* 🎤 Speech recognition
* ⚡ Rapid interaction
* 📱 Mobile-friendly emergency access

This makes the interface more practical for situations where the responder's hands may be occupied.

---

# 🩹 First-Aid Guidance

After triage, the application can provide concise, step-by-step guidance intended to help the user take appropriate immediate action while waiting for professional help.

The goal is to avoid overwhelming the user with large amounts of information.

### Example workflow

```text
1. Assess the situation
2. Contact emergency services when required
3. Follow the displayed immediate steps
4. Monitor the person
5. Provide relevant information to responders
```

Guidance is designed to be:

* ✅ Short
* ✅ Action-oriented
* ✅ Easy to scan
* ✅ Emergency-focused
* ✅ Suitable for a stressful environment

---

# 🇮🇳 Built for India

RescueTriage AI is designed with the Indian emergency-response context in mind.

### 🚨 SOS 112

The application provides quick access to India's unified emergency number:

**112**

This allows users to move from AI-assisted guidance toward professional emergency assistance when required.

---

# 📱 Progressive Web App

RescueTriage AI is designed as a **Progressive Web Application (PWA)**.

This enables features such as:

* 📱 Installable web application
* ⚡ Fast loading
* 📡 Offline status awareness
* 💾 Local session storage
* 🌐 Web-based accessibility
* 📲 Mobile-friendly interface

The PWA approach is particularly useful for emergency applications where connectivity may not always be reliable.

---

# 🧠 Offline Support

The application includes offline-aware functionality.

Where supported, the application can provide locally available functionality without depending entirely on a live API connection.

```text
Internet Available
       ↓
AI-powered analysis
       +
Online functionality

Internet Unavailable
       ↓
Offline-aware interface
       +
Locally available emergency functionality
```

> AI-generated functionality may require an active internet connection depending on the feature being used.

---

# 🏗️ Architecture

```text
┌───────────────────────────────┐
│          User / Responder     │
└───────────────┬───────────────┘
                │
                ▼
┌───────────────────────────────┐
│       React Frontend          │
│                               │
│ • Chat Interface              │
│ • Voice Input                 │
│ • Triage UI                   │
│ • First-Aid Guidance          │
│ • SOS 112                     │
│ • PWA                         │
└───────────────┬───────────────┘
                │
                ▼
┌───────────────────────────────┐
│       Express.js Server       │
│                               │
│ • API handling                │
│ • Request processing          │
│ • AI integration              │
└───────────────┬───────────────┘
                │
                ▼
┌───────────────────────────────┐
│       Google Gemini API       │
│                               │
│ AI-assisted triage reasoning  │
│ and response generation       │
└───────────────────────────────┘
```

---

# 🛠️ Tech Stack

## Frontend

* ⚛️ **React 19**
* 📘 **TypeScript**
* ⚡ **Vite**
* 🎨 **Tailwind CSS v4**
* 🎬 **Motion / Framer Motion**
* 🧩 **Lucide Icons**

## Backend

* 🟢 **Node.js**
* 🚂 **Express.js**
* 📘 **TypeScript**
* 🤖 **Google GenAI SDK**
* 🧠 **Gemini API**

## PWA

* 📱 **vite-plugin-pwa**
* 💾 Local storage
* 📡 Offline awareness
* 📲 Installable application

---

# 📁 Project Structure

```text
ai-chat-bot-main/
│
├── server.ts
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
│
├── src/
│   ├── App.tsx
│   ├── main.tsx
│   ├── index.css
│   │
│   ├── components/
│   │   ├── Header
│   │   ├── TriageCards
│   │   ├── Timers
│   │   └── Modals
│   │
│   ├── hooks/
│   │   ├── useOnlineStatus
│   │   └── usePWAInstall
│   │
│   ├── types/
│   │
│   └── utils/
│       ├── speech
│       ├── sound
│       ├── offlineTriage
│       └── storage
│
└── public/
    ├── manifest
    └── icons
```

---

# 🚀 Getting Started

## 1. Clone the repository

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd ai-chat-bot-main
```

## 2. Install dependencies

```bash
npm install
```

## 3. Configure environment variables

Create a `.env` file:

```env
GEMINI_API_KEY=your_api_key_here
```

> Never commit your API key to GitHub.

Add your environment file to `.gitignore`:

```gitignore
.env
.env.local
node_modules/
dist/
```

---

# ▶️ Run the Application

### Development

```bash
npm run dev
```

If your project uses separate frontend/backend scripts, start them according to the scripts defined in `package.json`.

The application should then be available through your local development URL.

---

# 🔐 Security Considerations

Because this application deals with emergency and potentially sensitive information:

* 🔒 Never expose API keys in frontend code
* 🔒 Keep secrets in environment variables
* 🛡️ Validate API requests on the server
* 🧹 Avoid unnecessarily storing personal medical information
* 🔐 Do not log sensitive user information
* 🚫 Do not treat AI output as a medical diagnosis
* 📞 Encourage professional emergency assistance when appropriate

---

# 🧪 Example Use Cases

### 🚗 Road Accident

A bystander discovers an injured person after a road accident.

They can:

```text
Describe the situation
        ↓
Receive urgency classification
        ↓
Follow immediate guidance
        ↓
Contact 112
        ↓
Continue monitoring while waiting
```

### 🏠 Medical Emergency

Someone suddenly becomes unresponsive at home.

The responder can use:

* Voice input
* Emergency triage
* First-aid guidance
* SOS 112 access

### 👥 Multiple Patients

In a larger incident, responders can use triage categories to help organize attention according to the applicable emergency protocol.

---

# 🎨 Design Principles

RescueTriage AI follows several UX principles.

### 1. Speed

Emergency interfaces should minimize unnecessary interaction.

### 2. Clarity

Important information should be immediately visible.

### 3. Accessibility

The application supports both voice and text interaction.

### 4. Actionability

Responses should focus on clear next steps.

### 5. Emergency-first UI

Critical information should receive visual priority.

---

# 🧭 Future Roadmap

Potential future improvements include:

* [ ] Multilingual Indian-language support
* [ ] Improved voice interaction
* [ ] Better offline emergency decision trees
* [ ] Location sharing with emergency contacts
* [ ] Emergency incident timeline
* [ ] Multiple-patient management
* [ ] Responder mode
* [ ] Hospital / ambulance integration
* [ ] Structured incident reports
* [ ] Accessibility improvements
* [ ] Advanced PWA caching
* [ ] Improved emergency protocol validation
* [ ] Secure analytics for system improvement

---

# ⚠️ Medical Disclaimer

RescueTriage AI is an **AI-assisted prototype**.

It is **not a substitute for**:

* Emergency medical services
* Doctors
* Paramedics
* Certified first responders
* Official triage protocols
* Professional medical judgment

AI systems can make mistakes.

For a real emergency, users should contact the appropriate emergency service and follow instructions from trained professionals.

**In India, emergency assistance can be reached through 112.**

---

# 🤝 Contributing

Contributions are welcome.

```bash
# Fork the repository

# Create a branch
git checkout -b feature/your-feature

# Make your changes
git add .

# Commit
git commit -m "Add your feature"

# Push
git push origin feature/your-feature
```

Then open a Pull Request.

---

# 📜 License

Add your preferred open-source license here, such as **MIT License**, before publishing the repository.

---

# 👨‍💻 Project

## RescueTriage AI

**Emergency Triage & SOS 112**

🌐 **Live Application**

https://rescuetriageai.ai.studio/

> **When every second matters, make the next step clearer.** 🚑

---

### ⭐ If you find the project useful

Consider:

* ⭐ Starring the repository
* 🍴 Forking the project
* 🐛 Reporting issues
* 💡 Suggesting improvements
* 🤝 Contributing to the project

**Built with React, TypeScript, Gemini AI, and a focus on emergency response.**
