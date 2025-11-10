import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { User } from 'firebase/auth';
import { Firestore } from 'firebase/firestore';
import { brokers, marketAssets, brokerDurationsMap, defaultDurations, brokerMarketMap, TOTAL_AI_MODELS, AI_PERSONAS } from '../constants';
import { generateAiSignal, logTrade, loadUserSettings, saveUserSettings } from '../services/apiService';
import { SignalData, UserSettings, AiConsensusResponse } from '../types';
import SignalCard from './SignalCard';

// --- Sub-components for TraderDashboard ---

const CustomSelect: React.FC<{ label: string; value: string; onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void; options: React.ReactNode; disabled: boolean; }> = ({ label, value, onChange, options, disabled }) => (
    <div className="relative bg-black/20 rounded-lg border border-[var(--border-color)] shadow-inner">
        <select aria-label={label} value={value} onChange={onChange} disabled={disabled} className="w-full appearance-none bg-transparent text-[var(--text-primary)] px-4 py-3 text-base text-center font-semibold cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] rounded-lg disabled:cursor-not-allowed disabled:opacity-50">
            {options}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
        </div>
    </div>
);

const AnalysisProgress: React.FC<{ step: number, steps: string[] }> = ({ step, steps }) => {
    return (
        <div className="flex justify-between items-center gap-2 sm:gap-4 my-4 px-1">
            {steps.map((name, index) => {
                const isActive = step > index + 1;
                const isCurrent = step === index + 1;
                return (
                    <React.Fragment key={name}>
                        <div className="flex flex-col items-center text-center">
                            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${isActive ? 'bg-[var(--success-color)]/80 border-[var(--success-color)]' : isCurrent ? 'bg-[var(--accent-primary)]/80 border-[var(--accent-primary)] animate-pulse' : 'bg-black/20 border-[var(--border-color)]'}`}>
                                {isActive ? '✓' : index + 1}
                            </div>
                            <span className={`text-xs sm:text-sm mt-2 transition-colors ${isActive || isCurrent ? 'text-[var(--text-primary)]' : 'text-gray-500'}`}>{name}</span>
                        </div>
                        {index < steps.length - 1 && <div className={`flex-1 h-1 rounded-full transition-colors duration-500 ${step > index + 1 ? 'bg-[var(--success-color)]' : 'bg-black/30'}`}></div>}
                    </React.Fragment>
                )
            })}
        </div>
    );
};

const SystemLog: React.FC<{ messages: string[] }> = ({ messages }) => {
    const logEndRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    return (
        <div className="h-48 bg-black/30 rounded-lg p-4 border border-[var(--border-color)] font-mono text-sm text-gray-300 overflow-y-auto shadow-inner">
            {messages.map((msg, i) => (
                <div key={i} className="whitespace-pre-wrap">
                    <span className="text-[var(--success-color)] mr-2">&gt;</span>{msg}
                </div>
            ))}
            <div ref={logEndRef} />
        </div>
    );
};

interface TraderDashboardProps {
    user: User;
    db: Firestore;
}

const availableTechniques = ['Fundamental', 'Technical', 'Sentiment'];

const getRandomSyncTime = () => Math.floor(Math.random() * (240 - 90 + 1)) + 90;

// --- Main Dashboard Component ---

const TraderDashboard: React.FC<TraderDashboardProps> = ({ user, db }) => {
    // Trade Parameters
    const [selections, setSelections] = useState({
        broker: brokers[0],
        asset: marketAssets['### FOREX (LIVE FEED) ###'][0],
        duration: defaultDurations[1],
    });
    // Advanced AI Settings
    const [aiModelCount, setAiModelCount] = useState(TOTAL_AI_MODELS);
    const [confidenceThreshold, setConfidenceThreshold] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');
    const [analysisTechniques, setAnalysisTechniques] = useState<string[]>(availableTechniques);
    const [aiPersona, setAiPersona] = useState('standard');
    const [isAdvancedSettingsOpen, setIsAdvancedSettingsOpen] = useState(false);

    // System State
    const [signalData, setSignalData] = useState<SignalData | null>(null);
    const [lastTenResults, setLastTenResults] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isCooldown, setIsCooldown] = useState(false);
    const [cooldownTime, setCooldownTime] = useState(60);
    const [isMarketSyncing, setIsMarketSyncing] = useState(true);
    const [marketSyncTime, setMarketSyncTime] = useState(getRandomSyncTime());
    const [globalError, setGlobalError] = useState('');
    const [analysisStep, setAnalysisStep] = useState(0);
    const [logMessages, setLogMessages] = useState<string[]>([`OMNI-CORE v1.3.0 Initialized. All ${TOTAL_AI_MODELS} models online. Syncing with market data...`]);

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
        const settings: UserSettings = { 
            ...selections, 
            lastTen: lastTenResults,
            aiModelCount,
            confidenceThreshold,
            analysisTechniques,
            aiPersona
        };
        saveUserSettings(db, user.uid, settings);
    }, [db, user.uid, selections, lastTenResults, aiModelCount, confidenceThreshold, analysisTechniques, aiPersona]);

    useEffect(() => {
        loadUserSettings(db, user.uid).then(settings => {
            if (settings) {
                setSelections({
                    broker: settings.broker || brokers[0],
                    asset: settings.asset || marketAssets['### FOREX (LIVE FEED) ###'][0],
                    duration: settings.duration || defaultDurations[1],
                });
                setLastTenResults(settings.lastTen || []);
                setAiModelCount(settings.aiModelCount || TOTAL_AI_MODELS);
                setConfidenceThreshold(settings.confidenceThreshold || 'MEDIUM');
                setAnalysisTechniques(settings.analysisTechniques || availableTechniques);
                setAiPersona(settings.aiPersona || 'standard');
            }
        }).catch(err => setGlobalError(err.message));
    }, [db, user.uid]);
    
    useEffect(() => {
        persistSettings();
    }, [persistSettings]);
    
    useEffect(() => {
        if (!isMarketSyncing || marketSyncTime <= 0) {
            if (isMarketSyncing && marketSyncTime <= 0) {
                setIsMarketSyncing(false);
                setLogMessages(prev => [...prev, 'Market sync complete. System ready for analysis.']);
            }
            return;
        }
        const timerId = setTimeout(() => setMarketSyncTime(prev => prev - 1), 1000);
        return () => clearTimeout(timerId);
    }, [isMarketSyncing, marketSyncTime]);
    
    useEffect(() => {
        if (!isCooldown || cooldownTime <= 0) {
            if (isCooldown && cooldownTime <= 0) {
                setIsCooldown(false);
                setCooldownTime(60);
                setLogMessages(prevLogs => [...prevLogs, 'System cooldown complete. Ready for new analysis.']);
            }
            return;
        };
        const timeoutId = setTimeout(() => setCooldownTime(cooldownTime - 1), 1000);
        return () => clearTimeout(timeoutId);
    }, [isCooldown, cooldownTime]);

    const handleGenerate = async () => {
        setIsLoading(true);
        setGlobalError('');
        setSignalData(null);
        setAnalysisStep(1);
        setLogMessages(['Initiating OMNI-CORE analysis matrix...']);

        const updateProgress = (step: number, message: string) => {
            setAnalysisStep(step);
            setLogMessages(prev => [...prev, `[STEP ${step > 5 ? 5 : step}] ${message}`]);
        };

        try {
            const settings = { aiModelCount, confidenceThreshold, analysisTechniques, aiPersona };
            const aiResponse: AiConsensusResponse = await generateAiSignal(db, user, selections.asset, settings, updateProgress);
            const entryTime = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
            const newSignal: SignalData = {
                broker: brokerMarketMap[selections.broker] || selections.broker,
                asset: selections.asset,
                duration: selections.duration,
                direction: aiResponse.signal,
                time: `${entryTime} (UTC)`,
                riskLevel: aiResponse.riskLevel,
                reason: aiResponse.reason,
            };
            
            setSignalData(newSignal);
            setLogMessages(prev => [...prev, `SIGNAL LOCKED: ${aiResponse.signal}. REASON: ${aiResponse.reason}`]);
            
            await logTrade(db, user, newSignal);

            setLastTenResults(prev => ['S', ...prev].slice(0, 10));
            setCooldownTime(60);
            setIsCooldown(true);
        } catch (error) {
            const errorMessage = (error as Error).message
            setGlobalError(errorMessage);
            setLogMessages(prev => [...prev, `ERROR: Analysis failed. ${errorMessage}`]);
        } finally {
            setIsLoading(false);
            setAnalysisStep(0);
        }
    };
    
    const handleClear = () => {
        setSignalData(null);
        setGlobalError('');
        setIsCooldown(false);
        setCooldownTime(60);
        setIsMarketSyncing(false);
        setMarketSyncTime(getRandomSyncTime());
        setAnalysisStep(0);
        setIsLoading(false);
        setLogMessages([`System manually reset by user. Ready for new analysis.`]);
    };

    const handleTechniqueChange = (technique: string) => {
        setAnalysisTechniques(prev => 
            prev.includes(technique) 
                ? prev.filter(t => t !== technique) 
                : [...prev, technique]
        );
    };

    const analysisSteps = [
        ...(analysisTechniques.includes('Fundamental') ? ['Fundamentals'] : []),
        ...(analysisTechniques.includes('Technical') ? ['Technicals'] : []),
        ...(analysisTechniques.includes('Sentiment') ? ['Sentiment'] : []),
        'User History',
        'AI Consensus'
    ];

    const allDisabled = isLoading || isCooldown || isMarketSyncing;
    const formatTime = (time: number) => `${String(Math.floor(time / 60)).padStart(2, '0')}:${String(time % 60).padStart(2, '0')}`;

    return (
        <div className="animate-fade-in">
            <main className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-2 space-y-4 bg-[var(--bg-secondary)]/50 p-5 rounded-xl shadow-2xl backdrop-blur-lg border border-[var(--border-color)]">
                    <h2 className="text-lg font-semibold border-b border-[var(--border-color)] pb-2 mb-4">Trade Parameters</h2>
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

                    <div className="bg-black/20 rounded-lg border border-[var(--border-color)] p-4 transition-all duration-300">
                        <button onClick={() => setIsAdvancedSettingsOpen(!isAdvancedSettingsOpen)} disabled={allDisabled} className="w-full text-left font-semibold flex justify-between items-center cursor-pointer disabled:cursor-not-allowed">
                            <span>Advanced AI Settings</span>
                            <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-transform duration-300 ${isAdvancedSettingsOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                        </button>
                        {isAdvancedSettingsOpen && (
                            <div className="mt-4 pt-4 border-t border-[var(--border-color)] space-y-5">
                                 <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">AI Analyst Persona</label>
                                    <CustomSelect label="AI Persona" value={aiPersona} onChange={(e) => setAiPersona(e.target.value)} disabled={allDisabled} options={
                                        Object.entries(AI_PERSONAS).map(([key, persona]) => <option key={key} value={key}>{persona.name}</option>)
                                    }/>
                                    <p className="text-xs text-gray-400 mt-2">{AI_PERSONAS[aiPersona].description}</p>
                                </div>
                                <div>
                                    <label htmlFor="ai-models" className="block text-sm font-medium text-gray-300 mb-2">AI Models Consulted: <span className="font-bold text-[var(--text-primary)]">{aiModelCount}</span></label>
                                    <input id="ai-models" type="range" min="1" max={TOTAL_AI_MODELS} value={aiModelCount} onChange={(e) => setAiModelCount(Number(e.target.value))} disabled={allDisabled} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[var(--accent-primary)]" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Confidence Threshold</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {(['LOW', 'MEDIUM', 'HIGH'] as const).map(level => (
                                            <button key={level} onClick={() => setConfidenceThreshold(level)} disabled={allDisabled} className={`px-2 py-2 text-sm font-bold rounded-md transition-all border-2 ${confidenceThreshold === level ? 'bg-[var(--accent-primary)] text-white border-[var(--accent-primary)]' : 'bg-black/20 border-transparent hover:border-white/50'}`}>
                                                {level}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Analysis Techniques</label>
                                    <div className="space-y-2">
                                        {availableTechniques.map(tech => (
                                            <label key={tech} className="flex items-center gap-3 cursor-pointer">
                                                <input type="checkbox" checked={analysisTechniques.includes(tech)} onChange={() => handleTechniqueChange(tech)} disabled={allDisabled} className="h-5 w-5 rounded bg-black/30 border-white/30 text-[var(--accent-primary)] focus:ring-[var(--accent-primary)] cursor-pointer" />
                                                <span className="text-[var(--text-primary)] font-medium">{tech}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="pt-2 flex gap-3">
                        <button onClick={handleGenerate} disabled={allDisabled} className="w-full py-3.5 px-2.5 border-none rounded-lg text-base font-bold cursor-pointer transition-all duration-300 shadow-lg bg-[var(--accent-primary)] text-white disabled:bg-gray-600/80 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-orange-600">
                            {isLoading ? 'ANALYZING...' : isCooldown ? `COOLDOWN (${formatTime(cooldownTime)})` : isMarketSyncing ? `MARKET SYNC (${formatTime(marketSyncTime)})` : '✨ GENERATE SIGNAL'}
                        </button>
                        <button onClick={handleClear} disabled={isLoading} className="w-full py-3.5 px-2.5 border-none rounded-lg text-base font-bold cursor-pointer transition-all duration-300 shadow-lg bg-gray-500 text-white disabled:bg-gray-400/50 disabled:cursor-not-allowed hover:bg-gray-600">
                            CLEAR
                        </button>
                    </div>
                </div>

                <div className="lg:col-span-3 space-y-4 bg-[var(--bg-secondary)]/50 p-5 rounded-xl shadow-2xl backdrop-blur-lg border border-[var(--border-color)]">
                    {globalError && (
                        <div className="bg-red-500/80 text-white p-3 rounded-lg text-center font-bold text-sm border border-red-400">
                            SYSTEM ERROR: {globalError}
                        </div>
                    )}
                    <h2 className="text-lg font-semibold border-b border-[var(--border-color)] pb-2">AI Analysis Matrix</h2>
                    <AnalysisProgress step={analysisStep} steps={analysisSteps} />
                    <SignalCard 
                        signalData={signalData}
                        lastTenResults={lastTenResults}
                        isCooldown={isCooldown}
                        isLoading={isLoading}
                        cooldownTime={cooldownTime}
                    />
                    <h2 className="text-lg font-semibold border-b border-[var(--border-color)] pb-2 pt-2">System Log</h2>
                    <SystemLog messages={logMessages} />
                </div>
            </main>
        </div>
    );
};

export default TraderDashboard;