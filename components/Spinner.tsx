
import React from 'react';

const Spinner: React.FC<{ size?: 'sm' | 'md' | 'lg'; label?: string }> = ({ size = 'md', label = 'Loading…' }) => {
    const sizeClasses = {
        sm: 'h-6 w-6',
        md: 'h-8 w-8',
        lg: 'h-12 w-12',
    };

    return (
        <div className="flex justify-center items-center" role="status" aria-label={label}>
            <div className={`${sizeClasses[size]} animate-spin rounded-full border-4 border-solid border-emerald-500 border-t-transparent`}></div>
            <span className="sr-only">{label}</span>
        </div>
    );
};

export default Spinner;
