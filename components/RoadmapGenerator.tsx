
import React, { useState, useEffect } from 'react';
import { generateRoadmap } from '../services/geminiService';
import { saveRoadmap, getRoadmaps, deleteRoadmap } from '../services/db';
import { RoadmapStep, RoadmapCourse } from '../types';
import {
  Play, ArrowRight, Youtube, Loader2, ListVideo, Plus, Library, ChevronLeft, Trash2, GraduationCap, Sparkles, Map, Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { handleThumbnailError, getYouTubeThumbnailUrl } from '../lib/youtubeUtils';
import DeleteConfirmationModal from './DeleteConfirmationModal';

interface RoadmapGeneratorProps {
  onStartVideo: (videoStep: RoadmapStep, courseId: string) => void;
  onPlaylistAdded?: (title: string) => void;
}

const RoadmapGenerator: React.FC<RoadmapGeneratorProps> = ({ onStartVideo, onPlaylistAdded }) => {
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState<RoadmapCourse[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<RoadmapCourse | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<string | null>(null);

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
        // If input is a URL (YouTube or otherwise), use the generated title
        if (inputValue.includes('http') || inputValue.includes('youtube') || inputValue.includes('youtu.be')) {
          topic = steps[0]?.title || "YouTube Course";
        }

        await saveRoadmap(steps, topic);
        if (onPlaylistAdded) onPlaylistAdded(topic);
        await loadCourses();
        setInputValue('');
      }
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setCourseToDelete(id);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!courseToDelete) return;
    const id = courseToDelete;

    // Optimistically update the UI before making the API call
    setCourses(prevCourses => {
      const updatedCourses = prevCourses.filter(course => course.id !== id);
      return updatedCourses;
    });

    if (selectedCourse?.id === id) {
      setSelectedCourse(null);
    }

    try {
      const success = await deleteRoadmap(id);
      if (!success) {
        await loadCourses(); // Reload to get the correct state from storage
        alert('Failed to delete roadmap. Please try again.');
      }
    } catch (error) {
      console.error('Failed to delete roadmap:', error);
      await loadCourses();
      alert('An error occurred while deleting the roadmap. The course has been restored.');
    }
  };

  if (selectedCourse) {
    return (
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="pb-20">
        {/* Sticky Header */}
        <div className="flex items-center mb-6 sticky top-0 bg-black/80 backdrop-blur-xl z-30 py-4 border-b border-white/5 px-4 -mx-4 md:px-0 md:mx-0">
          <button
            onClick={() => setSelectedCourse(null)}
            className="mr-4 p-2 bg-white/5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg md:text-xl font-bold text-white truncate">{selectedCourse.topic}</h2>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>{selectedCourse.steps.length} Modules</span>
              <span className="w-1 h-1 rounded-full bg-slate-600"></span>
              <span>{selectedCourse.progress}% Complete</span>
            </div>
          </div>
        </div>

        {/* Progress Card */}
        <div className="bg-gradient-to-br from-blue-950/30 to-blue-900/20 border border-white/10 rounded-2xl p-6 mb-8 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-700/5 to-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

          <div className="flex items-center gap-5 relative z-10 w-full md:w-auto">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-700/20 to-blue-600/20 flex items-center justify-center border border-white/5 shadow-[0_0_15px_rgba(29,78,216,0.2)]">
              <GraduationCap className="text-blue-500 w-8 h-8" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Course Progress</p>
              <div className="flex items-baseline gap-2">
                <h3 className="text-4xl font-bold text-white tracking-tight">{selectedCourse.progress}%</h3>
                <span className="text-sm text-slate-500">completed</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              const nextStep = selectedCourse.steps.find(s => s.status !== 'completed') || selectedCourse.steps[0];
              onStartVideo(nextStep, selectedCourse.id);
            }}
            className="w-full md:w-auto px-8 py-4 bg-white text-black font-bold rounded-xl hover:bg-slate-200 flex items-center justify-center transition-all shadow-lg shadow-white/5 hover:scale-105 active:scale-95 relative z-10"
          >
            <Play className="w-5 h-5 mr-2 fill-current" />
            {selectedCourse.progress === 100 ? 'Restart Course' : 'Continue Learning'}
          </button>
        </div>

        {/* Module List */}
        <div className="space-y-4">
          {selectedCourse.steps.map((step, index) => (
            <div
              key={step.id}
              className="bg-[#0a0a0a] border border-white/5 rounded-2xl flex flex-col md:flex-row overflow-hidden hover:border-white/10 transition-all group relative"
            >
              <div
                className="w-full md:w-64 h-48 md:h-auto flex-shrink-0 relative cursor-pointer overflow-hidden bg-black"
                onClick={() => onStartVideo(step, selectedCourse.id)}
              >
                {step.thumbnail ? (
                  <img
                    src={step.thumbnail.replace('/mqdefault.jpg', '/maxresdefault.jpg').replace('/hqdefault.jpg', '/maxresdefault.jpg')}
                    alt={step.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-80 group-hover:opacity-100"
                    onError={(e) => handleThumbnailError(e, step.videoUrl || '', step.title)}
                  />
                ) : (
                  <div className="w-full h-full bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                    <ListVideo className="text-slate-500" size={32} />
                  </div>
                )}

                {/* Overlays */}
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors"></div>
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-90 group-hover:scale-100">
                  <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-xl">
                    <Play className="text-white fill-white ml-1" size={20} />
                  </div>
                </div>

                {/* Status Badges */}
                <div className="absolute top-3 left-3 flex flex-col gap-2">
                  {(step.isLive || step.isUpcoming) && (
                    <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider shadow-lg backdrop-blur-md ${step.isLive
                      ? 'bg-red-600/90 text-white animate-pulse'
                      : 'bg-yellow-500/90 text-black'
                      }`}>
                      {step.isLive ? '🔴 Live' : '⏰ Upcoming'}
                    </span>
                  )}
                </div>

                <div className="absolute bottom-3 right-3">
                  <span className="px-2 py-1 rounded-md text-[10px] font-bold bg-black/60 text-white backdrop-blur-md border border-white/10">
                    {step.duration}
                  </span>
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-center">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-400 bg-white/5 px-2 py-1 rounded border border-white/5">MODULE {index + 1}</span>
                    {step.status === 'completed' && (
                      <span className="text-[10px] font-bold text-green-400 bg-green-400/10 px-2 py-1 rounded border border-green-400/20 flex items-center gap-1">
                        <Sparkles size={10} /> COMPLETED
                      </span>
                    )}
                  </div>
                </div>

                <h3 className="font-bold text-lg text-white mb-2 group-hover:text-blue-500 transition-colors line-clamp-2 leading-tight">
                  {step.title}
                </h3>
                <p className="text-sm text-slate-400 mb-4 line-clamp-2 leading-relaxed">
                  {step.description}
                </p>

                <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
                  <button
                    onClick={() => onStartVideo(step, selectedCourse.id)}
                    className={`text-xs font-bold px-4 py-2 rounded-lg flex items-center transition-all ${step.isLive ? 'bg-red-600 text-white hover:bg-red-500 shadow-lg shadow-red-900/20' :
                      step.isUpcoming ? 'bg-yellow-600 text-black hover:bg-yellow-500' :
                        'bg-white text-black hover:bg-slate-200 shadow-lg shadow-white/5'
                      }`}
                  >
                    {step.isLive ? 'Watch Live' : step.isUpcoming ? 'Notify Me' : 'Start Lesson'}
                    <ArrowRight size={14} className="ml-1.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-8 md:space-y-12 pb-20 max-w-7xl mx-auto">
      {/* Create Section */}
      <div className="relative rounded-[2rem] p-1 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-800/20 via-blue-700/10 to-transparent opacity-50"></div>
        <div className="bg-[#0a0a0a] border border-white/10 rounded-[1.8rem] p-6 md:p-10 relative z-10 overflow-hidden">
          <div className="absolute top-0 right-0 p-10 opacity-10 pointer-events-none">
            <Map size={200} className="text-white" />
          </div>

          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-blue-400 mb-4">
              <Sparkles size={12} />
              <span>AI-Powered Learning</span>
            </div>
            <h2 className="text-2xl md:text-4xl font-bold text-white mb-4 tracking-tight">
              Create Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-blue-700">Smart Course</span>
            </h2>
            <p className="text-slate-400 mb-8 text-sm md:text-base leading-relaxed">
              Turn any topic or YouTube playlist into a structured learning roadmap.
              Track your progress and master new skills efficiently.
            </p>

            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1 group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-700/20 to-blue-600/20 rounded-xl blur opacity-0 group-focus-within:opacity-100 transition-opacity duration-500"></div>
                <div className="relative flex items-center bg-black border border-white/10 rounded-xl focus-within:border-white/20 transition-colors">
                  <Search className="ml-4 text-slate-500" size={18} />
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Paste YouTube URL or enter a topic..."
                    className="w-full bg-transparent px-4 py-4 text-white outline-none placeholder:text-slate-600"
                  />
                </div>
              </div>
              <button
                onClick={handleGenerate}
                disabled={loading || !inputValue}
                className="bg-gradient-to-r from-blue-700 to-blue-800 hover:from-blue-600 hover:to-blue-700 text-white px-8 py-4 rounded-xl font-bold flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-900/30 hover:scale-[1.02] active:scale-[0.98]"
              >
                {loading ? <Loader2 className="animate-spin" /> : <Library className="mr-2 w-5 h-5" />}
                Generate Course
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Course Grid */}
      <div>
        <div className="flex items-center justify-between mb-6 px-2">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Library className="text-blue-500" size={20} /> My Courses
          </h3>
          <span className="text-xs font-bold text-slate-500 bg-white/5 px-3 py-1 rounded-full">{courses.length} Active</span>
        </div>

        {courses.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-white/10 rounded-3xl bg-white/5">
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
              <Map className="text-slate-600" size={32} />
            </div>
            <h4 className="text-lg font-bold text-white mb-2">No courses yet</h4>
            <p className="text-slate-500 text-sm max-w-xs mx-auto">Generate your first course above to start your learning journey.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <motion.div
                layout
                key={course.id}
                onClick={() => setSelectedCourse(course)}
                className="group bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden hover:border-blue-700/40 cursor-pointer transition-all hover:shadow-[0_0_30px_rgba(29,78,216,0.15)] hover:-translate-y-1"
              >
                <div className="h-48 bg-white/5 relative overflow-hidden">
                  {course.thumbnail || course.steps[0]?.thumbnail ? (
                    <img
                      src={(course.thumbnail || course.steps[0]?.thumbnail || '').replace('/mqdefault.jpg', '/maxresdefault.jpg').replace('/hqdefault.jpg', '/maxresdefault.jpg')}
                      alt={course.topic}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      onError={(e) => handleThumbnailError(e, course.steps[0]?.videoUrl || '', course.topic)}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
                      <ListVideo className="text-white/10" size={48} />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent opacity-80" />

                  <div className="absolute bottom-4 left-4 right-4 z-20">
                    <div className="flex justify-between items-end">
                      <span className="text-[10px] font-bold bg-blue-700/90 text-white px-2 py-1 rounded backdrop-blur-md shadow-lg mb-2 inline-block">
                        {course.steps.length} MODULES
                      </span>
                    </div>
                    <h4 className="font-bold text-lg text-white line-clamp-1 group-hover:text-blue-500 transition-colors leading-tight drop-shadow-md">
                      {course.topic}
                    </h4>
                  </div>
                </div>

                <div className="p-5">
                  <div className="flex justify-between items-center text-xs text-slate-400 mb-3 font-medium">
                    <span>Progress</span>
                    <span className={course.progress === 100 ? 'text-green-400' : 'text-white'}>{course.progress}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden mb-4">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ${course.progress === 100 ? 'bg-green-500' : 'bg-gradient-to-r from-blue-700 to-blue-800'}`}
                      style={{ width: `${course.progress}%` }}
                    ></div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-white/5">
                    <span className="text-[10px] text-slate-500">Last updated today</span>
                    <button
                      onClick={(e) => handleDelete(e, course.id)}
                      className="text-slate-500 hover:text-red-400 transition-colors p-1.5 hover:bg-red-500/10 rounded-lg group/trash"
                      title="Delete Course"
                    >
                      <Trash2 size={14} className="group-hover/trash:scale-110 transition-transform" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        itemName={courses.find(c => c.id === courseToDelete)?.topic}
      />
    </div>
  );
};

export default RoadmapGenerator;
