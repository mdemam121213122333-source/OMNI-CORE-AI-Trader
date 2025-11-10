import React, { useState } from 'react';
import { Auth, User, signOut } from 'firebase/auth';
import { Firestore } from 'firebase/firestore';
import TraderDashboard from './TraderDashboard';
import TradeHistory from './TradeHistory';
import Settings from './Settings';
import ConversationalAI from './ConversationalAI';

interface LayoutProps {
    user: User;
    auth: Auth;
    db: Firestore;
}

type Page = 'dashboard' | 'history' | 'scanner' | 'community' | 'leaderboard' | 'achievements' | 'settings';

const NavItem: React.FC<{
    icon: React.ReactNode;
    label: string;
    isActive: boolean;
    onClick: () => void;
    disabled?: boolean;
}> = ({ icon, label, isActive, onClick, disabled }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className={`flex items-center w-full px-4 py-3 text-sm font-semibold transition-colors duration-200 rounded-lg
            ${isActive ? 'bg-[var(--accent-primary)] text-white shadow-lg' : 'text-gray-300 hover:bg-white/10'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
    >
        <span className="w-6 h-6 mr-3">{icon}</span>
        <span>{label}</span>
    </button>
);

const Layout: React.FC<LayoutProps> = ({ user, auth, db }) => {
    const [activePage, setActivePage] = useState<Page>('dashboard');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const handleLogout = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error("Logout failed:", error);
        }
    };

    const handleNavClick = (page: Page) => {
        setActivePage(page);
        setIsSidebarOpen(false);
    }

    const pageTitles: Record<Page, React.ReactNode> = {
        dashboard: <>Live Signal <span className="text-[var(--accent-primary)]">Dashboard</span></>,
        history: <>Trade <span className="text-[var(--accent-primary)]">History</span></>,
        settings: <>System <span className="text-[var(--accent-primary)]">Settings</span></>,
        scanner: 'Market Scanner',
        community: 'Community Feed',
        leaderboard: 'Leaderboard',
        achievements: 'Achievements',
    };

    const renderPage = () => {
        switch (activePage) {
            case 'dashboard':
                return <TraderDashboard user={user} db={db} />;
            case 'history':
                return <TradeHistory user={user} db={db} />;
            case 'settings':
                return <Settings />;
            case 'scanner':
            case 'community':
            case 'leaderboard':
            case 'achievements':
                 return <div className="text-center p-10 bg-[var(--bg-secondary)]/50 rounded-lg border border-[var(--border-color)]">
                    <h2 className="text-2xl font-bold text-[var(--accent-primary)] mb-2 capitalize">{activePage}</h2>
                    <p>This feature is currently under development and will be available soon.</p>
                </div>;
            default:
                return <TraderDashboard user={user} db={db} />;
        }
    };

    return (
        <div className="flex min-h-screen bg-[var(--bg-primary)]">
            {/* Overlay for mobile */}
            {isSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black/60 z-20 lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                ></div>
            )}
            
            {/* Sidebar */}
            <aside className={`fixed inset-y-0 left-0 z-30 w-64 bg-[var(--bg-secondary)] p-4 flex-shrink-0 flex flex-col border-r border-[var(--border-color)] transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="mb-8">
                    <h1 className="text-xl font-bold text-white tracking-wider">OMNI-CORE</h1>
                    <span className="text-sm text-[var(--accent-primary)]">AI TRADER SUITE</span>
                </div>
                
                <nav className="flex-grow space-y-2">
                    <NavItem icon={<DashboardIcon />} label="Dashboard" isActive={activePage === 'dashboard'} onClick={() => handleNavClick('dashboard')} />
                    <NavItem icon={<HistoryIcon />} label="Trade History" isActive={activePage === 'history'} onClick={() => handleNavClick('history')} />
                    <NavItem icon={<ScannerIcon />} label="Market Scanner" isActive={activePage === 'scanner'} onClick={() => handleNavClick('scanner')} disabled/>
                    <NavItem icon={<CommunityIcon />} label="Community Feed" isActive={activePage === 'community'} onClick={() => handleNavClick('community')} disabled/>
                    <NavItem icon={<LeaderboardIcon />} label="Leaderboard" isActive={activePage === 'leaderboard'} onClick={() => handleNavClick('leaderboard')} disabled/>
                    <NavItem icon={<AchievementsIcon />} label="Achievements" isActive={activePage === 'achievements'} onClick={() => handleNavClick('achievements')} disabled/>
                </nav>

                <div className="mt-auto">
                    <NavItem icon={<SettingsIcon />} label="Settings" isActive={activePage === 'settings'} onClick={() => handleNavClick('settings')} />
                     <div className="text-xs text-center text-gray-500 p-2 my-2 break-words">
                        {user.email}
                    </div>
                    <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 text-sm bg-[var(--danger-color)] text-white rounded-lg px-3 py-2.5 font-bold hover:opacity-80 transition-opacity">
                       <LogoutIcon /> Logout
                    </button>
                </div>
            </aside>
            
            {/* Main Content */}
            <div className="flex-1 flex flex-col w-full lg:w-auto">
                 {/* Mobile Header */}
                <header className="lg:hidden h-16 flex items-center justify-between px-4 bg-[var(--bg-secondary)]/80 backdrop-blur-sm border-b border-[var(--border-color)] sticky top-0 z-10">
                    <button onClick={() => setIsSidebarOpen(true)} className="text-white">
                        <HamburgerIcon />
                    </button>
                    <h1 className="text-lg font-bold text-[var(--text-primary)] tracking-wider">
                        {pageTitles[activePage]}
                    </h1>
                    <div className="w-8"></div> {/* Spacer */}
                </header>

                <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
                     <h1 className="hidden lg:block text-xl sm:text-2xl font-bold text-[var(--text-primary)] tracking-wider mb-6">
                        {pageTitles[activePage]}
                    </h1>
                    {renderPage()}
                </main>
            </div>


            <ConversationalAI />
        </div>
    );
};

// --- SVG Icons ---
const DashboardIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>;
const HistoryIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const ScannerIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;
const CommunityIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;
const LeaderboardIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>;
const AchievementsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 11l3-3m0 0l3 3m-3-3v8m0-13a9 9 0 110 18 9 9 0 010-18z" /></svg>;
const SettingsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const LogoutIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>;
const HamburgerIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>;

export default Layout;
