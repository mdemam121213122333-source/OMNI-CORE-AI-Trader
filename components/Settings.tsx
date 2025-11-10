import React, { useState, useEffect } from 'react';

const availableThemes = [
    { id: 'omni-core', name: 'OMNI-CORE' },
    { id: 'matrix', name: 'Matrix' },
];

const Settings: React.FC = () => {
    const [activeTheme, setActiveTheme] = useState('omni-core');

    useEffect(() => {
        const savedTheme = localStorage.getItem('omni-core-theme') || 'omni-core';
        setActiveTheme(savedTheme);
    }, []);

    const handleThemeChange = (themeId: string) => {
        setActiveTheme(themeId);
        document.documentElement.setAttribute('data-theme', themeId);
        localStorage.setItem('omni-core-theme', themeId);
    };

    return (
        <div className="space-y-4 bg-[var(--bg-secondary)]/50 p-5 rounded-xl shadow-2xl backdrop-blur-lg border border-[var(--border-color)] animate-fade-in">
            <div className="p-4 bg-black/20 rounded-lg border border-[var(--border-color)]">
                <h2 className="text-lg font-semibold text-gray-200 mb-4">Appearance</h2>
                <p className="text-sm text-gray-400 mb-4">Select your preferred user interface theme.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {availableThemes.map(theme => (
                        <button
                            key={theme.id}
                            onClick={() => handleThemeChange(theme.id)}
                            className={`p-4 rounded-lg text-center font-bold border-2 transition-all duration-300
                                ${activeTheme === theme.id 
                                    ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/20 text-white' 
                                    : 'border-transparent bg-black/30 text-gray-300 hover:border-[var(--accent-secondary)]/50'}
                            `}
                        >
                            {theme.name}
                        </button>
                    ))}
                </div>
            </div>
             <div className="p-4 bg-black/20 rounded-lg border border-[var(--border-color)] opacity-50">
                <h2 className="text-lg font-semibold text-gray-200 mb-4">API & Integrations</h2>
                <p className="text-sm text-gray-400">Manage API connections and third-party integrations (Coming Soon).</p>
            </div>
             <div className="p-4 bg-black/20 rounded-lg border border-[var(--border-color)] opacity-50">
                <h2 className="text-lg font-semibold text-gray-200 mb-4">Notifications</h2>
                <p className="text-sm text-gray-400">Configure your alert and notification preferences (Coming Soon).</p>
            </div>
        </div>
    );
};

export default Settings;
