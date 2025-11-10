import { AIPersona } from './types';

// This is your specific Firebase configuration.
export const firebaseConfig = {
    apiKey: "AIzaSyDqn7EAOk5ZRox8f434h6olGFKVV3OgC2M",
    authDomain: "studio-7709176114-55694.firebaseapp.com",
    projectId: "studio-7709176114-55694",
    storageBucket: "studio-7709176114-55694.firebasestorage.app",
    messagingSenderId: "930502380595",
    appId: "1:930502380595:web:39433d99bd641d5c8c6746"
};

export const googleScriptURL = "https://script.google.com/macros/s/AKfycbyOZ4ISBC_m2P5NYDlVwa9UbP8AU3OJZD4pme7P79QPK2WDUyrgywLrtuBcFC4wrwlx/exec";

export const TOTAL_AI_MODELS = 108;

export const CORE_TRADING_KNOWLEDGE_BASE = `
- **Rule 1: The Trend is Your Friend (Primary Rule):** ALWAYS identify the major trend (H1, H4, D1). All signals MUST align with the dominant trend. Never counter-trend unless strong divergence and fundamental news align.
- **Rule 2: Support & Resistance are Key:** Identify major support and resistance levels. A CALL signal is stronger if the price bounces *off* support. A PUT signal is stronger if the price is rejected *from* resistance.
- **Rule 3: News Overrides All:** High-impact news (like CPI, NFP, Interest Rate decisions) causes extreme volatility and overrides all technical indicators. If such news is imminent (within 1 hour) or just occurred (within 30 mins), DO NOT TRADE or signal extreme caution.
- **Rule 4: Confluence is King (100% Accuracy Rule):** Do not rely on one indicator. A 100% accuracy signal requires at least 3 aligning factors (confluence).
    - **Example A (Strong CALL):** 1) Price is at major Daily Support Zone. 2) RSI is Oversold (<30) on H1. 3) Fundamental sentiment is positive.
    - **Example B (Strong PUT):** 1) Price is at major Daily Resistance Zone. 2) MACD shows bearish divergence on H4. 3) A bearish pin bar candle just formed.
- **Rule 5: Volume Confirms Price:** A move on high volume is significant. A move on low volume is often a trap or pullback. Always check if recent price moves are backed by volume.
- **Rule 6: Risk Assessment (Critical):** If Fundamental data (News) conflicts with Technical data (Indicators), the signal is "MEDIUM" or "HIGH" risk. A "LOW" risk (100% accuracy) signal *requires* both fundamentals and technicals to align.
- **Rule 7: Duration Matters:** A signal for "5 Second" is purely technical scalping (based on M1/M5 price action). A signal for "1 Hour" MUST align with the H1/H4 trend.
`;

export const AI_PERSONAS: { [key: string]: AIPersona } = {
  'standard': {
    name: 'OMNI-CORE Standard',
    description: 'Balanced approach using all available data streams equally.',
    instruction: 'You will maintain a balanced, objective analytical approach.'
  },
  'conservative': {
    name: 'Conservative Analyst',
    description: 'Prioritizes capital preservation. Only acts on very high-probability, low-risk setups.',
    instruction: 'You must adopt a highly risk-averse, conservative persona. Your primary goal is capital preservation. You will heavily penalize any conflicting data and only generate a signal if confidence is exceptionally high and the risk is definitively LOW. If there is any doubt, you must state it.'
  },
  'aggressive': {
    name: 'Aggressive Tactician',
    description: 'Seeks high-reward opportunities and is willing to accept higher risk for strong signals.',
    instruction: 'You are an aggressive tactician. You are looking for high-impact opportunities and are willing to accept MEDIUM risk if the confluence of data is strong, even if not perfect. You may give more weight to short-term momentum indicators.'
  },
  'news_trader': {
    name: 'News-Focused Trader',
    description: 'Places a heavy emphasis on fundamental news and market sentiment over technicals.',
    instruction: 'Your analysis must be heavily weighted towards Fundamental (News) and Sentiment data. Technical indicators are secondary and should only be used to confirm the entry point for a fundamentally-driven trade idea. Your reasoning must start with the key news event driving your decision.'
  }
};

