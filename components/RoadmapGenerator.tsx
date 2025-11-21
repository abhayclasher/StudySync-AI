
import React, { useState, useEffect } from 'react';
import { generateRoadmap } from '../services/geminiService';
import { saveRoadmap, getRoadmaps } from '../services/db';
import { RoadmapStep, RoadmapCourse } from '../types';
import {
  Play, ArrowRight, Youtube, Loader2, ListVideo, Plus, Library, ChevronLeft, Trash2, GraduationCap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface RoadmapGeneratorProps {
  onStartVideo: (videoStep: RoadmapStep, courseId: string) => void;
  onPlaylistAdded?: (title: string) => void;
}

const RoadmapGenerator: React.FC<RoadmapGeneratorProps> = ({ onStartVideo, onPlaylistAdded }) => {
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState<RoadmapCourse[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<RoadmapCourse | null>(null);

  useEffect(() => { loadCourses(); }, []);

  const loadCourses = async () => {
    const saved = await getRoadmaps();
    setCourses(saved);
  };

  const handleGenerate = async () => {
    if (!inputValue) return;
    setLoading(true);
    try {
      const steps = await generateRoadmap(inputValue);
      if (steps.length > 0) {
        let topic = inputValue;
        if (inputValue.includes('youtube')) topic = steps[0]?.title || "YouTube Course";

        await saveRoadmap(steps, topic);
        if (onPlaylistAdded) onPlaylistAdded(topic);
        await loadCourses();
        setInputValue('');
      }
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      const { deleteRoadmap } = await import('../services/db');
      const success = await deleteRoadmap(id);
      if (success) {
        // Reload courses from database
        await loadCourses();
        if (selectedCourse?.id === id) setSelectedCourse(null);
      }
    } catch (error) {
      console.error('Failed to delete roadmap:', error);
    }
  };

  if (selectedCourse) {
    return (
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="pb-20">
        <div className="flex items-center mb-6 sticky top-0 bg-black/90 z-20 py-4 border-b border-white/5">
          <button onClick={() => setSelectedCourse(null)} className="mr-4 p-2 bg-white/5 rounded-full hover:bg-white/10"><ChevronLeft className="w-5 h-5 text-slate-400" /></button>
          <div>
            <h2 className="text-lg md:text-xl font-bold text-white truncate max-w-[200px] md:max-w-md">{selectedCourse.topic}</h2>
            <p className="text-xs text-slate-400">{selectedCourse.steps.length} Modules • {selectedCourse.progress}% Complete</p>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-white/10 rounded-2xl p-6 mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center"><GraduationCap className="text-purple-400" /></div>
            <div>
              <p className="text-sm font-bold text-slate-300">Course Progress</p>
              <h3 className="text-3xl font-bold text-white">{selectedCourse.progress}%</h3>
            </div>
          </div>
          <button
            onClick={() => {
              const nextStep = selectedCourse.steps.find(s => s.status !== 'completed') || selectedCourse.steps[0];
              onStartVideo(nextStep, selectedCourse.id);
            }}
            className="w-full md:w-auto px-6 py-3 bg-white text-black font-bold rounded-xl hover:bg-slate-200 flex items-center justify-center"
          >
            <Play className="w-4 h-4 mr-2" /> {selectedCourse.progress === 100 ? 'Restart' : 'Resume'}
          </button>
        </div>

        <div className="space-y-4">
          {selectedCourse.steps.map((step, index) => (
            <div key={step.id} className="bg-[#050505] border border-white/5 rounded-xl flex flex-col md:flex-row overflow-hidden hover:border-primary/30 transition-colors group">
              <div className="w-full md:w-48 h-32 md:h-28 flex-shrink-0 relative cursor-pointer overflow-hidden bg-black" onClick={() => onStartVideo(step, selectedCourse.id)}>
                {step.thumbnail ? (
                  <img
                    src={step.thumbnail.replace('/mqdefault.jpg', '/maxresdefault.jpg').replace('/hqdefault.jpg', '/maxresdefault.jpg')}
                    alt={step.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.onerror = null;
                      // Try hqdefault as fallback if maxresdefault fails
                      if (target.src.includes('maxresdefault')) {
                        target.src = target.src.replace('/maxresdefault.jpg', '/hqdefault.jpg');
                      } else {
                        target.src = `https://placehold.co/1280x720/1e1e2e/FFF?text=${encodeURIComponent(step.title.substring(0, 20))}`;
                      }
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-white/5 flex items-center justify-center">
                    <ListVideo className="text-slate-50" size={24} />
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Play className="text-white opacity-80" />
                </div>
              </div>
              <div className="p-4 flex-1">
                <div className="flex justify-between items-start mb-1">
                  <span className="text-[10px] font-bold text-slate-500 bg-white/5 px-2 py-0.5 rounded uppercase">Module {index + 1}</span>
                  {step.status === 'completed' && <span className="text-green-400 text-xs font-bold">Completed</span>}
                </div>
                <h3 className="font-bold text-white mb-1 group-hover:text-primary transition-colors truncate">{step.title}</h3>
                <p className="text-xs text-slate-400 mb-3 line-clamp-2">{step.description}</p>
                <button onClick={() => onStartVideo(step, selectedCourse.id)} className="text-xs font-bold text-white bg-white/10 hover:bg-primary px-4 py-2 rounded-full flex items-center w-fit">Start Lesson <ArrowRight size={12} className="ml-1" /></button>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-8 md:space-y-12 pb-20">
      <div className="bg-[#050505] border border-white/10 rounded-2xl p-6 md:p-10 relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-xl md:text-2xl font-bold text-white mb-3">Create Smart Course</h2>
          <p className="text-slate-400 mb-6 text-sm">Paste a YouTube Playlist URL or Topic to generate.</p>
          <div className="flex flex-col md:flex-row gap-3">
            <input type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)} placeholder="Paste URL or Topic..." className="flex-1 bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary/50 outline-none placeholder:text-slate-500" />
            <button onClick={handleGenerate} disabled={loading || !inputValue} className="bg-white text-black px-6 py-3 rounded-xl font-bold flex items-center justify-center hover:bg-slate-200 disabled:opacity-50">
              {loading ? <Loader2 className="animate-spin" /> : <Library className="mr-2 w-4 h-4" />} Generate
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <motion.div layout key={course.id} onClick={() => setSelectedCourse(course)} className="group bg-[#050505] border border-white/10 rounded-2xl overflow-hidden hover:border-primary/30 cursor-pointer transition-all hover:shadow-lg hover:shadow-primary/10">
            <div className="h-40 bg-white/5 relative overflow-hidden">
              {course.thumbnail || course.steps[0]?.thumbnail ? (
                <img
                  src={(course.thumbnail || course.steps[0]?.thumbnail || '').replace('/mqdefault.jpg', '/maxresdefault.jpg').replace('/hqdefault.jpg', '/maxresdefault.jpg')}
                  alt={course.topic}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    // Try hqdefault as fallback
                    if (target.src.includes('maxresdefault')) {
                      target.src = target.src.replace('/maxresdefault.jpg', '/hqdefault.jpg');
                    } else {
                      target.style.display = 'none';
                      target.parentElement!.classList.add('bg-gradient-to-br', 'from-gray-800', 'to-black');
                    }
                  }}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-gray-800 to-black flex items-center justify-center">
                  <ListVideo className="text-white/20" size={48} />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
              <div className="absolute bottom-3 left-4 z-20"><span className="text-[10px] font-bold bg-primary text-white px-2 py-0.5 rounded uppercase shadow-sm">Course</span></div>
            </div>
            <div className="p-5">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-bold text-white line-clamp-1 group-hover:text-primary transition-colors">{course.topic}</h4>
                <button onClick={(e) => handleDelete(e, course.id)} className="text-slate-500 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
              </div>
              <div className="flex justify-between items-center text-xs text-slate-400 mb-3">
                <span>{course.steps.length} Modules</span>
                <span>{course.progress}%</span>
              </div>
              <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden"><div className="h-full bg-primary transition-all duration-500" style={{ width: `${course.progress}%` }}></div></div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default RoadmapGenerator;
