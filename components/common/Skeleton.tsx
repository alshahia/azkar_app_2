
import React from 'react';

interface SkeletonProps {
    className?: string;
}

const Skeleton: React.FC<SkeletonProps> = ({ className = "" }) => {
    return (
        <div className={`animate-pulse bg-gray-200 dark:bg-gray-700/50 rounded-xl ${className}`}></div>
    );
};

export default Skeleton;