export const brokers = [ 'Ultimate Broker (LIVE OMNI-CORE ACTIVE)', 'POCKET OPTION', 'BINOMO', 'OLYMP TRADE', 'IQ OPTION', 'EXPERT OPTION', 'QUOTEX', 'DERIV (Binary/Synthetics)', 'RoboForex (FX/CFD)', 'Exness (FX/CFD)', 'FXTM (FX/CFD)', 'OctaFX (FX/CFD)', 'FUTURES (CME/CBOT)', 'FTX (Crypto Exchange)', 'BYBIT (Derivatives)', 'BINANCE (Global Exchange)', 'TD Ameritrade (US Stocks)' ];

export const marketAssets: { [key: string]: string[] } = { 
    '### FOREX (LIVE FEED) ###': [ 'EUR/USD (Live Feed)', 'GBP/USD (Live Feed)', 'USD/JPY (Live Feed)', 'AUD/USD (Live Feed)', 'USD/CAD (Live Feed)', 'USD/CHF (Live Feed)', 'EUR/GBP (Live Feed)', 'EUR/AUD (Live Feed)', 'GBP/JPY (Live Feed)', 'AUD/NZD (Live Feed)', 'NZD/USD (Live Feed)', 'EUR/NZD (Live Feed)', 'USD/ZAR (Live Feed)', 'USD/TRY (Live Feed)', 'USD/BRL (Live Feed)', 'NZD/CAD (Live Feed)', 'USD/DZD (Live Feed)', 'USD/IDR (Live Feed)', 'USD/EGP (Live Feed)', 'GBP/NZD (Live Feed)', 'USD/PKR (Live Feed)', 'NZD/CHF (Live Feed)', 'CAD/CHF (Live Feed)', 'NZD/JPY (Live Feed)', 'USD/ARS (Live Feed)', 'USD/MXN (Live Feed)', 'USD/INR (Live Feed)', 'USD/NGN (Live Feed)', 'USD/PHP (Live Feed)', 'USD/BDT (Live Feed)', 'GBP/CHF (Live Feed)', 'EUR/CHF (Live Feed)', 'GBP/CAD (Live Feed)', 'GBP/AUD (Live Feed)' ], 
    '### LIVE OTC/CRYPTO MARKET ###': [ 'Bitcoin (Live Feed)', 'Ethereum (Live Feed)', 'Ripple (Live Feed)', 'Cardano (Live Feed)', 'Solana (Live Feed)', 'Dogecoin (Live Feed)', 'Binance Coin (Live Feed)', 'Polkadot (Live Feed)', 'Chainlink (Live Feed)', 'Shiba Inu (Live Feed)', 'Toncoin (Live Feed)', 'Arbitrum (Live Feed)', 'Avalanche (Live Feed)', 'Pepe (Live Feed)', 'Aptos (Live Feed)', 'Beam (Live Feed)', 'Bonk (Live Feed)', 'Hamster Kombat (Live Feed)', 'Notcoin (Live Feed)', 'Trump (Live Feed)', 'Zcash (Live Feed)', 'Ethereum Classic (Live Feed)', 'Cosmos (Live Feed)', 'Axie Infinity (Live Feed)', 'TRON (Live Feed)', 'Decentraland (Live Feed)', 'Bitcoin Cash (Live Feed)', 'Dogwifhat (Live Feed)', 'Celestia (Live Feed)', 'FLOKI (Live Feed)', 'GALA (Live Feed)', 'UNI (Live Feed)', 'XMR (Live Feed)' ], 
    '### LIVE COMMODITIES & INDICES ###': [ 'Gold (Live Feed)', 'Silver (Live Feed)', 'USCrude (Live Feed)', 'UKBrent (Live Feed)', 'Platinum (Live Feed)', 'Copper (Live Feed)', 'Dow Jones (Live Feed)', 'Nikkei 225 (Live Feed)', 'NASDAQ 100 (Live Feed)', 'FTSE 100 (Live Feed)', 'EURO STOXX 50 (Live Feed)', 'Volatility 75 Index (Live Feed)', 'Crash 1000 Index (Live Feed)', 'Step Index (Live Feed)', 'S&P/ASX 200 (Live Feed)', 'Hong Kong 50 (Live Feed)', 'CAC 40 (Live Feed)' ], 
    '### LIVE STOCKS MARKET ###': [ 'Microsoft (Live Feed)', 'Apple (Live Feed)', 'Amazon (Live Feed)', 'Google (Live Feed)', 'Tesla (Live Feed)', 'Intel (Live Feed)', 'Pfizer Inc (Live Feed)', 'American Express (Live Feed)', 'Boeing Company (Live Feed)', 'FACEBOOK INC (Live Feed)', 'Johnson & Johnson (Live Feed)', 'McDonald\'s (Live Feed)' ] 
};

