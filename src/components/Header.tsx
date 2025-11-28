import React from 'react';

interface HeaderProps {
    strikes: number;
    onStatsClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ strikes, onStatsClick }) => {
    return (
        <header className="game-header">
            <div className="logo-container">
                <svg className="game-logo-svg" viewBox="0 0 400 80" xmlns="http://www.w3.org/2000/svg">
                    {/* Tech Background Shapes */}
                    <path d="M20,20 L10,20 L10,60 L20,60" fill="none" stroke="#475569" strokeWidth="2" />
                    <path d="M380,20 L390,20 L390,60 L380,60" fill="none" stroke="#475569" strokeWidth="2" />
                    <line x1="10" y1="40" x2="40" y2="40" stroke="#14b8a6" strokeWidth="2" />
                    <line x1="360" y1="40" x2="390" y2="40" stroke="#a78bfa" strokeWidth="2" />

                    {/* Circuit Traces */}
                    <circle cx="40" cy="40" r="3" fill="#14b8a6" />
                    <circle cx="360" cy="40" r="3" fill="#a78bfa" />
                    <path d="M40,40 L60,40 L70,25" fill="none" stroke="#14b8a6" strokeWidth="1" opacity="0.5" />
                    <path d="M360,40 L340,40 L330,55" fill="none" stroke="#a78bfa" strokeWidth="1" opacity="0.5" />

                    {/* Main Text */}
                    <text x="50%" y="55%" textAnchor="middle" dominantBaseline="middle" fontFamily="sans-serif" fontWeight="900" fontSize="42" letterSpacing="1">
                        <tspan fill="#14b8a6">THIRD</tspan>
                        <tspan fill="#f8fafc">DEGREE</tspan>
                    </text>

                    {/* Underline Accent */}
                    <path d="M120,65 L280,65" stroke="url(#grad1)" strokeWidth="3" strokeLinecap="round" />

                    {/* Gradients */}
                    <defs>
                        <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#14b8a6" />
                            <stop offset="50%" stopColor="#a78bfa" />
                            <stop offset="100%" stopColor="#ff4d4d" />
                        </linearGradient>
                    </defs>
                </svg>
            </div>

            <div className="header-controls">
                <div className="lives-display">
                    {Array(3).fill(0).map((_, i) => (
                        <span key={i} className={`life-icon ${i < (3 - strikes) ? 'active' : 'lost'}`}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="6"></circle>
                            </svg>
                        </span>
                    ))}
                </div>

                <div className="header-right">
                    <button className="stats-btn" onClick={onStatsClick} aria-label="Statistics">
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
