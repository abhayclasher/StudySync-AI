<h1 align="center">📚 StudySync AI</h1>

<p align="center">
  <strong>Transform Your Learning Experience with AI-Powered Study Tools — Master Knowledge, One Concept at a Time</strong>
</p>

<p align="center">
  <a href="https://studysync-ai.vercel.app" target="_blank">
    <img src="https://img.shields.io/badge/🌍_Live_Site-studysync--ai.vercel.app-4F46E5?style=for-the-badge&logo=vercel&logoColor=white" alt="Live Site" />
  </a>
  <img src="https://img.shields.io/badge/License-MIT-4F46E5?style=for-the-badge&logo=open-source-initiative&logoColor=white" alt="License" />
  <img src="https://img.shields.io/badge/Built_with-React_18-61DAFB?style=for-the-badge&logo=react&logoColor=white" alt="React" />
  <img src="https://img.shields.io/badge/Database-Supabase-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" />
 <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/AI-Gemini-4285F4?style=for-the-badge&logo=google&logoColor=white" alt="Gemini AI" />
</p>

<p align="center">
  <img src="/public/homepage.png" alt="StudySync AI Homepage" width="800" />
</p>

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [Backend Server Setup](#-backend-server-setup)
- [Project Structure](#-project-structure)
- [Pages & Previews](#-pages--previews)
- [Deployment](#-deployment)
- [API Integration](#-api-integration)
- [Contributing](#-contributing)
- [License](#-license)
- [Credits](#️-credits)

---

## ✨ Overview

StudySync AI is an **AI-powered learning platform** designed to revolutionize how students learn, practice, and master complex concepts. By leveraging cutting-edge AI technology, the platform provides personalized learning experiences that adapt to each user's unique learning style and pace.

### 🎯 Key Highlights

- **🤖 AI-Powered Learning**: Gemini AI integration for intelligent content analysis and generation
- **🎓 Interactive Tools**: Flashcards, quizzes, and interactive learning modules
- **🎥 Video Learning**: Smart video player with transcript integration
- **🗺️ Roadmap Generator**: Personalized learning paths based on your goals
- **📱 Real-time Sync**: Supabase-powered real-time data synchronization
- **🎨 Modern UI**: Beautiful, responsive interface with smooth animations
- **👥 Social Learning**: Collaborative features for group learning experiences

### 💡 Mission & Vision

**📚 Mission:** Make high-quality, personalized education accessible to everyone through intelligent AI assistance  
**🌍 Vision:** Create *the world's most effective AI-powered learning ecosystem* that adapts to every learner's unique needs

---

## ⚡ Features

### 🔥 Core Features

| Feature | Description |
|---------|-------------|
| 🧠 **AI Content Analysis** | Automatically analyze documents, videos, and content to generate study materials |
| 🎯 **Interactive Flashcards** | Create, review, and practice with AI-generated flashcards |
| 🧩 **Adaptive Quizzes** | Personalized quizzes that adapt to your learning progress |
| 📹 **Video Learning** | Integrated video player with transcript and AI-powered summarization |
| 🗺️ **Learning Roadmaps** | Generate personalized study paths based on your goals |
| 💬 **AI Chat Assistant** | Get instant answers to your questions with our AI tutor |
| 📊 **Progress Tracking** | Monitor your learning progress with detailed analytics |
| 🌙 **Dark Mode First** | Beautiful dark theme by default with light mode toggle |
| 📱 **Fully Responsive** | Seamless experience across desktop, tablet, and mobile devices |
| 🔐 **Secure Authentication** | Supabase-powered user authentication and data security |

### 🎮 Advanced Features

| Feature | Description |
|---------|-------------|
| 📝 **Document Upload** | Upload PDFs, Word docs, and other formats for AI processing |
| 🎧 **Transcript Integration** | Automatic transcript generation and analysis for video content |
| 🏆 **Learning Gamification** | Points, badges, and leaderboards to keep you motivated |
| 📅 **Study Scheduling** | Intelligent study schedule recommendations |
| 🤝 **Collaborative Learning** | Share flashcards and quizzes with peers |
| 📈 **Performance Analytics** | Detailed insights into your learning patterns and progress |

---

## 🧱 Tech Stack

### Frontend
- **Framework**: [React 18](https://react.dev/) with Vite
- **Language**: [TypeScript](https://www.typescriptlang.org/) 5.0+
- **UI Library**: [React](https://react.dev/) + Custom Components
- **Styling**: [TailwindCSS](https://tailwindcss.com/) + CSS Modules
- **Animations**: Custom CSS animations and transitions
- **Icons**: [Lucide React](https://lucide.dev/) + Custom SVG icons
- **Forms**: React Hook Form + Zod validation
- **Theme**: Custom dark/light mode implementation

### Backend & Database
- **Database**: [Supabase](https://supabase.com/) (PostgreSQL + Authentication)
- **Real-time**: Supabase real-time updates
- **Storage**: Supabase Storage (for document uploads)
- **Authentication**: Supabase Auth
- **AI Integration**: Google Gemini API

### Development Tools
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Package Manager**: npm
- **Linting**: ESLint + Prettier
- **Deployment**: [Vercel](https://vercel.com/) / [Netlify](https://netlify.com/)
- **Version Control**: Git & GitHub

### Key Dependencies
```json
{
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "typescript": "^5.0.2",
  "vite": "^4.4.5",
  "@supabase/supabase-js": "^2.38.4",
  "@google/generative-ai": "^0.1.3",
  "tailwindcss": "^3.3.3",
  "lucide-react": "^0.294.0"
}
```

---

## 🧭 Pages & Previews

### 🏠 Dashboard
Your personalized learning hub with progress tracking, recent activity, and quick access to tools.  
![Dashboard](/public/dashboard.png)

---

### 📹 Video Learning
Integrated video player with transcript and AI-powered analysis.  
![Video Learning](/public/video-learning.png)

---

### 🗺️ Roadmap Generator
Personalized learning paths based on your goals and current knowledge.  
![Roadmap](/public/roadmap.png)

---

### 💬 AI Chat Interface
Interactive chat with AI tutor for instant help and explanations.  
![AI Chat](/public/ai-chat.png)

---

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18.x or higher ([Download](https://nodejs.org/))
- **npm** or **yarn** package manager
- **Git** ([Download](https://git-scm.com/))
- **Supabase Account** ([Sign Up](https://supabase.com/))
- **Google Gemini API Key** ([Get API Key](https://ai.google.dev/))

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/abhayclasher/StudySync-AI.git
   cd StudySync-AI
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**
   - Create a new Supabase project at [Supabase Console](https://console.supabase.com/)
   - Enable authentication and create required tables
   - Copy your Supabase URL and Anon Key
   - Create a `.env.local` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_GEMINI_API_KEY=your_gemini_api_key
   ```
   
   **Important Supabase Configuration:**
   - After creating your Supabase project, go to Authentication → Settings
   - Add these URLs to "Redirect URLs":
     - For local development: `http://localhost:3000`
     - For deployed app: your deployed URL (e.g., `https://your-app-name.vercel.app`)
   - Enable the authentication providers you want to use (Google, GitHub, etc.)
   
   **For Production Deployment (Vercel)**: Add these environment variables in your Vercel project settings:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_GEMINI_API_KEY`

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:5173](http://localhost:5173)

### Build for Production

```bash
npm run build
npm run preview
```

---

## 🖥️ Backend Server Setup

### Prerequisites for Backend

Before running the backend server, ensure you have:

- **Node.js** 18.x or higher ([Download](https://nodejs.org/))
- **npm** or **yarn** package manager
- **YouTube API Key** (optional, for enhanced functionality)

### Running the Backend Server

1. **Navigate to the server directory**
   ```bash
   cd server
   ```

2. **Install server dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   - Create a `.env` file in the `server` directory:
   ```env
   YOUTUBE_API_KEY=your_youtube_api_key
   ```

4. **Start the backend server**
   ```bash
   # For development (with auto-restart on changes)
   npm run dev
   
   # For production
   npm start
   ```

5. **Server will run on**
   Navigate to [http://localhost:3001](http://localhost:3001)

### Backend API Endpoints

| Endpoint | Method | Description | Request Body |
|----------|--------|-------------|--------------|
| `/` | GET | Health check - confirms server is running | None |
| `/api/transcript` | POST | Fetch YouTube video transcript | `{ "url": "youtube_video_url" }` |
| `/api/playlist` | POST | Fetch YouTube playlist videos | `{ "url": "youtube_playlist_url" }` |

### Backend Features

- **YouTube Transcript API**: Extracts transcripts from YouTube videos for study materials
- **YouTube Playlist API**: Fetches all videos from a playlist for comprehensive learning
- **Robust Error Handling**: Multiple fallback methods for reliable YouTube integration
- **CORS Enabled**: Allows cross-origin requests from your frontend

---

## 🧩 Project Structure

```bash
StudySync-AI/
│
├── api/                          # API endpoints and transcript handling
│   ├── playlist.js               # YouTube playlist processing
│   └── transcript.js             # Transcript generation and processing
│
├── components/                   # React components
│   ├── ui/                       # Reusable UI components
│   │   ├── 3d-card.tsx
│   │   ├── apple-cards-carousel.tsx
│   │   ├── bento-grid.tsx
│   │   ├── colourfull-text.tsx
│   │   ├── container-scroll-animation.tsx
│   │   ├── evervault-card.tsx
│   │   ├── particles.tsx
│   │   ├── sidebar.tsx
│   │   ├── sticky-scroll-reveal.tsx
│   │   ├── tabs.tsx
│   │   ├── text-generate-effect.tsx
│   │   └── wobble-card.tsx
│   ├── AuthModal.tsx             # Authentication modal
│   ├── ChatInterface.tsx         # AI chat interface
│   ├── Dashboard.tsx             # Main dashboard
│   ├── DocumentUpload.tsx        # Document upload component
│   ├── FlashcardDeck.tsx         # Flashcard system
│   ├── LandingPage.tsx           # Landing page
│   ├── QuizArena.tsx             # Quiz system
│   ├── RightSidebar.tsx          # Right sidebar
│   ├── RoadmapGenerator.tsx      # Learning roadmap generator
│   ├── Sidebar.tsx               # Main sidebar
│   └── VideoPlayer.tsx           # Video player with transcript
│
├── hooks/                        # Custom React hooks
│   └── use-outside-click.tsx
│
├── lib/                          # Utility functions & configs
│   ├── supabase.ts               # Supabase client initialization
│   └── utils.ts                  # Helper functions
│
├── server/                       # Server-side code
│   ├── index.js                  # Server entry point
│   ├── package.json
│   └── package-lock.json
│
├── services/                     # Business logic services
│   ├── db.ts                     # Database service
│   └── geminiService.ts          # Gemini AI service
│
├── public/                       # Static assets
│   └── *.svg                     # Icons and images
│
├── .env.example                  # Environment variables template
├── .gitignore                    # Git ignore configuration
├── App.tsx                       # Main application component
├── index.html                    # HTML entry point
├── index.tsx                     # React entry point
├── package.json                  # Project dependencies
├── setup-database.js             # Database setup script
├── supabase_init.sql             # Database initialization SQL
├── tsconfig.json                 # TypeScript configuration
├── vite.config.ts                # Vite configuration
└── README.md                     # Project documentation
```

## 🔗 API Integration

### Gemini AI Integration
StudySync AI leverages Google's Gemini API for intelligent content analysis and generation:

- **Document Analysis**: Automatically analyze uploaded documents to extract key concepts
- **Quiz Generation**: Create personalized quizzes based on learning materials
- **Explanation Generation**: Provide detailed explanations for complex topics
- **Content Summarization**: Generate concise summaries of lengthy content

### Supabase Integration
- **Authentication**: Secure user authentication and authorization
- **Database**: Real-time data synchronization and storage
- **Storage**: Document and media file storage
- **Real-time**: Live updates for collaborative features

### YouTube Integration
- **Video Processing**: Analyze YouTube videos for educational content
- **Transcript Extraction**: Automatically extract and process video transcripts
- **Playlist Management**: Handle entire YouTube playlists for comprehensive learning

---

## 🚀 Deployment

### Live Site

The application is deployed on **Vercel** for optimal performance and reliability.

🌍 **Visit**: [studysync-ai.vercel.app](https://studysync-ai.vercel.app/)

### Deploy Your Own

#### Option 1: Deploy to Vercel (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/abhayclasher/StudySync-AI)

1. Click the button above
2. Connect your GitHub account
3. Add environment variables (Supabase and Gemini API config)
4. Set Build Command: `npm run build` (Vercel will auto-detect this but you can verify)
5. Set Output Directory: `dist` (Vercel will auto-detect this but you can verify)
6. Add Node.js version: 18.x or higher
7. Deploy!

**Important: After deployment, make sure to configure Supabase authentication:**
- Go to your Supabase dashboard
- Navigate to Authentication → Settings (or URL Configuration in older versions)
- Add your deployed URL (e.g., `https://your-app-name.vercel.app`) to the "Redirect URLs" field
- For local development, make sure to include `http://localhost:3000` in the "Redirect URLs" field
- For social logins (Google, GitHub), these redirect URLs must match exactly what you're using in your application

#### Option 2: Manual Deployment

**Install Dependencies:**
```bash
npm install
```

**Build for Production:**
```bash
npm run build
```

**Deploy with Vercel CLI:**
```bash
# Install Vercel CLI globally
npm install -g vercel

# Deploy to production
vercel --prod
```

**Preview locally:**
```bash
npm run preview
```

#### Option 3: Other Platforms

- **Netlify**: Use the included build configuration (Build command: `npm run build`, Publish directory: `dist`)
- **Docker**: Build a container with your preferred setup
- **Self-hosted**: Deploy on any Node.js server with the required dependencies

---

## 🤝 Contributing

We welcome contributions from the community! Here's how you can help:

### Ways to Contribute

- 🐛 **Report Bugs**: Open an issue describing the problem
- 💡 **Suggest Features**: Share your ideas for improvements
- 🔧 **Submit Pull Requests**: Fix bugs or add new features
- 📚 **Improve Documentation**: Help make the docs better
- 🌍 **Spread the Word**: Share StudySync AI with others

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Standards

- Follow the existing code style
- Write meaningful commit messages
- Add comments for complex logic
- Test your changes thoroughly
- Update documentation as needed

---

## 📄 License

This project is licensed under the **MIT License**.  

✅ **Permitted**: Personal use, modifications, commercial use  
✅ **Required**: Include copyright notice and license in all copies

See the [LICENSE](./LICENSE) file for complete terms.

---
## 🙏 Acknowledgments

- **Supabase** for providing robust real-time database infrastructure
- **Vercel** for seamless deployment and hosting
- **Google Gemini** for powerful AI capabilities
- **React Team** for the incredible component framework
- **Open Source Community** for inspiration and support
- **YouTube API** for video content integration

---

## 🛠️ Troubleshooting

### Common Login Issues

**1. Login not working after deployment:**
- Make sure you've properly set the environment variables in your deployment platform
- Check that your Supabase project has the correct redirect URLs configured in Authentication settings
- Verify that the deployed URL is added to both "Redirect URLs" and "Additional URLs" in Supabase

**2. Supabase client not initialized:**
- Ensure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are correctly set
- Check that the environment variables are properly prefixed with `VITE_` for Vite to expose them

**3. Social login not working:**
- For Google/GitHub OAuth, make sure to configure the providers in your Supabase Authentication settings
- Add the correct redirect URLs for your deployed application
- Example redirect URLs: `https://your-app-name.vercel.app`, `http://localhost:5173`

**4. After successful login, page doesn't update:**
- This might be due to a missing auth state listener
- Make sure the Supabase client is properly initialized with correct credentials
- Check browser console for any error messages

**5. Social login redirects to wrong URL (e.g., localhost:3000 instead of localhost:5173):**
- This is caused by incorrect redirect URL configuration in your Supabase authentication settings
- Go to your Supabase dashboard → Authentication → Settings
- Update the "Redirect URLs" to match your application's URL (e.g., `http://localhost:5173` for local development, your deployed URL for production)
- Make sure to include all possible URLs where your app runs


---

## 📞 Support & Contact

Need help or have questions?

- 📧 **Email**: [abhaypro.cloud@gmail.com](mailto:abhaypro.cloud@gmail.com)
- 🐛 **Issues**: [GitHub Issues](https://github.com/abhayclasher/StudySync-AI/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/abhayclasher/StudySync-AI/discussions)

---

## ❤️ Credits  

<div align="center">

### 👨‍💻 Developed by  
# **Abhay Kumar**  

🧠 **Full Stack Web Developer** | 21 | Kolkata, India 🇮🇳  
*Building technology that transforms learning through AI and innovation*

### 🏆 About the Developer

- 💻 Passionate about creating impactful solutions with modern web technologies
- 🎯 Focused on education technology and AI-powered learning
- 🎓 Self-taught developer with expertise in React, TypeScript, and AI integration
- ♟️ Hobbies: Chess, Cricket, and Open Source Contribution

---

### 🔗 Connect With Me

<p align="center">
  <a href="https://abhaypro.com" target="_blank">
    <img src="https://img.shields.io/badge/🌍_Portfolio-abhaypro.com-4F46E5?style=for-the-badge&logo=google-chrome&logoColor=white" alt="Website" />
 </a>
  <a href="https://github.com/abhayclasher" target="_blank">
    <img src="https://img.shields.io/badge/GitHub-abhayclasher-1C1C1C?style=for-the-badge&logo=github&logoColor=white" alt="GitHub" />
  </a>
  <a href="https://linkedin.com/in/abhayclasher" target="_blank">
    <img src="https://img.shields.io/badge/LinkedIn-Connect-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white" alt="LinkedIn" />
  </a>
  <a href="mailto:abhaypro.cloud@gmail.com" target="_blank">
    <img src="https://img.shields.io/badge/Email-Contact-D14836?style=for-the-badge&logo=gmail&logoColor=white" alt="Email" />
  </a>
</p>

---

### 💭 Project Philosophy

<p align="center">
  <em>"Every concept mastered, every milestone achieved."</em>
  <br><br>
  This project was born from a simple belief: <strong>technology should enhance learning</strong>.<br>
 In today's world, everyone deserves access to personalized, effective learning tools.<br>
  StudySync AI eliminates barriers between complex concepts and understanding.<br><br>
  <strong>No limits. No boundaries. Just learning unleashed.</strong>
</p>

---

<p align="center">
  ⭐ <strong>If this project helped you or someone you know, please star it!</strong> ⭐<br>
  Your support motivates continued development and helps others discover this resource.
</p>

<p align="center">
  <br>
  ❤️ <strong>Made with passion in India</strong> 🇮🇳<br>
 <sub>Dedicated to everyone working to make education accessible and effective</sub>
</p>

</div>