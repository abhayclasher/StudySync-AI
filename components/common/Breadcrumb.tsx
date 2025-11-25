import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { motion } from 'framer-motion';

export interface BreadcrumbItem {
    label: string;
    onClick?: () => void;
    icon?: React.ReactNode;
}

interface BreadcrumbProps {
    items: BreadcrumbItem[];
    className?: string;
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ items, className = '' }) => {
    return (
        <nav className={`flex items-center gap-2 text-sm ${className}`} aria-label="Breadcrumb">
            <ol className="flex items-center gap-2 flex-wrap">
                {items.map((item, index) => {
                    const isLast = index === items.length - 1;

                    return (
                        <li key={index} className="flex items-center gap-2">
                            {index > 0 && (
                                <ChevronRight size={14} className="text-slate-600" />
                            )}

                            {isLast ? (
                                <span className="text-white font-medium flex items-center gap-1.5">
                                    {item.icon}
                                    {item.label}
                                </span>
                            ) : (
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={item.onClick}
                                    className="text-slate-400 hover:text-white transition-colors flex items-center gap-1.5"
                                >
                                    {item.icon}
                                    {item.label}
                                </motion.button>
                            )}
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
};

export default Breadcrumb;
