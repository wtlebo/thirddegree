import React from 'react';
import { useUsers } from '../contexts/UsersContext';

interface HeaderProps {
    strikes: number;
    flashState?: 'correct' | 'incorrect' | null;
    onStatsClick: () => void;
    onHowToPlayClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ strikes, flashState, onStatsClick, onHowToPlayClick }) => {
    const { currentUser, firebaseUser } = useUsers();

    return (
        <header className="app-header">
            {/* Top Row: Logo (Left) and Controls (Right) */}
            <div className="header-top-row">
                <div className="logo-container">
                    <img
                        src="/logo-final.png"
                        alt="Hang 10 Header"
                        className={`header-logo-img ${flashState || ''}`}
                    />
                </div>

                <div className="header-actions">
                    <button
                        className="icon-btn"
                        onClick={onHowToPlayClick}
                        aria-label="How to Play"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="16" x2="12" y2="12"></line>
                            <line x1="12" y1="8" x2="12.01" y2="8"></line>
                        </svg>
                    </button>

                    <button
                        className="icon-btn"
                        onClick={onStatsClick}
                        aria-label="Statistics"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 20V10"></path>
                            <path d="M18 20V4"></path>
                            <path d="M6 20v-4"></path>
                        </svg>
                    </button>

                    <a href="/login" className="icon-btn profile-link" aria-label="Profile">
                        {firebaseUser ? (
                            <div className="profile-avatar">
                                {currentUser?.handle ? currentUser.handle.charAt(0).toUpperCase() : (firebaseUser.email?.charAt(0).toUpperCase() || 'U')}
                            </div>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                <circle cx="12" cy="7" r="4"></circle>
                            </svg>
                        )}
                    </a>
                </div>
            </div>

            {/* Bottom Row: Lives (Waves) */}
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
        </header>
    );
};
