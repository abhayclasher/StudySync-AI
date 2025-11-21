# StudySync AI

**Transform your learning experience with AI-powered study tools**

StudySync AI is an innovative educational platform that leverages artificial intelligence to enhance the learning process. Our application offers a comprehensive suite of tools designed to help students learn more effectively through video content analysis, interactive flashcards, quizzes, and personalized learning roadmaps.

## 🚀 Features

### 📹 Video Learning Assistant
- **YouTube Integration**: Seamlessly integrate YouTube videos to enhance your learning experience
- **AI-Powered Analysis**: Our AI analyzes video content to extract key concepts and create learning materials
- **Transcript Processing**: Automatic transcription and analysis of video content

### 🧠 Interactive Learning Tools
- **Smart Flashcards**: AI-generated flashcards based on your study materials
- **Adaptive Quizzes**: Personalized quizzes that adapt to your learning progress
- **Learning Roadmaps**: Personalized study paths to guide your learning journey

### 💬 AI-Powered Assistance
- **Intelligent Chat**: Get answers to your questions with our AI-powered chat interface
- **Concept Clarification**: Understand complex topics with AI explanations
- **Study Recommendations**: Personalized suggestions based on your learning patterns

### 📊 Progress Tracking
- **Learning Analytics**: Track your progress with detailed analytics
- **Performance Insights**: Understand your strengths and areas for improvement
- **Achievement System**: Motivational badges and milestones

## 🛠 Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express
- **AI Integration**: Google Gemini API
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **UI Components**: Custom-built with shadcn/ui
- **Build Tool**: Vite

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn package manager
- Google Gemini API key
- Supabase account

## 🚀 Getting Started

### Installation

1. Clone the repository:
```bash
git clone https://github.com/your-username/studysync-ai.git
cd studysync-ai
```

2. Install dependencies:
```bash
npm install
cd server && npm install
```

3. Set up environment variables:
Create `.env` files in both the root directory and the `server` directory with the required API keys.

### Environment Variables

Create `.env` file in the root directory:
```env
VITE_GEMINI_API_KEY=your_gemini_api_key_here
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Create `.env` file in the `server` directory:
```env
GEMINI_API_KEY=your_gemini_api_key_here
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### Running the Application

1. Start the backend server:
```bash
cd server
npm run dev
```

2. In a new terminal, start the frontend:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## 🏗 Project Structure

```
studysync-ai/
├── api/                    # API routes for playlist and transcript
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   ├── AuthModal.tsx     # Authentication modal
│   ├── ChatInterface.tsx # AI chat interface
│   ├── Dashboard.tsx     # Main dashboard
│   ├── FlashcardDeck.tsx # Flashcard component
│   ├── LandingPage.tsx   # Landing page
│   ├── QuizArena.tsx     # Quiz component
│   ├── RoadmapGenerator.tsx # Learning roadmap
│   ├── VideoPlayer.tsx   # Video player
│   └── ...               # Other components
├── hooks/                 # Custom React hooks
├── lib/                   # Utility functions
├── server/                # Backend server code
├── services/              # Service layer (AI, DB, etc.)
├── public/                # Static assets
└── ...                    # Configuration files
```

## 🧩 Key Components

### Dashboard
The main interface that brings together all learning tools in a cohesive experience.

### Video Player
Integrates with YouTube to analyze and process video content for learning.

### Flashcard Deck
AI-generated flashcards that help reinforce key concepts from your study materials.

### Quiz Arena
Interactive quizzes that adapt to your learning progress and knowledge gaps.

### Roadmap Generator
Creates personalized learning paths based on your goals and current knowledge.

## 🤖 AI Capabilities

StudySync AI leverages the power of Google's Gemini AI to:

- **Analyze video content** to extract key concepts and themes
- **Generate study materials** including flashcards and quizzes
- **Provide intelligent answers** to student questions
- **Create personalized learning roadmaps** based on individual needs
- **Summarize complex topics** into digestible learning units

## 🎨 UI/UX Highlights

- **Modern Design**: Clean, intuitive interface built with Tailwind CSS
- **Responsive Layout**: Works seamlessly across devices
- **Interactive Elements**: Engaging animations and transitions
- **Dark/Light Mode**: User preference support
- **Accessibility**: Designed with accessibility best practices in mind

## 📊 Analytics & Insights

- **Learning Progress**: Visualize your learning journey
- **Performance Metrics**: Track quiz scores and improvement over time
- **Time Spent**: Monitor study time and engagement
- **Knowledge Gaps**: Identify areas that need more attention

## 🔐 Security & Privacy

- **Secure Authentication**: Powered by Supabase Auth
- **Data Encryption**: All sensitive data is encrypted
- **Privacy Focused**: We don't store unnecessary personal information
- **Compliance**: Adheres to data protection regulations

## 🤝 Contributing

We welcome contributions to StudySync AI! Here's how you can help:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Commit your changes (`git commit -m 'Add amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

## 🐛 Issues

If you encounter any issues or have feature requests, please open an issue on GitHub.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🌟 Show Your Support

If you find StudySync AI helpful, please give us a ⭐ star on GitHub!

## 📞 Contact

Have questions or feedback? Feel free to reach out through GitHub issues.

---

<div align="center">

**StudySync AI** - *Empowering learners with AI*

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/your-username/studysync-ai/pulls)

</div>

## 🎯 Learning Made Smarter

Transform your study sessions with AI-powered tools designed to maximize your learning potential. Whether you're preparing for exams, learning new skills, or diving deep into complex topics, StudySync AI is your intelligent companion on the learning journey.