import React from 'react';

interface SkeletonProps {
    className?: string;
    variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
    width?: string | number;
    height?: string | number;
    animation?: 'pulse' | 'wave' | 'none';
}

const Skeleton: React.FC<SkeletonProps> = ({
    className = '',
    variant = 'text',
    width,
    height,
    animation = 'pulse'
}) => {
    const baseClasses = 'bg-white/5';

    const variantClasses = {
        text: 'rounded h-4',
        circular: 'rounded-full',
        rectangular: 'rounded-none',
        rounded: 'rounded-xl'
    };

    const animationClasses = {
        pulse: 'animate-pulse',
        wave: 'animate-shimmer bg-gradient-to-r from-white/5 via-white/10 to-white/5 bg-[length:200%_100%]',
        none: ''
    };

    const style: React.CSSProperties = {
        width: width || (variant === 'text' ? '100%' : undefined),
        height: height || (variant === 'circular' ? '40px' : undefined)
    };

    return (
        <div
            className={`${baseClasses} ${variantClasses[variant]} ${animationClasses[animation]} ${className}`}
            style={style}
        />
    );
};

// Preset skeleton components for common use cases
export const SkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => (
    <div className={`bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 ${className}`}>
        <div className="flex items-start gap-4">
            <Skeleton variant="circular" width={48} height={48} />
            <div className="flex-1 space-y-3">
                <Skeleton width="60%" height={20} />
                <Skeleton width="40%" height={16} />
                <div className="flex gap-2 mt-4">
                    <Skeleton width={80} height={32} variant="rounded" />
                    <Skeleton width={80} height={32} variant="rounded" />
                </div>
            </div>
        </div>
    </div>
);

export const SkeletonText: React.FC<{ lines?: number; className?: string }> = ({
    lines = 3,
    className = ''
}) => (
    <div className={`space-y-2 ${className}`}>
        {Array.from({ length: lines }).map((_, i) => (
            <Skeleton
                key={i}
                width={i === lines - 1 ? '70%' : '100%'}
                height={16}
            />
        ))}
    </div>
);

export const SkeletonList: React.FC<{ items?: number; className?: string }> = ({
    items = 5,
    className = ''
}) => (
    <div className={`space-y-4 ${className}`}>
        {Array.from({ length: items }).map((_, i) => (
            <SkeletonCard key={i} />
        ))}
    </div>
);

export const SkeletonDashboard: React.FC = () => (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
            <div className="space-y-2">
                <Skeleton width={200} height={32} />
                <Skeleton width={150} height={16} />
            </div>
            <Skeleton width={120} height={40} variant="rounded" />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-2">
                        <Skeleton variant="circular" width={32} height={32} />
                        <Skeleton width={60} height={32} />
                    </div>
                    <Skeleton width="50%" height={16} />
                </div>
            ))}
        </div>

        {/* Content Cards */}
        <SkeletonList items={3} />
    </div>
);

export default Skeleton;
