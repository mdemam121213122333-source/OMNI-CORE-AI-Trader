
export interface SignalData {
  broker: string;
  asset: string;
  duration: string;
  direction: 'CALL' | 'PUT' | '';
  time: string;
  accuracy: string;
  reason: string;
}

export interface UserSettings {
  broker: string;
  asset: string;
  duration: string;
  lastTen: string[];
}

export interface AiConsensusResponse {
    signal: 'CALL' | 'PUT';
    reason: string;
}
