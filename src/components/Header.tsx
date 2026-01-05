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
            <div className="logo-container" style={{ position: 'relative', overflow: 'hidden', padding: '5px 0' }}>
                <img
                    src="/logo.png"
                    alt="Hang 10 Header"
                    style={{ width: '100%', maxWidth: '300px', height: 'auto', display: 'block', margin: '0 auto' }}
                />
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
                            {/* Minimalist Wave Icon (PNG) - v2 - CACHE BUSTER */}
                            <img
                                src="/wave_icon_v2.png"
                                alt="Wave"
                                style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '4px' }}
                            />
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
