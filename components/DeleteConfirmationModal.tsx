import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

interface DeleteConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title?: string;
    message?: string;
    itemName?: string;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title = "Delete Course",
    message = "Are you sure you want to delete this course? This action cannot be undone and all progress will be lost.",
    itemName
}) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
                    >
                        {/* Modal */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300, duration: 0.3 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl relative overflow-hidden group"
                        >
                            {/* Background Gradient Effect */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

                            <div className="relative z-10">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20 flex-shrink-0">
                                        <AlertTriangle className="text-red-500 w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white">{title}</h3>
                                        <p className="text-xs text-red-400 font-medium uppercase tracking-wider">Irreversible Action</p>
                                    </div>
                                </div>

                                <div className="mb-6">
                                    <p className="text-slate-400 text-sm leading-relaxed">
                                        {message}
                                    </p>
                                    {itemName && (
                                        <div className="mt-3 p-3 bg-white/5 rounded-lg border border-white/5">
                                            <p className="text-sm font-medium text-white line-clamp-1">{itemName}</p>
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={onClose}
                                        className="flex-1 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-medium transition-colors border border-white/5 hover:border-white/10"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => {
                                            onConfirm();
                                            onClose();
                                        }}
                                        className="flex-1 px-4 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold transition-all shadow-lg shadow-red-900/20 hover:shadow-red-900/40 active:scale-95"
                                    >
                                        Delete Course
                                    </button>
                                </div>
                            </div>

                            {/* Close Button */}
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 p-2 text-slate-500 hover:text-white transition-colors rounded-lg hover:bg-white/5 z-20"
                            >
                                <X size={20} />
                            </button>
                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default DeleteConfirmationModal;
