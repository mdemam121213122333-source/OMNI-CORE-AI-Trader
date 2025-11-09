
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Auth, User, signOut } from 'firebase/auth';
import { Firestore } from 'firebase/firestore';
import { brokers, marketAssets, brokerDurationsMap, defaultDurations, brokerMarketMap, TOTAL_AI_MODELS } from '../constants';
import { generateAiSignal, logTrade, loadUserSettings, saveUserSettings } from '../services/apiService';
import { SignalData, UserSettings, AiConsensusResponse } from '../types';
import SignalCard from './SignalCard';

interface TraderDashboardProps {
  user: User;
  auth: Auth;
  db: Firestore;
}

const CustomSelect: React.FC<{ label: string; value: string; onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void; options: React.ReactNode; disabled: boolean; }> = ({ label, value, onChange, options, disabled }) => (
    <div className="relative bg-gray-800/40 rounded-lg border border-white/20">
        <select aria-label={label} value={value} onChange={onChange} disabled={disabled} className="w-full appearance-none bg-transparent text-white px-4 py-4 text-center font-semibold cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#ff5733] rounded-lg disabled:cursor-not-allowed disabled:opacity-60">
            {options}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-300">
            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
        </div>
    </div>
);

const TraderDashboard: React.FC<TraderDashboardProps> = ({ user, auth, db }) => {
    const [selections, setSelections] = useState({
        broker: brokers[0],
        asset: marketAssets['### FOREX (LIVE FEED) ###'][0],
        duration: defaultDurations[1],
    });
    const [signalData, setSignalData] = useState<SignalData | null>(null);
    const [lastTenResults, setLastTenResults] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isCooldown, setIsCooldown] = useState(false);
    const [cooldownTime, setCooldownTime] = useState(60);
    const [globalError, setGlobalError] = useState('');
    const [statusMessage, setStatusMessage] = useState('');

    const durationOptions = useMemo(() => {
        return brokerDurationsMap[selections.broker] || defaultDurations;
    }, [selections.broker]);

    const handleSelectionChange = (field: keyof typeof selections) => (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        setSelections(prev => {
            const newSelections = { ...prev, [field]: value };
            if (field === 'broker') {
                newSelections.duration = (brokerDurationsMap[value] || defaultDurations)[0];
            }
            return newSelections;
        });
    };
    
    const persistSettings = useCallback(() => {
        const settings: UserSettings = { ...selections, lastTen: lastTenResults };
        saveUserSettings(db, user.uid, settings);
    }, [db, user.uid, selections, lastTenResults]);

    useEffect(() => {
        loadUserSettings(db, user.uid).then(settings => {
            if (settings) {
                setSelections({
                    broker: settings.broker || brokers[0],
                    asset: settings.asset || marketAssets['### FOREX (LIVE FEED) ###'][0],
                    duration: settings.duration || defaultDurations[1],
                });
                setLastTenResults(settings.lastTen || []);
            }
        }).catch(err => setGlobalError(err.message));
    }, [db, user.uid]);
    
    useEffect(() => {
        persistSettings();
    }, [persistSettings]);

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (isCooldown && cooldownTime > 0) {
            timer = setInterval(() => {
                setCooldownTime(prev => prev - 1);
            }, 1000);
        } else if (isCooldown && cooldownTime <= 0) {
            setIsCooldown(false);
            setCooldownTime(60);
        }
        return () => clearInterval(timer);
    }, [isCooldown, cooldownTime]);
    
    const handleGenerate = async () => {
        setIsLoading(true);
        setGlobalError('');
        setSignalData(null);

        try {
            const aiResponse: AiConsensusResponse = await generateAiSignal(db, user, selections.asset, setStatusMessage);

            const entryTime = new Date(new Date().getTime() + 2 * 60000 + 6 * 3600 * 1000).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });

            const newSignal: SignalData = {
                broker: brokerMarketMap[selections.broker] || selections.broker,
                asset: selections.asset,
                duration: selections.duration,
                direction: aiResponse.signal,
                time: `${entryTime} (UTC+6)`,
                accuracy: `100.0% (OMNI-CORE CONSENSUS)`,
                reason: `**OMNI-CORE AI (${aiResponse.signal}):** ${aiResponse.reason}`,
            };
            
            setSignalData(newSignal);
            
            await logTrade(db, user, newSignal);

            setLastTenResults(prev => {
                const updated = ['S', ...prev];
                return updated.slice(0, 10);
            });

            setIsCooldown(true);
        } catch (error) {
            setGlobalError((error as Error).message);
        } finally {
            setIsLoading(false);
            setStatusMessage('');
        }
    };
    
    const handleClear = () => {
        setSignalData(null);
        setGlobalError('');
        setIsCooldown(false);
        setCooldownTime(60);
    };

    const handleLogout = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error("Logout failed:", error);
        }
    };

    const formatTime = (time: number) => `${String(Math.floor(time / 60)).padStart(2, '0')}:${String(time % 60).padStart(2, '0')}`;
    const allDisabled = isLoading || isCooldown;

    return (
        <>
            <div className="absolute top-2 right-2 bg-black/30 p-2 px-4 rounded-full text-xs border border-[#ff5733] flex items-center">
                <span>{user.email}</span>
                <button onClick={handleLogout} className="ml-3 bg-[#ff3d00] text-white rounded-full px-3 py-1 text-xs font-bold hover:bg-red-700 transition-colors">Logout</button>
            </div>
            
            <div className="w-full max-w-md bg-white/5 p-6 rounded-2xl shadow-2xl backdrop-blur-lg border border-white/10 space-y-4">
                {globalError && (
                    <div className="bg-[#ff0000] text-white p-4 rounded-lg text-center font-bold text-sm">
                        {globalError}
                    </div>
                )}

                <div className="space-y-4">
                    <CustomSelect label="Broker" value={selections.broker} onChange={handleSelectionChange('broker')} disabled={allDisabled} options={
                        brokers.map(b => <option key={b} value={b}>{b}</option>)
                    } />
                    <CustomSelect label="Asset" value={selections.asset} onChange={handleSelectionChange('asset')} disabled={allDisabled} options={
                        Object.entries(marketAssets).map(([group, assets]) => (
                            <optgroup key={group} label={group.replace(/#/g, '')}>
                                {assets.map(a => <option key={a} value={a}>{a}</option>)}
                            </optgroup>
                        ))
                    } />
                    <CustomSelect label="Duration" value={selections.duration} onChange={handleSelectionChange('duration')} disabled={allDisabled} options={
                        durationOptions.map(d => <option key={d} value={d}>{d}</option>)
                    } />
                </div>

                <div className="flex justify-between gap-3 text-center font-bold">
                    {isLoading && <div className="flex-1 p-2.5 rounded-lg text-sm bg-[#00bcd4]/10 text-[#00bcd4] border border-[#00bcd4] transition-all duration-300">{statusMessage || 'Initializing...'}</div>}
                    {isCooldown && <div className="flex-1 p-2.5 rounded-lg text-sm bg-[#ff4d4d]/10 text-[#ff4d4d] border border-[#ff4d4d] transition-all duration-300">Cooldown: {formatTime(cooldownTime)}</div>}
                </div>

                <div className="flex gap-3">
                    <button onClick={handleGenerate} disabled={allDisabled} className="flex-1 py-3.5 px-2.5 border-none rounded-lg text-base font-bold cursor-pointer transition-all duration-300 shadow-lg bg-[#ff5733] text-white disabled:bg-gray-600/80 disabled:opacity-60 disabled:cursor-not-allowed hover:bg-orange-600">
                        {isLoading ? 'Generating...' : '✨ Generate AI Signal'}
                    </button>
                    <button onClick={handleClear} disabled={isLoading} className="flex-1 py-3.5 px-2.5 border-none rounded-lg text-base font-bold cursor-pointer transition-all duration-300 shadow-lg bg-white text-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed hover:bg-gray-200">
                        Clear Signal
                    </button>
                </div>

                <SignalCard 
                    signalData={signalData}
                    lastTenResults={lastTenResults}
                    isCooldown={isCooldown}
                    isLoading={isLoading}
                    cooldownTimeFormatted={formatTime(cooldownTime)}
                />

            </div>
        </>
    );
};

export default TraderDashboard;
