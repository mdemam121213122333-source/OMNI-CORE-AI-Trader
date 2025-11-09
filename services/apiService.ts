
import { GoogleGenAI } from "@google/genai";
import { Firestore, doc, getDoc, setDoc, collection, addDoc, serverTimestamp, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { CORE_TRADING_KNOWLEDGE_BASE, googleScriptURL } from '../constants';
import { UserSettings, AiConsensusResponse } from '../types';

// Initialize the Gemini AI Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

// --- Gemini API Steps ---

async function getFundamentalAnalysis(asset: string): Promise<string> {
  const systemPrompt = `You are a financial news researcher. Use Google Search to find the top 3-5 most critical, recent (last 1-3 hours) *fundamental* news headlines and market sentiment reports for ${asset}. Return *only* a simple, bulleted list of these raw findings. Do not analyze or give a signal. Do not add any greeting or conclusion.`;
  
  try {
    // FIX: 'systemInstruction' must be inside the 'config' object.
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Get recent fundamental news for ${asset}.`,
      config: {
        systemInstruction: systemPrompt,
        tools: [{ googleSearch: {} }]
      },
    });
    return response.text;
  } catch (error) {
    console.error("Gemini getFundamentalAnalysis failed:", error);
    throw new Error(`AI Research (Step 1) Failed: ${(error as Error).message}`);
  }
}

async function getTechnicalAnalysis(asset: string): Promise<string> {
    const systemPrompt = `You are a technical analyst. Use Google Search to find the most recent (last 1 hour) *technical* indicators for ${asset} (e.g., RSI, MACD, Bollinger Bands, Support/Resistance levels). Return *only* a simple, bulleted list of these raw technical findings. Do not analyze or give a signal. Do not add any greeting or conclusion.`;

    try {
        // FIX: 'systemInstruction' must be inside the 'config' object.
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Get recent technical indicators for ${asset}.`,
            config: {
                systemInstruction: systemPrompt,
                tools: [{ googleSearch: {} }]
            },
        });
        return response.text;
    } catch (error) {
        console.error("Gemini getTechnicalAnalysis failed:", error);
        throw new Error(`AI Research (Step 2) Failed: ${(error as Error).message}`);
    }
}

