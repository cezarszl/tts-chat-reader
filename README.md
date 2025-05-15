# 📣 TTS Chat Reader — Voice Assistant for WhatsApp & Signal Messages

TTS Chat Reader is a personal voice assistant that reads incoming WhatsApp and Signal messages aloud using AI-generated speech (Text-to-Speech, or TTS).  
It’s designed as a local web app that helps you stay informed — even while cooking, working, or away from the screen.

> 🧪 Built with Vue.js (frontend), Node.js + Express (backend), ElevenLabs TTS API, and fully containerized via Docker.

---

## 🎯 Key Features

- ✅ Reads messages aloud using high-quality AI voices (via ElevenLabs API)
- ✅ Supports WhatsApp and Signal messages
- ✅ Memoizes audio to avoid repeated API usage (efficient billing)
- ✅ Clean, lightweight frontend (Vue 3 + Vite)
- ✅ Easy to run locally with Docker Compose

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/cezarszl/tts-chat-reader.git
cd tts-chat-reader
```

### 2. Set up your environment

Create a .env file by copying the example:
```bash
cp .env.example .env
```
And insert your ElevenLabs API key.

### 3. Start the app

```bash
docker compose up --build
```
Then open your browser at [http://localhost:5173](http://localhost:5173)

## 📁 Project Structure

```text
chattts/
├── backend/         # Node.js backend for WhatsApp/Signal + TTS
├── frontend/        # Vue.js frontend
├── messages/        # Cached audio files (not in Git)
├── docker-compose.yml
├── .env.example
└── README.md 
```

## ⚙️ Tech Stack

- 🧩 Vue 3 + Vite

- 🚀 Node.js + Express

- 🔊 ElevenLabs TTS API

- 🔿 whatsapp-web.js

- 🔹 signal-cli (planned)

- 🐳 Docker & Docker Compose

## 📌 Roadmap

 - [ ] Read WhatsApp messages via whatsapp-web.js

 - [ ] Text-to-speech with memoization

 - [ ] Signal message integration via signal-cli

- [ ] Frontend UI polish + filters (contacts, platforms)

- [ ] Configurable voice settings (style, tone)

## 📜 License

MIT — use it, modify it, fork it!

---

> Built for fun and learning. 
> Powered by open communication — and a synthetic voice 😄