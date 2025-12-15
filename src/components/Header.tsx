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
                    <header style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '10px 20px',
                        borderBottom: '1px solid var(--color-border)',
                        maxWidth: '600px',
                        margin: '0 auto',
                        width: '100%'
                    }}>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <button
                                className="icon-btn"
                                onClick={onHowToPlayClick}
                                aria-label="How to play"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                                    <line x1="12" y1="17" x2="12.01" y2="17"></line>
                                </svg>
                            </button>
                            <a href="/login" className="icon-btn" aria-label="Profile" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center' }}>
                                {firebaseUser ? (
                                    <div style={{
                                        width: '24px', height: '24px', borderRadius: '50%', background: 'var(--color-secondary)', color: 'black',
                                        display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '0.8rem', fontWeight: 'bold'
                                    }}>
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