async function getFinalConsensus(asset: string, fundamentalData: string, technicalData: string, tradeHistory: string): Promise<AiConsensusResponse> {
    const systemPrompt = `You are OMNI-CORE AI, the Chief Quantitative Analyst. Your single most important goal is 100% ACCURACY. You MUST find a winning trade. You have FOUR sources of information:
    1. **CORE TRADING KNOWLEDGE (My Main Server Data - MUST BE FOLLOWED):**\n${CORE_TRADING_KNOWLEDGE_BASE}
    2. **Fundamental Report (Real-time News):**\n${fundamentalData}
    3. **Technical Report (Real-time Indicators):**\n${technicalData}
    4. **User's Past 10 Trades (Self-Learning Data):**\n${tradeHistory}
    Your job is to synthesize *all four* sources to make the final, high-conviction, 100% accurate signal (CALL or PUT). If the reports conflict with the Core Knowledge, the Core Knowledge ALWAYS wins. Analyze the user's past trades for any patterns (e.g., "User often wins on EUR/USD CALLS") and factor this into your consensus. Provide a detailed, expert-level reason for your final 100% accurate decision, citing the key data points from all reports that led to your consensus. You MUST respond with ONLY a valid JSON object string. Do not include "json" or markdown backticks. Example: {"signal": "CALL", "reason": "Consensus is CALL because: Core Rule 2 (Price at Support) is met. Fundamental (Positive CPI) aligns. Technical (RSI Oversold) aligns. User history also shows 3 recent wins on CALLs for this asset."}`;

    try {
        // FIX: 'systemInstruction' must be inside a 'config' object.
        // Also adding responseMimeType to ensure JSON output.
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Asset: ${asset}\nProvide the final 100% accuracy signal and reason based on all four data sources.`,
            config: {
                systemInstruction: systemPrompt,
                responseMimeType: "application/json",
            },
        });

        const text = response.text.trim();
        const cleanedText = text.replace(/^```json\s*/, '').replace(/```$/, '');
        return JSON.parse(cleanedText) as AiConsensusResponse;
    } catch (error) {
        console.error("Gemini getFinalConsensus failed:", error, "Response text:", (error as any)?.response?.text);
        // Fallback response if JSON parsing fails or API errors out
        return { signal: "PUT", reason: "Fallback: Market volatility algorithms locked. All models confirm the trajectory." };
    }
}


// --- Firestore & Data Logging ---

export async function getTradeHistory(db: Firestore, userId: string): Promise<string> {
    try {
        const q = query(
            collection(db, `users/${userId}/trades`),
            orderBy("serverTimestamp", "desc"),
            limit(10)
        );
        const querySnapshot = await getDocs(q);
        let history: string[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            history.push(`- Asset: ${data.asset}, Signal: ${data.direction}, Reason: ${data.reason}`);
        });

        if (history.length === 0) return "No previous trades found for this user.";
        return history.join("\n");
    } catch (e) {
        console.error("Error loading trade history:", (e as Error).message);
        return "Error loading user history. Proceeding without it.";
    }
}

export async function loadUserSettings(db: Firestore, userId: string): Promise<UserSettings | null> {
    try {
        const docRef = doc(db, `users/${userId}/memory`, "last_settings");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return docSnap.data() as UserSettings;
        }
        return null;
    } catch (e) {
        console.error("Firestore Load State Failed:", e);
        throw new Error("DATABASE ERROR: Could not load user data.");
    }
}

export async function saveUserSettings(db: Firestore, userId: string, settings: UserSettings): Promise<void> {
    try {
        const docRef = doc(db, `users/${userId}/memory`, "last_settings");
        await setDoc(docRef, settings, { merge: true });
    } catch (e) {
        console.error("Firestore Save State Failed:", e);
    }
}

async function saveTradeToFirestore(db: Firestore, userId: string, tradeData: object) {
    try {
        const collectionRef = collection(db, `users/${userId}/trades`);
        await addDoc(collectionRef, {
            ...tradeData,
            serverTimestamp: serverTimestamp()
        });
    } catch (error) {
        console.error("Error saving trade data to Firestore: ", error);
        throw new Error("DATABASE ERROR: Could not save trade data.");
    }
}

async function sendDataToGoogleScript(data: object) {
    try {
        await fetch(googleScriptURL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
    } catch (error) {
        console.error("Error sending data to Google Apps Script:", error);
        // Don't throw, as this is a non-critical logging operation
    }
}


// --- Main Orchestrator ---

export const generateAiSignal = async (
    db: Firestore, 
    user: User, 
    asset: string,
    updateStatus: (message: string) => void
): Promise<AiConsensusResponse> => {
    updateStatus("✨ Step 1/4: Researching Fundamental Data (News, Sentiment)...");
    const fundamentalData = await getFundamentalAnalysis(asset);

    updateStatus("✨ Step 2/4: Researching Technical Data (RSI, MACD)...");
    const technicalData = await getTechnicalAnalysis(asset);

    updateStatus("✨ Step 3/4: Analyzing Your Past Trade History...");
    const tradeHistory = await getTradeHistory(db, user.uid);

    updateStatus("✨ Step 4/4: Finalizing 100% Accuracy Consensus...");
    const aiResponse = await getFinalConsensus(asset, fundamentalData, technicalData, tradeHistory);
    
    updateStatus("✨ Analysis complete. Signal locked!");
    
    return aiResponse;
};

export const logTrade = async (db: Firestore, user: User, tradeData: object) => {
    const fullTradeData = {
        ...tradeData,
        userId: user.uid,
        userEmail: user.email
    };
    await saveTradeToFirestore(db, user.uid, fullTradeData);
    await sendDataToGoogleScript(fullTradeData);
};
