import React from 'react';
import { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description: string;
    action?: {
        label: string;
        onClick: () => void;
        variant?: 'primary' | 'secondary';
    };
    className?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
    icon: Icon,
    title,
    description,
    action,
    className = ''
}) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className={`flex flex-col items-center justify-center text-center py-16 px-4 ${className}`}
        >
            {/* Icon Container */}
            <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
                className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-6"
            >
                <Icon size={36} className="text-slate-400" />
            </motion.div>

            {/* Title */}
            <h3 className="text-xl md:text-2xl font-bold text-white mb-2">
                {title}
            </h3>

            {/* Description */}
            <p className="text-slate-400 text-sm md:text-base max-w-md mb-8 leading-relaxed">
                {description}
            </p>

            {/* Action Button */}
            {action && (
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={action.onClick}
                    className={`px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-lg ${action.variant === 'secondary'
                            ? 'bg-white/5 hover:bg-white/10 text-white border border-white/10'
                            : 'bg-primary hover:bg-primary/90 text-white shadow-primary/20 hover:shadow-primary/40'
                        }`}
                >
                    {action.label}
                </motion.button>
            )}
        </motion.div>
    );
};

export default EmptyState;