export const brokerMarketMap: { [key: string]: string } = { 'POCKET OPTION': 'POCKET OPTION (OMNI-CORE ACTIVE - $100K FIX)', 'BINOMO': 'BINOMO (OMNI-CORE ACTIVE - $100K FIX)', 'OLYMP TRADE': 'OLYMP TRADE (OMNI-CORE ACTIVE - $100K FIX)', 'IQ OPTION': 'IQ OPTION (OMNI-CORE ACTIVE - $100K FIX)', 'EXPERT OPTION': 'EXPERT OPTION (OMNI-CORE ACTIVE - $100K FIX)', 'QUOTEX': 'QUOTEX (OMNI-CORE ACTIVE - $100K FIX)', 'Ultimate Broker (LIVE OMNI-CORE ACTIVE)': 'Ultimate Singularity Core (OMNI-CORE ACTIVE - $100K FIX)', 'DERIV (Binary/Synthetics)': 'DERIV (OMNI-CORE ACTIVE - $100K FIX)', 'RoboForex (FX/CFD)': 'RoboForex (OMNI-CORE ACTIVE - $100K FIX)', 'Exness (FX/CFD)': 'Exness (OMNI-CORE ACTIVE - $100K FIX)', 'FXTM (FX/CFD)': 'FXTM (OMNI-CORE ACTIVE - $100K FIX)', 'OctaFX (FX/CFD)': 'OctaFX (OMNI-CORE ACTIVE - $100K FIX)', 'FUTURES (CME/CBOT)': 'FUTURES (OMNI-CORE ACTIVE - $100K FIX)', 'FTX (Crypto Exchange)': 'FTX (OMNI-CORE ACTIVE - $100K FIX)', 'BYBIT (Derivatives)': 'BYBIT (OMNI-CORE ACTIVE - $100K FIX)', 'BINANCE (Global Exchange)': 'BINANCE (OMNI-CORE ACTIVE - $100K FIX)', 'TD Ameritrade (US Stocks)': 'TD Ameritrade (OMNI-CORE ACTIVE - $100K FIX)' };

const shortBinaryDurations = ['5 Second', '10 Second', '15 Second', '30 Second', '1 Minute'];
const forexDurations = ['1 Minute', '5 Minute', '15 Minute', '30 Minute', '1 Hour', '4 Hour', 'Daily'];
const cryptoStockDurations = ['5 Minute', '15 Minute', '30 Minute', '1 Hour', '4 Hour', 'Daily'];
export const defaultDurations = ['1 Minute', '30 Second', '5 Second'];

export const brokerDurationsMap: { [key: string]: string[] } = { 
    'Ultimate Broker (LIVE OMNI-CORE ACTIVE)': shortBinaryDurations, 
    'POCKET OPTION': shortBinaryDurations, 
    'BINOMO': shortBinaryDurations, 
    'OLYMP TRADE': shortBinaryDurations, 
    'IQ OPTION': shortBinaryDurations, 
    'EXPERT OPTION': shortBinaryDurations, 
    'QUOTEX': shortBinaryDurations, 
    'DERIV (Binary/Synthetics)': shortBinaryDurations, 
    'RoboForex (FX/CFD)': forexDurations, 
    'Exness (FX/CFD)': forexDurations, 
    'FXTM (FX/CFD)': forexDurations, 
    'OctaFX (FX/CFD)': forexDurations, 
    'FUTURES (CME/CBOT)': defaultDurations.concat(['1 Hour', '4 Hour']), 
    'FTX (Crypto Exchange)': cryptoStockDurations, 
    'BYBIT (Derivatives)': cryptoStockDurations, 
    'BINANCE (Global Exchange)': cryptoStockDurations, 
    'TD Ameritrade (US Stocks)': ['1 Hour', '4 Hour', 'Daily'] 
};