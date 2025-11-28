import React from 'react';
import ReactDOM from 'react-dom/client';

const FaviconGallery = () => {
    const options = [
        { src: '/favicon.svg', label: 'Option 1: Degree Symbol (Current)' },
        { src: '/favicon-opt2.svg', label: 'Option 2: Three Bars' },
        { src: '/favicon-opt3.svg', label: 'Option 3: Triangle' },
        { src: '/favicon-opt4.svg', label: 'Option 4: Number "3"' },
    ];

    return (
        <div style={{
            backgroundColor: '#0f172a',
            color: '#f8fafc',
            fontFamily: 'sans-serif',
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '20px'
        }}>
            <h1 style={{ marginBottom: '40px' }}>Favicon Options</h1>
            <div style={{
                display: 'flex',
                gap: '40px',
                flexWrap: 'wrap',
                justifyContent: 'center'
            }}>
                {options.map((opt, i) => (
                    <div key={i} style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '10px'
                    }}>
                        <img
                            src={opt.src}
                            alt={opt.label}
                            style={{
                                width: '100px',
                                height: '100px',
                                borderRadius: '20px',
                                boxShadow: '0 0 20px rgba(0,0,0,0.5)'
                            }}
                        />
                        <div style={{ fontWeight: 'bold', color: '#a78bfa' }}>{opt.label}</div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default FaviconGallery;
