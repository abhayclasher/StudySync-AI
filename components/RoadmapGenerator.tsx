
import React, { useState, useEffect } from 'react';
import { generateRoadmap } from '../services/geminiService';
import { saveRoadmap, getRoadmaps, deleteRoadmap, updateCourseProgress } from '../services/db';
import { RoadmapStep, RoadmapCourse } from '../types';
import {
  Play, ArrowRight, Youtube, Loader2, ListVideo, Plus, Library, ChevronLeft, Trash2, GraduationCap, Sparkles, Map, Search,
  CheckCircle2, Circle, FileText, Link as LinkIcon, ChevronDown, ChevronUp, Clock, BookOpen
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
  const [expandedStepId, setExpandedStepId] = useState<string | null>(null);

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

  const toggleStepChecklist = async (stepId: string, checkIndex: number) => {
    if (!selectedCourse) return;

    const updatedSteps = selectedCourse.steps.map(step => {
      if (step.id === stepId && step.checklist) {
        const newChecklist = [...step.checklist];
        newChecklist[checkIndex] = {
          ...newChecklist[checkIndex],
          completed: !newChecklist[checkIndex].completed
        };
        return { ...step, checklist: newChecklist };
      }
      return step;
    });

    // Update local state immediately
    const updatedCourse = { ...selectedCourse, steps: updatedSteps };
    setSelectedCourse(updatedCourse);

    // Update courses list
    setCourses(prev => prev.map(c => c.id === selectedCourse.id ? updatedCourse : c));

    // TODO: Persist checklist state to DB (requires DB schema update for deep nested updates or full object replace)
    // For now, we'll just update the course progress if needed, but checklist state might not persist deeply without backend changes
    // Assuming saveRoadmap or updateCourse can handle full object replacement:
    // await updateCourse(selectedCourse.id, updatedCourse); 
  };

  if (selectedCourse) {
    return (
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="pb-20">
        {/* Sticky Header */}
        <div className="flex items-center mb-8 sticky top-0 bg-[#0a0a0a]/95 backdrop-blur-sm z-30 py-4 border-b border-white/5 px-4 -mx-4 md:px-0 md:mx-0">
          <button
            onClick={() => setSelectedCourse(null)}
            className="mr-4 p-2 bg-white/5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg md:text-xl font-bold text-white truncate">{selectedCourse.topic}</h2>
            <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
              <span className="flex items-center gap-1"><ListVideo size={12} /> {selectedCourse.steps.length} Modules</span>
              <span className="w-1 h-1 rounded-full bg-slate-600"></span>
              <span className="flex items-center gap-1"><CheckCircle2 size={12} /> {selectedCourse.progress}% Complete</span>
            </div>
          </div>
          <div className="hidden md:block">
            <div className="w-32 h-2 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full transition-all duration-500"
                style={{ width: `${selectedCourse.progress}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Timeline View */}
        <div className="relative max-w-4xl mx-auto">
          {/* Vertical Line */}
          <div className="absolute left-4 md:left-8 top-4 bottom-0 w-0.5 bg-gradient-to-b from-blue-600 via-white/10 to-transparent"></div>

          <div className="space-y-8">
            {selectedCourse.steps.map((step, index) => {
              const isCompleted = step.status === 'completed';
              const isCurrent = !isCompleted && (index === 0 || selectedCourse.steps[index - 1].status === 'completed');
              const isExpanded = expandedStepId === step.id;

              return (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="relative pl-12 md:pl-20"
                >
                  {/* Timeline Node */}
                  <div className={`absolute left-4 md:left-8 top-6 w-4 h-4 rounded-full border-2 ${isCompleted ? 'bg-green-500 border-green-500' : isCurrent ? 'bg-blue-600 border-blue-600 animate-pulse' : 'bg-transparent border-white/20'}`}>
                    {isCompleted && <CheckCircle2 size={10} className="absolute inset-0 m-auto text-white" />}
                  </div>

                  {/* Step Card */}
                  <div className={`rounded-2xl border transition-all ${isCompleted ? 'bg-green-500/5 border-green-500/20' : isCurrent ? 'bg-blue-500/5 border-blue-500/30' : 'bg-white/5 border-white/10'}`}>
                    {/* Compact Header with Thumbnail */}
                    <div className="flex items-start gap-4 p-4">
                      {/* Thumbnail */}
                      {step.thumbnail && (
                        <div className="flex-shrink-0 w-32 h-20 md:w-40 md:h-24 rounded-lg overflow-hidden bg-black/40 relative group">
                          <img
                            src={step.thumbnail || getYouTubeThumbnailUrl(step.videoUrl || '')}
                            alt={step.title}
                            onError={(e) => {
                              const target = e.currentTarget;
                              target.src = 'https://placehold.co/320x180/1a1a1a/666?text=No+Thumbnail';
                            }}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Play size={24} className="text-white" />
                          </div>
                          {step.duration && (
                            <div className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded">
                              {step.duration}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded ${isCompleted ? 'bg-green-500/20 text-green-400' : isCurrent ? 'bg-blue-500/20 text-blue-400' : 'bg-white/10 text-slate-500'}`}>
                            Module {index + 1}
                          </span>
                          {step.duration && !step.thumbnail && (
                            <span className="flex items-center gap-1 text-xs text-slate-500">
                              <Clock size={12} />
                              {step.duration}
                            </span>
                          )}
                        </div>
                        <h3 className="text-base md:text-lg font-bold text-white mb-1 line-clamp-2">{step.title}</h3>

                        {/* Show description only when expanded */}
                        {isExpanded && (
                          <p className="text-sm text-slate-400 leading-relaxed mt-2">{step.description}</p>
                        )}

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 mt-3">
                          <button
                            onClick={() => onStartVideo(step, selectedCourse.id)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-full font-medium text-sm transition-all ${isCompleted ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20' : isCurrent ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
                          >
                            <Play size={12} />
                            {isCompleted ? 'Review' : 'Start Lesson'}
                          </button>

                          <button
                            onClick={() => setExpandedStepId(isExpanded ? null : step.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 text-slate-400 hover:bg-white/10 font-medium text-sm transition-all"
                          >
                            {isExpanded ? (
                              <>
                                <ChevronUp size={12} />
                                <span className="hidden md:inline">Less</span>
                              </>
                            ) : (
                              <>
                                <ChevronDown size={12} />
                                <span className="hidden md:inline">More</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Expandable Content */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4 pt-2 border-t border-white/10 space-y-4">
                            {/* Checklist */}
                            {step.checklist && step.checklist.length > 0 && (
                              <div>
                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                                  <CheckCircle2 size={12} /> Learning Checklist
                                </h4>
                                <div className="space-y-2">
                                  {step.checklist.map((item, idx) => (
                                    <div
                                      key={idx}
                                      onClick={() => toggleStepChecklist(step.id, idx)}
                                      className="flex items-start gap-2.5 p-2.5 rounded-lg bg-black/20 border border-white/5 hover:border-white/10 cursor-pointer transition-colors group"
                                    >
                                      <div className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center transition-colors ${item.completed ? 'bg-green-500/20 border-green-500' : 'border-slate-600 group-hover:border-slate-400'}`}>
                                        {item.completed && <CheckCircle2 size={10} className="text-green-500" />}
                                      </div>
                                      <span className={`text-sm ${item.completed ? 'text-slate-500 line-through' : 'text-slate-300'}`}>
                                        {item.text}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Resources */}
                            {step.resources && step.resources.length > 0 && (
                              <div>
                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                                  <LinkIcon size={12} /> Recommended Resources
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                  {step.resources.map((resource, idx) => (
                                    <a
                                      key={idx}
                                      href={resource.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-2.5 p-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 transition-colors group"
                                    >
                                      <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:text-blue-300 flex-shrink-0">
                                        {resource.type === 'video' ? <Youtube size={14} /> :
                                          resource.type === 'doc' ? <FileText size={14} /> : <LinkIcon size={14} />}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium text-white truncate group-hover:text-blue-400 transition-colors">{resource.title}</div>
                                        <div className="text-xs text-slate-500 uppercase">{resource.type}</div>
                                      </div>
                                      <ArrowRight size={12} className="text-slate-600 group-hover:text-slate-400 -translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all flex-shrink-0" />
                                    </a>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-10 pb-20 max-w-7xl mx-auto">
      {/* Hero Section */}
      <div className="relative rounded-3xl overflow-hidden border border-white/10 bg-[#0a0a0a]">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-transparent to-transparent opacity-40"></div>
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
          <Map size={300} />
        </div>

        <div className="relative z-10 p-8 md:p-12 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold mb-6">
            <Sparkles size={12} />
            <span>AI-Powered Learning Paths</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-bold text-white mb-6 tracking-tight leading-tight">
            Master Any Skill with <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600">Structured Roadmaps</span>
          </h1>

          <p className="text-slate-400 text-lg mb-10 leading-relaxed max-w-xl">
            Enter a topic or paste a YouTube playlist, and our AI will generate a comprehensive, step-by-step learning journey tailored just for you.
          </p>

          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative group">
              <div className="absolute inset-0 bg-blue-500/20 rounded-xl blur-md opacity-0 group-focus-within:opacity-100 transition-opacity duration-500"></div>
              <div className="relative flex items-center bg-black border border-white/10 rounded-xl focus-within:border-blue-500/50 transition-colors h-14">
                <Search className="ml-5 text-slate-500" size={20} />
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="What do you want to learn today?"
                  className="w-full bg-transparent px-4 text-white outline-none placeholder:text-slate-600 h-full"
                  onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                />
              </div>
            </div>
            <button
              onClick={handleGenerate}
              disabled={loading || !inputValue}
              className="h-14 px-8 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-900/20 hover:scale-[1.02] active:scale-[0.98]"
            >
              {loading ? <Loader2 className="animate-spin" /> : <Library size={20} />}
              Generate Roadmap
            </button>
          </div>
        </div>
      </div>

      {/* Course Grid */}
      <div>
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Library className="text-blue-500" size={24} /> My Learning Paths
          </h3>
          <span className="text-xs font-bold text-slate-400 bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
            {courses.length} Active Courses
          </span>
        </div>

        {courses.length === 0 ? (
          <div className="text-center py-24 border border-dashed border-white/10 rounded-3xl bg-[#0a0a0a]">
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
              <Map className="text-slate-600" size={32} />
            </div>
            <h4 className="text-xl font-bold text-white mb-2">No roadmaps yet</h4>
            <p className="text-slate-500 max-w-sm mx-auto">
              Start your journey by generating a roadmap above. It takes less than a minute!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <motion.div
                layout
                key={course.id}
                onClick={() => setSelectedCourse(course)}
                className="group bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden hover:border-blue-500/30 cursor-pointer transition-all hover:shadow-[0_0_30px_rgba(37,99,235,0.1)] hover:-translate-y-1 flex flex-col h-full"
              >
                {/* Thumbnail */}
                <div className="h-48 bg-white/5 relative overflow-hidden">
                  {course.thumbnail || course.steps[0]?.thumbnail ? (
                    <img
                      src={(course.thumbnail || course.steps[0]?.thumbnail || '').replace('/mqdefault.jpg', '/maxresdefault.jpg')}
                      alt={course.topic}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      onError={(e) => handleThumbnailError(e, course.steps[0]?.videoUrl || '', course.topic)}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
                      <ListVideo className="text-white/10" size={48} />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent opacity-90" />

                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] font-bold bg-blue-600 text-white px-2 py-0.5 rounded shadow-sm">
                        COURSE
                      </span>
                      <span className="text-[10px] font-bold bg-black/60 backdrop-blur-md text-slate-300 px-2 py-0.5 rounded border border-white/10">
                        {course.steps.length} STEPS
                      </span>
                    </div>
                    <h4 className="font-bold text-lg text-white line-clamp-1 group-hover:text-blue-400 transition-colors">
                      {course.topic}
                    </h4>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex justify-between items-center text-xs text-slate-400 mb-3 font-medium">
                    <span>Progress</span>
                    <span className={course.progress === 100 ? 'text-green-400' : 'text-blue-400'}>{course.progress}%</span>
                  </div>

                  <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden mb-6">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ${course.progress === 100 ? 'bg-green-500' : 'bg-blue-600'}`}
                      style={{ width: `${course.progress}%` }}
                    ></div>
                  </div>

                  <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Clock size={12} />
                      <span>Updated today</span>
                    </div>

                    <button
                      onClick={(e) => handleDelete(e, course.id)}
                      className="text-slate-600 hover:text-red-400 transition-colors p-2 hover:bg-red-500/10 rounded-lg"
                      title="Delete Course"
                    >
                      <Trash2 size={14} />
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
