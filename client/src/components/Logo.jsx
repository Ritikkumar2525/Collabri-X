import React from 'react';

export const Logo = ({ className = "w-8 h-8", textClassName = "text-xl font-bold text-white tracking-tight font-sans", showText = true }) => {
    return (
        <div className="flex items-center gap-3 group cursor-pointer">
            <svg 
                className={`text-red-accent group-hover:scale-105 transition-transform ${className}`} 
                viewBox="0 0 32 32" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
            >
                {/* Outer collaborative network C */}
                <path d="M23 10 A 10 10 0 1 0 23 22" stroke="#ffffff" strokeWidth="3" strokeLinecap="round"/>
                
                {/* Real-time nodes */}
                <circle cx="16" cy="16" r="3.5" fill="currentColor" />
                <circle cx="23" cy="10" r="2.5" fill="currentColor" />
                <circle cx="23" cy="22" r="2.5" fill="currentColor" />
                
                {/* Network connections */}
                <line x1="18.5" y1="14.5" x2="21.5" y2="11.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="18.5" y1="17.5" x2="21.5" y2="20.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
            {showText && <span className={textClassName}>Collabrix</span>}
        </div>
    );
};

export default Logo;
