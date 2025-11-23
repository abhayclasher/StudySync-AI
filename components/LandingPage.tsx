import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { TextGenerateEffect } from './ui/text-generate-effect';
import { StickyScroll } from './ui/sticky-scroll-reveal';
import { Carousel, Card } from './ui/apple-cards-carousel';
import { WobbleCard } from './ui/wobble-card';
import { CardBody, CardContainer, CardItem } from './ui/3d-card';
import { EvervaultCard, Icon } from './ui/evervault-card';
import { Particles } from './ui/particles';
import ColourfulText from './ui/colourful-text';
import { 
  Sparkles, 
  Youtube, 
  FileText, 
  BrainCircuit, 
  ArrowRight, 
  Trophy,
  PlayCircle,
  Github,
  Linkedin,
  Instagram,
  Cpu,
  Heart,
  Layers,
  Info
} from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
  const featuresRef = useRef<HTMLElement>(null);
  const footerRef = useRef<HTMLElement>(null);

  const scrollToFeatures = () => {
    featuresRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToFooter = () => {
    footerRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const stickyContent = [
    {
      title: "Import Learning Material",
      description:
        "Paste any YouTube URL or upload a PDF document. StudySync AI instantly processes the content, extracting transcripts, key concepts, and summaries using Groq Llama 3.",
      content: (
        <div className="h-full w-full bg-[#050505] flex items-center justify-center text-white rounded-md border border-white/10 overflow-hidden relative">
            <div className="absolute inset-0 bg-grid-white/[0.02]"></div>
            <div className="flex flex-col items-center z-10 p-8 text-center">
                <div className="flex -space-x-4 mb-6">
                    <div className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center border-4 border-[#050505] z-10">
                        <Youtube className="text-white" size={32} />
                    </div>
                    <div className="w-16 h-16 rounded-full bg-blue-700 flex items-center justify-center border-4 border-[#050505]">
                        <FileText className="text-white" size={32} />
                    </div>
                </div>
                <h3 className="text-xl font-bold mb-2">Universal Import</h3>
                <p className="text-slate-400 text-sm">We handle the heavy lifting.</p>
            </div>
        </div>
      ),
    },
    {
      title: "Ultra-Fast AI Chat",
      description:
        "Powered by Groq LPU™, chat with your documents in milliseconds. It reads the documents and watches the videos for you, ready to answer any question or clarify complex topics instantly.",
      content: (
        <div className="h-full w-full bg-[#050505] flex items-center justify-center text-white rounded-md border border-white/10 overflow-hidden relative">
            <div className="absolute inset-0 bg-grid-white/[0.02]"></div>
            <div className="w-3/4 bg-[#0a0a0a] border border-white/10 rounded-xl p-4 shadow-2xl z-10">
                <div className="flex items-center mb-4 border-b border-white/5 pb-2">
                    <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <div className="space-y-3">
                    <div className="bg-primary/20 p-3 rounded-lg rounded-tr-none text-xs text-white self-end ml-8">
                        Summarize the key points of this lecture.
                    </div>
                    <div className="bg-white/10 p-3 rounded-lg rounded-tl-none text-xs text-slate-300 mr-8">
                        Here are the 3 main takeaways: 1. The concept of modularity...
                    </div>
                </div>
            </div>
        </div>
      ),
    },
    {
      title: "Active Recall Generation",
      description:
        "Don't just read—practice. StudySync automatically generates multiple-choice quizzes and flashcards from your content to ensure long-term retention.",
      content: (
        <div className="h-full w-full bg-[#050505] flex items-center justify-center text-white rounded-md border border-white/10 overflow-hidden relative">
           <div className="absolute inset-0 bg-grid-white/[0.02]"></div>
           <div className="grid grid-cols-2 gap-4 z-10">
              <div className="w-32 h-40 bg-[#0a0a0a] border border-white/10 rounded-lg flex flex-col items-center justify-center p-4 shadow-lg transform -rotate-6">
                  <BrainCircuit className="text-secondary mb-2" />
                  <div className="w-full h-2 bg-white/10 rounded mb-1"></div>
                  <div className="w-2/3 h-2 bg-white/10 rounded"></div>
              </div>
              <div className="w-32 h-40 bg-[#0a0a0a] border border-primary/30 rounded-lg flex flex-col items-center justify-center p-4 shadow-lg transform rotate-6">
                  <Trophy className="text-primary mb-2" />
                  <div className="text-2xl font-bold">A+</div>
              </div>
           </div>
        </div>
      ),
    },
  ];

  const carouselItems = [
    {
      category: "Computer Science",
      title: "Advanced Algorithms",
      src: "https://images.unsplash.com/photo-1516116216624-53e697fedbea?q=80&w=2128&auto=format&fit=crop",
      content: <div className="p-4 text-slate-300">A comprehensive smart course generated from top MIT lectures.</div>,
    },
    {
      category: "Physics",
      title: "Quantum Mechanics",
      src: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=3270&auto=format&fit=crop",
      content: <div className="p-4 text-slate-300">Detailed analysis of the quantum realm.</div>,
    },
    {
      category: "History",
      title: "The Roman Empire",
      src: "https://images.unsplash.com/photo-1564507592333-c60657eea523?q=80&w=3271&auto=format&fit=crop",
      content: <div className="p-4 text-slate-300">Interactive timeline extracted from 10 hours of documentaries.</div>,
    },
    {
      category: "Neuroscience",
      title: "Brain Plasticity",
      src: "https://images.unsplash.com/photo-1559757175-5700dde675bc?q=80&w=3270&auto=format&fit=crop",
      content: <div className="p-4 text-slate-300">Flashcards generated from Stanford Huberman Lab.</div>,
    },
    {
      category: "Art History",
      title: "Renaissance Art",
      src: "https://images.unsplash.com/photo-1577083552431-6e5fd01aa342?q=80&w=3000&auto=format&fit=crop",
      content: <div className="p-4 text-slate-300">Visual quiz generated from museum archives.</div>,
    },
  ];

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden font-sans selection:bg-primary/30 relative z-0">
      
      {/* TOP NAV */}
      <nav className="fixed top-0 left-0 w-full z-50 px-4 md:px-8 py-4 flex justify-between items-center bg-black/50 backdrop-blur-xl border-b border-white/5 transition-all duration-300">
         <div className="flex items-center gap-2 cursor-pointer group" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:border-primary/50 transition-colors">
                <Cpu size={20} className="text-white group-hover:text-primary transition-colors" />
            </div>
            <span className="font-bold text-lg tracking-tight hidden sm:block text-white group-hover:text-slate-200 transition-colors">StudySync</span>
         </div>

         <div className="flex items-center gap-3 md:gap-6">
             {/* Nav Links */}
             <div className="flex items-center gap-1 md:gap-4">
                <button onClick={scrollToFeatures} className="px-3 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors flex items-center gap-2">
                   <Layers size={16} className="hidden md:block" /> Features
                </button>
                <button onClick={scrollToFooter} className="px-3 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors flex items-center gap-2">
                   <Info size={16} className="hidden md:block" /> About
                </button>
             </div>
             
             {/* Auth Buttons */}
             <div className="flex items-center gap-3">
                <button 
                  onClick={onGetStarted}
                  className="hidden sm:block px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
                >
                    Sign In
                </button>
                 <button 
                  onClick={onGetStarted}
                  className="px-5 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-full text-xs font-bold transition-all shadow-[0_0_20px_rgba(29,78,216,0.3)] hover:shadow-[0_0_30px_rgba(29,78,216,0.5)] hover:scale-105 active:scale-95 flex items-center"
                >
                    Dashboard <ArrowRight size={14} className="ml-1" />
                </button>
             </div>
         </div>
      </nav>

      {/* PARTICLES BACKGROUND FOR ENTIRE PAGE */}
      <div className="fixed top-0 left-0 w-full h-full -z-10 overflow-hidden pointer-events-none">
        <Particles
          className="absolute inset-0"
          quantity={150}
          ease={80}
          color="#ffffff"
          refresh
        />
      </div>

      {/* HERO SECTION */}
      <div className="relative flex flex-col items-center justify-center overflow-hidden pt-32 pb-20 md:pt-40 md:pb-28 min-h-screen">
        {/* Animated Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
           <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[60%] h-[50%] bg-primary/10 rounded-full blur-[120px] animate-pulse-slow"></div>
           <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
        </div>

        <div className="z-10 text-center px-4 w-full max-w-[90%] mx-auto relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-8 flex justify-center"
          >
            <span className="px-4 py-1.5 rounded-full border border-white/10 bg-white/5 text-xs font-medium text-slate-300 backdrop-blur-sm shadow-[0_0_15px_rgba(255,255,255,0.05)] flex items-center">
              <Sparkles size={12} className="mr-2 text-primary" />
              Powered by Groq Llama 3
            </span>
          </motion.div>
          
          <h1 className="text-3xl md:text-5xl lg:text-6xl laptop:text-7xl xl:text-8xl font-bold tracking-tight mb-8 text-white leading-tight">
            Study smarter <br /> with <ColourfulText text="StudySync AI" />
          </h1>
          
          <div className="max-w-3xl mx-auto mb-12">
              <TextGenerateEffect words="The all-in-one AI study assistant. Turn YouTube videos and PDFs into interactive courses, flashcards, and quizzes in seconds." className="text-base md:text-lg laptop:text-xl text-slate-400 font-normal leading-relaxed" />
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-20"
          >
            <button
              onClick={onGetStarted}
              className="px-6 py-3 md:px-8 md:py-4 bg-white text-black rounded-full font-bold text-sm md:text-base laptop:text-lg hover:scale-105 transition-transform flex items-center shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] group"
            >
              Get Started <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={scrollToFeatures}
              className="px-6 py-3 md:px-8 md:py-4 bg-[#050505] border border-white/10 text-white rounded-full font-bold text-sm md:text-base laptop:text-lg hover:bg-white/5 transition-colors flex items-center"
            >
              <PlayCircle className="mr-2" /> Watch Demo
            </button>
          </motion.div>
        </div>
      </div>

      {/* FEATURE SHOWCASE (Wobble Cards) */}
      <section ref={featuresRef} className="py-20 bg-[#050505] relative z-20">
        <div className="max-w-7xl mx-auto px-4">
           <div className="text-center mb-20">
              <h2 className="text-2xl md:text-3xl laptop:text-4xl font-bold text-white mb-6">Experience Real-time Intelligence</h2>
              <p className="text-slate-400 max-w-2xl mx-auto text-base md:text-lg">Unlock your full potential with a suite of tools designed to adapt to your unique learning style.</p>
           </div>
           
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto w-full">
              
              {/* Card 1: Dashboard Stats */}
              <WobbleCard
                containerClassName="col-span-1 lg:col-span-2 h-full bg-blue-900 min-h-[500px] lg:min-h-[300px]"
                className="p-8"
              >
                <div className="max-w-md relative z-10">
                  <h2 className="text-left text-balance text-xl md:text-2xl lg:text-3xl laptop:text-4xl font-bold tracking-[-0.015em] text-white">
                    Track Your Progress in Real-Time
                  </h2>
                  <p className="mt-4 text-left text-sm md:text-base laptop:text-lg text-blue-100">
                    Visualize your learning journey with detailed analytics. Monitor streaks, XP gains, and topic mastery as you study.
                  </p>
                </div>
                <img
                  src="/dashboard.png"
                  width={500}
                  height={500}
                  alt="dashboard demo"
                  className="absolute -right-4 lg:-right-[20%] grayscale filter -bottom-10 object-contain rounded-2xl opacity-60 hover:grayscale-0 transition-all duration-500"
                />
              </WobbleCard>

              {/* Card 2: Focus Mode */}
              <WobbleCard containerClassName="col-span-1 min-h-[300px] bg-zinc-900">
                <div className="max-w-xs">
                    <h2 className="text-left text-balance text-xl md:text-2xl laptop:text-3xl font-bold tracking-[-0.015em] text-white">
                      Deep Focus Mode
                    </h2>
                    <p className="mt-4 text-left text-sm md:text-base laptop:text-lg text-slate-300">
                      Eliminate distractions with our built-in pomodoro timer. Stay in the zone and maximize retention.
                    </p>
                </div>
                <div className="absolute -right-10 -bottom-10 text-slate-700 opacity-30 rotate-12">
                    <BrainCircuit size={180} />
                </div>
              </WobbleCard>

              {/* Card 3: Course Generation */}
              <WobbleCard containerClassName="col-span-1 lg:col-span-3 bg-indigo-950 min-h-[500px] lg:min-h-[600px] xl:min-h-[300px]">
                <div className="max-w-lg relative z-10">
                  <h2 className="text-left text-balance text-xl md:text-2xl lg:text-3xl laptop:text-4xl font-bold tracking-[-0.015em] text-white">
                    Generative AI Course Creator
                  </h2>
                  <p className="mt-4 text-left text-sm md:text-base laptop:text-lg text-indigo-100 max-w-[30rem]">
                    Just paste a YouTube link or topic. Our Groq-powered engine builds a comprehensive curriculum with quizzes, notes, and interactive chat instantly.
                  </p>
                </div>
                <img
                  src="/roadmap.png"
                  width={500}
                  height={500}
                  alt="roadmap demo"
                  className="absolute -right-10 md:-right-[40%] lg:-right-[10%] -bottom-10 object-contain rounded-2xl opacity-60 hover:opacity-90 transition-opacity duration-50"
                />
              </WobbleCard>
           </div>
        </div>
      </section>

      {/* FEATURES CARDS (3D & EVERVAULT CARDS) */}
      <section className="py-24 px-4 bg-black relative z-10 border-t border-white/5">
        <div className="w-full max-w-[95%] mx-auto">
           <div className="text-center mb-16">
               <h2 className="text-2xl md:text-3xl laptop:text-4xl font-bold text-white mb-4">Supercharge your study sessions</h2>
               <p className="text-slate-400 max-w-2xl mx-auto text-base md:text-lg">Everything you need to master any topic, powered by the latest in generative AI.</p>
           </div>
          
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
              
              {/* 1. Flashcards (3D Card) */}
              <div className="w-full h-[35rem]">
                <CardContainer containerClassName="py-0 h-full w-full" className="h-full w-full">
                  <CardBody className="bg-[#050505] relative group/card border-white/10 w-full h-full rounded-xl p-6 border hover:shadow-2xl hover:shadow-primary/[0.1] flex flex-col justify-between">
                    <div>
                      <CardItem
                        translateZ="50"
                        className="text-xl font-bold text-white"
                      >
                        Instant Flashcards
                      </CardItem>
                      <CardItem
                        as="p"
                        translateZ="60"
                        className="text-slate-400 text-sm max-w-sm mt-2"
                      >
                        Turn any YouTube video or PDF into a spaced-repetition deck instantly. Master concepts faster.
                      </CardItem>
                    </div>
                    <CardItem translateZ="100" className="w-full mt-4 flex-1 min-h-0 relative overflow-hidden rounded-xl">
                      <img
                        src="/flashcard.png"
                        className="absolute inset-0 w-full h-full object-cover group-hover/card:scale-110 transition-transform duration-500"
                        alt="flashcards thumbnail"
                      />
                    </CardItem>
                    <div className="flex justify-between items-center mt-6">
                      <CardItem
                        translateZ={20}
                        as="button"
                        className="px-4 py-2 rounded-xl text-xs font-normal text-white hover:text-primary transition-colors"
                      >
                        See how it works →
                      </CardItem>
                      <CardItem
                        translateZ={20}
                        as="button"
                        onClick={onGetStarted}
                        className="px-4 py-2 rounded-xl bg-white text-black text-xs font-bold hover:bg-slate-200 transition-colors"
                      >
                        Generate Deck
                      </CardItem>
                    </div>
                  </CardBody>
                </CardContainer>
              </div>

              {/* 2. Context (Evervault Card) */}
              <div className="w-full h-[35rem]">
                 <div className="border border-white/10 bg-[#050505] flex flex-col items-start w-full mx-auto p-4 relative h-full rounded-xl overflow-hidden hover:border-white/20 transition-colors">
                    <Icon className="absolute h-6 w-6 -top-3 -left-3 text-white" />
                    <Icon className="absolute h-6 w-6 -bottom-3 -left-3 text-white" />
                    <Icon className="absolute h-6 w-6 -top-3 -right-3 text-white" />
                    <Icon className="absolute h-6 w-6 -bottom-3 -right-3 text-white" />

                    <div className="w-full flex-1 min-h-0">
                        <EvervaultCard text="Llama 3" />
                    </div>

                    <div className="relative z-20 mt-4">
                      <h2 className="text-white text-sm font-light">
                        Analyze entire textbooks, long lecture videos, and complex research papers without losing context.
                      </h2>
                      <p className="text-sm border font-light border-white/20 rounded-full mt-4 text-white px-2 py-0.5 w-fit bg-black/50 backdrop-blur-md">
                        Infinite Context Window
                      </p>
                    </div>
                 </div>
              </div>

              {/* 3. Gamified Mastery (Evervault Card) */}
              <div className="w-full h-[35rem]">
                 <div className="border border-white/10 bg-[#050505] flex flex-col items-start w-full mx-auto p-4 relative h-full rounded-xl overflow-hidden hover:border-white/20 transition-colors">
                    <Icon className="absolute h-6 w-6 -top-3 -left-3 text-white" />
                    <Icon className="absolute h-6 w-6 -bottom-3 -left-3 text-white" />
                    <Icon className="absolute h-6 w-6 -top-3 -right-3 text-white" />
                    <Icon className="absolute h-6 w-6 -bottom-3 -right-3 text-white" />

                    <div className="w-full flex-1 min-h-0">
                        <EvervaultCard text="LEVEL UP" />
                    </div>

                    <div className="relative z-20 mt-4">
                      <h2 className="text-white text-sm font-light">
                        Make studying addictive. Earn XP, maintain daily streaks, and unlock achievements as you master new topics.
                      </h2>
                      <div className="flex gap-2 mt-4">
                        <p className="text-sm border font-light border-yellow-500/30 text-yellow-500 rounded-full px-2 py-0.5 w-fit bg-yellow-500/10 backdrop-blur-md">
                          Leaderboards
                        </p>
                        <p className="text-sm border font-light border-purple-500/30 text-purple-400 rounded-full px-2 py-0.5 w-fit bg-purple-500/10 backdrop-blur-md">
                          Achievements
                        </p>
                      </div>
                    </div>
                 </div>
              </div>

              {/* 4. Smart Roadmaps (3D Card) */}
              <div className="w-full h-[35rem]">
                <CardContainer containerClassName="py-0 h-full w-full" className="h-full w-full">
                  <CardBody className="bg-[#050505] relative group/card border-white/10 w-full h-full rounded-xl p-6 border hover:shadow-2xl hover:shadow-blue-600/[0.1] flex flex-col justify-between">
                    <div>
                      <CardItem
                        translateZ="50"
                        className="text-xl font-bold text-white"
                      >
                        Smart Roadmaps
                      </CardItem>
                      <CardItem
                        as="p"
                        translateZ="60"
                        className="text-slate-400 text-sm max-w-sm mt-2"
                      >
                        From zero to hero. We generate structured, step-by-step learning paths customized to your pace.
                      </CardItem>
                    </div>
                    <CardItem translateZ="100" className="w-full mt-4 flex-1 min-h-0 relative overflow-hidden rounded-xl">
                       <img
                        src="/roadmap.png"
                        className="absolute inset-0 w-full h-full object-cover group-hover/card:scale-110 transition-transform duration-500 grayscale group-hover/card:grayscale-0"
                        alt="roadmap thumbnail"
                      />
                       <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-4">
                          <div className="flex gap-2">
                             <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                             <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                             <div className="w-2 h-2 rounded-full bg-white/20"></div>
                          </div>
                       </div>
                    </CardItem>
                    <div className="flex justify-between items-center mt-6">
                      <CardItem
                        translateZ={20}
                        as="button"
                        className="px-4 py-2 rounded-xl text-xs font-normal text-white hover:text-blue-400 transition-colors"
                      >
                        View Sample →
                      </CardItem>
                      <CardItem
                        translateZ={20}
                        as="button"
                        onClick={onGetStarted}
                        className="px-4 py-2 rounded-xl bg-blue-700 text-white text-xs font-bold hover:bg-blue-600 transition-colors"
                      >
                        Create Map
                      </CardItem>
                    </div>
                  </CardBody>
                </CardContainer>
              </div>

           </div>

        </div>
      </section>

      {/* HOW IT WORKS (Sticky Scroll) */}
      <section className="py-20 bg-[#030303] border-t border-white/5">
         <h2 className="text-2xl md:text-3xl laptop:text-4xl font-bold text-center mb-16 text-white">How it works</h2>
         <div className="w-full max-w-[95%] mx-auto px-4">
           <StickyScroll content={stickyContent} />
         </div>
      </section>

      {/* ROADMAP EXAMPLES (Apple Carousel) */}
      <section className="py-24 bg-black border-t border-white/5 overflow-hidden">
         <div className="w-full max-w-[95%] mx-auto px-4 mb-10">
            <h2 className="text-2xl md:text-3xl laptop:text-4xl font-bold text-white mb-4">Explore AI Smart Courses</h2>
            <p className="text-slate-400 max-w-2xl">
                See what others are learning. From quantum physics to art history, StudySync generates structured paths for everything.
            </p>
         </div>
         <div className="w-full">
            <Carousel items={carouselItems.map((item, index) => (
              <Card key={index} card={item} index={index} />
            ))} />
         </div>
      </section>

      {/* REDESIGNED FOOTER */}
      <footer ref={footerRef} className="bg-[#020202] border-t border-white/5 pt-24 pb-12 relative overflow-hidden">
         <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
            <div className="absolute -top-[200px] -right-[200px] w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px]"></div>
            <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-blue-800/5 rounded-full blur-[80px]"></div>
         </div>

         <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-20">
               
               {/* Brand Info (Left) */}
               <div className="col-span-1 md:col-span-5">
                  <div className="flex items-center gap-2 mb-6">
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                          <Cpu className="text-white w-6 h-6" />
                      </div>
                      <span className="font-bold text-xl md:text-2xl laptop:text-2xl tracking-tight text-white">StudySync AI</span>
                  </div>
                  <p className="text-sm md:text-base text-slate-400 leading-relaxed mb-8 max-w-sm">
                     StudySync AI is an open-source, intelligent study assistant designed to revolutionize how you learn. 
                     Turn content into knowledge with the power of Groq AI.
                  </p>
                  
                  <div className="flex gap-4">
                      <a href="https://github.com/abhayclasher" target="_blank" rel="noreferrer" className="p-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 text-slate-400 hover:text-white transition-all group">
                          <Github size={18} className="group-hover:scale-110 transition-transform" />
                      </a>
                      <a href="https://linkedin.com/in/abhayclasher" target="_blank" rel="noreferrer" className="p-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 text-slate-400 hover:text-blue-400 transition-all group">
                          <Linkedin size={18} className="group-hover:scale-110 transition-transform" />
                      </a>
                      <a href="https://instagram.com/abhay_clasher" target="_blank" rel="noreferrer" className="p-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 text-slate-400 hover:text-pink-500 transition-all group">
                          <Instagram size={18} className="group-hover:scale-110 transition-transform" />
                      </a>
                  </div>
               </div>

               {/* Links (Right) */}
               <div className="col-span-1 md:col-span-7 flex flex-col md:flex-row md:justify-end gap-12 md:gap-24">
                  <div>
                     <h4 className="text-white font-bold mb-6">Product</h4>
                     <ul className="space-y-4 text-slate-400 text-sm">
                        <li><button onClick={onGetStarted} className="hover:text-white transition-colors">Sign In</button></li>
                        <li><button onClick={onGetStarted} className="hover:text-white transition-colors">Dashboard</button></li>
                        <li><button onClick={scrollToFeatures} className="hover:text-white transition-colors">Features</button></li>
                     </ul>
                  </div>
                  <div>
                     <h4 className="text-white font-bold mb-6">Project</h4>
                     <ul className="space-y-4 text-slate-400 text-sm">
                        <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                        <li><a href="#" className="hover:text-white transition-colors">GitHub Repo</a></li>
                        <li><a href="#" className="hover:text-white transition-colors">Contributing</a></li>
                     </ul>
                  </div>
               </div>
            </div>

            {/* Bottom Bar */}
            <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500">
               <div className="flex items-center">
                  <span>© 2025 StudySync AI. All rights reserved.</span>
               </div>
               <div className="flex items-center gap-1">
                  <span>Made with</span>
                  <Heart size={12} className="text-red-500 fill-red-500 mx-1" />
                  <span>by Abhay Clasher</span>
               </div>
            </div>
         </div>
      </footer>
    </div>
  );
};

export default LandingPage;