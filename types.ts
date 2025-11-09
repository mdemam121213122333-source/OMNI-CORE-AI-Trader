
import { Timestamp } from 'firebase/firestore';

export interface SignalData {
  broker: string;
  asset: string;
  duration: string;
  direction: 'CALL' | 'PUT' | '';
  time: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  reason: string;
}

export interface UserSettings {
  broker: string;
  asset: string;
  duration: string;
  lastTen: string[];
  aiModelCount?: number;
  confidenceThreshold?: 'LOW' | 'MEDIUM' | 'HIGH';
  analysisTechniques?: string[];
}

export interface AiConsensusResponse {
    signal: 'CALL' | 'PUT';
    reason: string;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface TradeLog {
  id: string; // Document ID
  broker: string;
  asset: string;
  duration: string;
  direction: 'CALL' | 'PUT' | '';
  time: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  reason: string;
  serverTimestamp: Timestamp;
}
