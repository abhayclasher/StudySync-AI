import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, X } from 'lucide-react';

interface SignOutModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

const SignOutModal: React.FC<SignOutModalProps> = ({ isOpen, onClose, onConfirm }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
                    />

                    {/* Modal */}
                    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ type: 'spring', duration: 0.5 }}
                            className="bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden relative"
                        >
                            {/* Gradient Background Effect */}
                            <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 via-transparent to-transparent pointer-events-none" />

                            {/* Close Button */}
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/5 transition-colors text-slate-400 hover:text-white z-10"
                            >
                                <X size={20} />
                            </button>

                            {/* Content */}
                            <div className="relative p-8">
                                {/* Icon */}
                                <div className="flex justify-center mb-6">
                                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-500/20 to-red-600/10 border border-red-500/20 flex items-center justify-center">
                                        <LogOut size={28} className="text-red-400" />
                                    </div>
                                </div>

                                {/* Title */}
                                <h2 className="text-2xl font-bold text-white text-center mb-3">
                                    Sign Out?
                                </h2>

                                {/* Description */}
                                <p className="text-slate-400 text-center mb-8 leading-relaxed">
                                    Are you sure you want to sign out? Your progress will be saved and you can continue learning anytime.
                                </p>

                                {/* Buttons */}
                                <div className="flex gap-3">
                                    <button
                                        onClick={onClose}
                                        className="flex-1 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white rounded-xl font-medium transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => {
                                            onConfirm();
                                            onClose();
                                        }}
                                        className="flex-1 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-red-500/20 hover:shadow-red-500/40 hover:scale-105 active:scale-95"
                                    >
                                        Sign Out
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
};

export default SignOutModal;
