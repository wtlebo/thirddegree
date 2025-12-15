import React from 'react';

interface HeaderProps {
    strikes: number;
    onStatsClick: () => void;
    onHowToPlayClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ strikes, onStatsClick, onHowToPlayClick }) => {
    return (
        <header className="game-header">
            <div className="logo-container">
                <svg className="game-logo-svg" viewBox="0 0 400 80" xmlns="http://www.w3.org/2000/svg">
                    {/* Retro Sun Background */}
                    <circle cx="200" cy="80" r="60" fill="#FFE66D" opacity="0.2" />

                    {/* Wave Lines */}
                    <path d="M20,50 Q40,30 60,50 T100,50 T140,50" fill="none" stroke="#4ECDC4" strokeWidth="3" opacity="0.5" />
                    <path d="M300,50 Q320,70 340,50 T380,50" fill="none" stroke="#4ECDC4" strokeWidth="3" opacity="0.5" />

                    {/* Main Text */}
                    <text x="50%" y="55%" textAnchor="middle" dominantBaseline="middle" fontFamily="sans-serif" fontWeight="900" fontSize="48" letterSpacing="2">
                        <tspan fill="#F7FFF7">HANG</tspan>
                        <tspan dx="10" fill="#FF6B6B">10</tspan>
                    </text>

                    {/* Underline Surfboard shape */}
                    <path d="M140,65 Q200,75 260,65" fill="none" stroke="#FFE66D" strokeWidth="4" strokeLinecap="round" />
                </svg>
            </div>

            <div className="header-controls">
                <div className="header-left">
                    <button className="icon-btn" onClick={onHowToPlayClick} aria-label="How to Play">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="16" x2="12" y2="12"></line>
                            <line x1="12" y1="8" x2="12.01" y2="8"></line>
                        </svg>
                    </button>
                </div>

                <div className="lives-display">
                    {Array(5).fill(0).map((_, i) => (
                        <span key={i} className={`life-icon ${i < (5 - strikes) ? 'active' : 'lost'}`}>
                            {/* Wave Icon - Simple breaking wave */}
                            <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                                <path d="M2,18 C2,18 4,14 8,14 C12,14 14,18 18,18 C20,18 22,17 22,17 L22,20 L2,20 Z M20,15 C18,12 15,10 11,10 C6,10 3,14 2,16 L3,16 C4,14 7,12 11,12 C14,12 16,14 18,16" />
                            </svg>
                        </span>
                    ))}
                </div>

                <div className="header-right">
                    <button className="icon-btn" onClick={onStatsClick} aria-label="Statistics">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 20V10"></path>
                            <path d="M18 20V4"></path>
                            <path d="M6 20v-4"></path>
                        </svg>
                    </button>
                </div>
            </div>
        </header>
    );
};
