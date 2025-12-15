import React from 'react';
import { useUsers } from '../contexts/UsersContext';

interface HeaderProps {
    strikes: number;
    onStatsClick: () => void;
    onHowToPlayClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ strikes, onStatsClick, onHowToPlayClick }) => {
    const { currentUser, firebaseUser } = useUsers();

    return (
        <header className="game-header">
            <div className="logo-container" style={{ position: 'relative', overflow: 'hidden', padding: '20px 0' }}>
                <svg className="game-logo-svg" viewBox="0 0 400 120" xmlns="http://www.w3.org/2000/svg" style={{ maxWidth: '400px' }}>

                    {/* 1. Sun (Top Left) */}
                    <g transform="translate(60, 40)">
                        <circle cx="0" cy="0" r="18" fill="var(--color-secondary)" />
                        {/* Sun Rays */}
                        {[...Array(8)].map((_, i) => (
                            <line
                                key={i}
                                x1="0" y1="-22" x2="0" y2="-28"
                                stroke="var(--color-secondary)"
                                strokeWidth="3"
                                transform={`rotate(${i * 45})`}
                                strokeLinecap="round"
                            />
                        ))}
                    </g>

                    {/* 2. Main Title "HANG 10" */}
                    <text
                        x="200"
                        y="50"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        style={{
                            fontFamily: 'var(--font-heading)',
                            fontSize: '48px',
                            fill: 'var(--color-secondary)',
                            stroke: 'var(--color-accent)',
                            strokeWidth: '1.5px',
                            letterSpacing: '2px'
                        }}
                    >
                        HANG 10
                    </text>

                    {/* 3. Decorative Waves across the bottom */}
                    {/* Top Wave (Coral) */}
                    <path
                        d="M0,80 Q50,60 100,80 T200,80 T300,80 T400,80"
                        fill="none"
                        stroke="var(--color-accent)"
                        strokeWidth="4"
                        opacity="0.8"
                    />
                    {/* Middle Wave (Yellow) */}
                    <path
                        d="M0,90 Q50,70 100,90 T200,90 T300,90 T400,90"
                        fill="none"
                        stroke="var(--color-secondary)"
                        strokeWidth="4"
                        opacity="0.8"
                    />
                    {/* Bottom Wave (Teal) */}
                    <path
                        d="M0,100 Q50,80 100,100 T200,100 T300,100 T400,100"
                        fill="none"
                        stroke="var(--color-primary)"
                        strokeWidth="4"
                        opacity="0.8"
                    />

                    {/* 4. Surfer (Riding the waves on the right) */}
                    <g transform="translate(300, 75) scale(0.8)">
                        {/* Surfboard */}
                        <ellipse cx="0" cy="15" rx="30" ry="5" fill="var(--color-accent)" transform="rotate(-10)" />
                        {/* Stick Figure Surfer */}
                        <line x1="-5" y1="12" x2="5" y2="-5" stroke="var(--color-text)" strokeWidth="3" strokeLinecap="round" /> {/* Legs/Body */}
                        <line x1="5" y1="-5" x2="10" y2="-15" stroke="var(--color-text)" strokeWidth="3" strokeLinecap="round" /> {/* Torso */}
                        <circle cx="12" cy="-18" r="4" fill="var(--color-text)" /> {/* Head */}
                        <line x1="5" y1="-10" x2="-10" y2="-10" stroke="var(--color-text)" strokeWidth="3" strokeLinecap="round" /> {/* Back Arm */}
                        <line x1="5" y1="-10" x2="20" y2="-5" stroke="var(--color-text)" strokeWidth="3" strokeLinecap="round" /> {/* Front Arm */}
                    </g>
                </svg>
            </div>

            <div className="header-controls">
                <div className="header-left">
                    <button
                        className="icon-btn"
                        onClick={onHowToPlayClick}
                        aria-label="How to Play"
                        style={{ backgroundColor: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(5px)' }}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="16" x2="12" y2="12"></line>
                            <line x1="12" y1="8" x2="12.01" y2="8"></line>
                        </svg>
                    </button>
                    {/* Moved Profile button to the right side per previous design */}
                </div>

                <div className="lives-display">
                    {Array(5).fill(0).map((_, i) => (
                        <span key={i} className={`life-icon ${i < (5 - strikes) ? 'active' : 'lost'}`}>
                            {/* Improved Wave Icon - Stylized Crest */}
                            <svg viewBox="0 0 100 60" fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" width="30" height="20">
                                <path d="M10,50 C10,50 30,10 50,10 C70,10 70,30 50,40 C40,45 30,30 50,25 C65,20 90,30 90,50" />
                            </svg>
                        </span>
                    ))}
                </div>

                <div className="header-right" style={{ display: 'flex', gap: '10px', alignItems: 'center', justifyContent: 'flex-end' }}>
                    <button
                        className="icon-btn"
                        onClick={onStatsClick}
                        aria-label="Statistics"
                        style={{ backgroundColor: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(5px)' }}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 20V10"></path>
                            <path d="M18 20V4"></path>
                            <path d="M6 20v-4"></path>
                        </svg>
                    </button>

                    <a href="/login" className="icon-btn" aria-label="Profile" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(5px)' }}>
                        {firebaseUser ? (
                            <div style={{
                                width: '24px', height: '24px', borderRadius: '50%', background: 'var(--color-primary)', color: 'var(--color-bg)',
                                display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '0.9rem', fontWeight: 'bold'
                            }}>
                                {currentUser?.handle ? currentUser.handle.charAt(0).toUpperCase() : (firebaseUser.email?.charAt(0).toUpperCase() || 'U')}
                            </div>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                <circle cx="12" cy="7" r="4"></circle>
                            </svg>
                        )}
                    </a>
                </div>
            </div>
        </header>
    );
};
