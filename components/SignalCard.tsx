
import React from 'react';
import { SignalData } from '../types';
import { TOTAL_AI_MODELS } from '../constants';

interface SignalCardProps {
    signalData: SignalData | null;
    lastTenResults: string[];
    isCooldown: boolean;
    isLoading: boolean;
    cooldownTime: number;
}

const DetailRow: React.FC<{ label: string, value: string | React.ReactNode, className?: string }> = ({ label, value, className = '' }) => (
    <div className={`border-b border-white/10 py-3 ${className}`}>
        <span className="text-sm text-gray-400 font-medium">{label}</span>
        <div className="text-base font-semibold text-white break-words">{value}</div>
    </div>
);

const RiskIndicator: React.FC<{ riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' }> = ({ riskLevel }) => {
    const riskConfig = {
        LOW: { text: 'LOW RISK', color: 'text-green-400', icon: '🛡️' },
        MEDIUM: { text: 'MEDIUM RISK', color: 'text-yellow-400', icon: '⚠️' },
        HIGH: { text: 'HIGH RISK', color: 'text-red-400', icon: '🔥' },
    };

    const config = riskConfig[riskLevel];

    return (
        <div className={`flex items-center gap-1.5 text-xs font-bold ${config.color}`}>
            <span>{config.icon}</span>
            <span>{config.text}</span>
        </div>
    );
};


const SignalCard: React.FC<SignalCardProps> = ({ signalData, lastTenResults, isCooldown, isLoading, cooldownTime }) => {
    const formatTime = (time: number) => `${String(Math.floor(time / 60)).padStart(2, '0')}:${String(time % 60).padStart(2, '0')}`;

    const renderSignalStatus = () => {
        if (signalData) {
            const isCall = signalData.direction === 'CALL';
            const signalClass = isCall ? 'text-[#00e676] bg-[#00e676]/10 border-[#00e676]' : 'text-[#ff3d00] bg-[#ff3d00]/10 border-[#ff3d00]';
            const shadowClass = isCall ? 'shadow-[0_0_20px_theme(colors.green.500)]' : 'shadow-[0_0_20px_theme(colors.red.600)]';
            return (
                <div className={`text-4xl font-black tracking-widest p-4 rounded-lg text-center border-2 ${signalClass} ${shadowClass} animate-pulse`}>
                    {signalData.direction}
                </div>
            );
        }
        if (isLoading) return <div className="text-center text-xl text-[#00bcd4] font-semibold animate-pulse">ANALYZING MARKET DATA...</div>;
        if (isCooldown) return (
            <div className="text-center text-yellow-400 animate-pulse">
                <div className="text-xl font-bold">COOLDOWN ACTIVE</div>
                <div className="text-4xl font-mono mt-1">{formatTime(cooldownTime)}</div>
            </div>
        );
        return <div className="text-center text-gray-400 font-semibold">AWAITING SIGNAL</div>;
    };

    return (
        <div className="bg-[#1a2c4e]/60 rounded-xl p-5 relative shadow-xl border border-white/10 transition-all duration-500 overflow-hidden min-h-[250px] flex flex-col justify-between">
            <div>
                <div className="grid grid-cols-2 gap-x-4">
                    <DetailRow label="Broker" value={signalData?.broker || '...'} />
                    <DetailRow label="Market" value={signalData?.asset || '...'} />
                    <DetailRow label="Duration" value={signalData?.duration || '...'} />
                    <DetailRow label="Entry Time" value={signalData?.time || '...'} />
                </div>
                <div className="mt-4">
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-sm text-gray-400 font-medium">Signal</span>
                        {signalData && <RiskIndicator riskLevel={signalData.riskLevel} />}
                    </div>
                    <div className="text-base font-semibold text-white break-words">
                        {renderSignalStatus()}
                    </div>
                </div>
            </div>

            <div className="mt-5 p-3 rounded-lg text-center bg-black/30 border border-white/20">
                <span className="block text-gray-400 font-medium text-xs mb-2">Previous Signal Status (Last 10):</span>
                <div className="flex flex-wrap justify-center gap-1.5">
                    {lastTenResults.length > 0 ? lastTenResults.map((result, index) => (
                        <span key={index} className={`px-2 py-0.5 rounded-md text-xs font-extrabold border ${result === 'S' ? 'bg-green-500/10 text-green-400 border-green-400' : 'bg-red-500/10 text-red-400 border-red-400'}`}>
                            {result === 'S' ? 'SUCCESS' : 'FAULT'}
                        </span>
                    )) : <span className="text-xs text-gray-500">Awaiting First Trade...</span>}
                </div>
            </div>
        </div>
    );
};

export default SignalCard;