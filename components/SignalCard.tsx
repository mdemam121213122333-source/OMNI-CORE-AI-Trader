
import React from 'react';
import { SignalData } from '../types';
import { TOTAL_AI_MODELS } from '../constants';

interface SignalCardProps {
    signalData: SignalData | null;
    lastTenResults: string[];
    isCooldown: boolean;
    isLoading: boolean;
    cooldownTimeFormatted: string;
}

const DetailRow: React.FC<{ label: string, children: React.ReactNode }> = ({ label, children }) => (
    <>
        <span className="text-gray-400 font-medium">{label}:</span>
        <div className="font-semibold text-white break-words">{children}</div>
    </>
);

const SignalCard: React.FC<SignalCardProps> = ({ signalData, lastTenResults, isCooldown, isLoading, cooldownTimeFormatted }) => {
    const isActive = !!signalData || isLoading || isCooldown;

    const getReasonText = () => {
        if (signalData) return signalData.reason;
        if (isLoading) return `OMNI-CORE FUSION Initiating. Synchronizing all ${TOTAL_AI_MODELS} API Keys...`;
        if (isCooldown) return `OMNI-CORE FIELD STABILIZATION: Preparing for next Signal: ${cooldownTimeFormatted}`;
        return `OMNI-CORE System Ready. All ${TOTAL_AI_MODELS} Models Online.`;
    };
    
    const reasonClass = isLoading ? 'text-[#00bcd4]' : isCooldown ? 'text-[#ff4d4d]' : 'text-white';

    const cardClass = `bg-[#1a2c4e]/70 rounded-xl p-5 relative shadow-xl border border-white/10 transition-all duration-500 ${isActive ? 'block' : 'hidden'} overflow-hidden`;
    const borderClass = signalData?.direction === 'CALL' ? 'before:bg-[#00e676]' : signalData?.direction === 'PUT' ? 'before:bg-[#ff3d00]' : 'before:bg-[#ff5733]';
    const fullCardClass = `${cardClass} ${borderClass} before:content-[''] before:absolute before:top-0 before:left-0 before:w-1.5 before:h-full before:rounded-l-xl`;

    return (
        <div className={fullCardClass}>
            <div className="text-center mb-4 text-sm font-bold text-gray-200">
                OMNI-CORE AI TRADER - v1.0.5.20 (81+ API FUSION)
            </div>
            <div className="grid grid-cols-[auto,1fr] gap-x-4 gap-y-3 text-sm">
                <DetailRow label="Broker">{signalData?.broker || '...'}</DetailRow>
                <DetailRow label="Market">{signalData?.asset || '...'}</DetailRow>
                <DetailRow label="Duration">{signalData?.duration || '...'}</DetailRow>
                <DetailRow label="Entry Time">{signalData?.time || '00:00 (UTC+6)'}</DetailRow>
                <DetailRow label="Next Trade">
                    {signalData?.direction === 'CALL' && <span className="inline-block px-3 py-1 text-sm font-bold text-black bg-[#00e676] rounded-full shadow-[0_0_15px_#00e676]">OMNI-CORE: CALL</span>}
                    {signalData?.direction === 'PUT' && <span className="inline-block px-3 py-1 text-sm font-bold text-white bg-[#ff3d00] rounded-full shadow-[0_0_15px_#ff3d00]">OMNI-CORE: PUT</span>}
                </DetailRow>
                <DetailRow label="Accuracy">{signalData?.accuracy || '100.0% ...'}</DetailRow>
                <DetailRow label="Reason"><span className={reasonClass}>{getReasonText()}</span></DetailRow>
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
