import React from 'react';

export const Avatar: React.FC<{ src?: string | null; initials: string; size?: 'sm' | 'md' | 'lg'; shape?: 'rounded' | 'circle' }> = ({ src, initials, size = 'md', shape = 'circle' }) => {
    const sizeClasses = { sm: 'w-10 h-10', md: 'w-12 h-12', lg: 'w-16 h-16' };
    const shapeClasses = { rounded: 'rounded-lg', circle: 'rounded-full' };
    return (
        <div className={`avatar placeholder ${shapeClasses[shape]}`}>
            <div className={`bg-primary text-primary-content ${sizeClasses[size]}`}>
                {src ? <img src={src} alt={initials} /> : <span className="text-xl">{initials}</span>}
            </div>
        </div>
    );
};