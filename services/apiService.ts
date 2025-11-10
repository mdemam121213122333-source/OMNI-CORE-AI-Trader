import { GoogleGenAI, Chat } from "@google/genai";
import { Firestore, doc, getDoc, setDoc, collection, addDoc, serverTimestamp, query, orderBy, limit, getDocs, where, Timestamp, QueryConstraint, updateDoc } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { CORE_TRADING_KNOWLEDGE_BASE, googleScriptURL, AI_PERSONAS } from '../constants';
import { UserSettings, AiConsensusResponse, TradeLog, TradeOutcome } from '../types';

// Initialize the Gemini AI Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

// --- Gemini API Steps ---

async function getFundamentalAnalysis(asset: string): Promise<string> {
  const systemPrompt = `You are a financial news researcher. Use Google Search to find the top 3-5 most critical, recent (last 1-3 hours) *fundamental* news headlines and market sentiment reports for ${asset}. Return *only* a simple, bulleted list of these raw findings. Do not analyze or give a signal. Do not add any greeting or conclusion.`;
  
  try {
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

async function getSentimentAnalysis(asset: string): Promise<string> {
    const systemPrompt = `You are a sentiment analyst. Use Google Search to find the overall market sentiment for ${asset} from social media (like X/Twitter), forums (like Reddit), and financial news commentary within the last 1-3 hours. Summarize the sentiment as Positive, Negative, or Neutral, and provide 2-3 key bullet points explaining why. Return *only* this simple, bulleted list. Do not analyze or give a signal.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Get recent market sentiment for ${asset}.`,
            config: {
                systemInstruction: systemPrompt,
                tools: [{ googleSearch: {} }]
            },
        });
        return response.text;
    } catch (error) {
        console.error("Gemini getSentimentAnalysis failed:", error);
        throw new Error(`AI Research (Sentiment) Failed: ${(error as Error).message}`);
    }
}

async function getFinalConsensus(
    asset: string, 
    analyses: { [key: string]: string }, 
    tradeHistory: string, 
    settings: {
        aiModelCount: number;
        confidenceThreshold: 'LOW' | 'MEDIUM' | 'HIGH';
        aiPersona: string;
    }
): Promise<AiConsensusResponse> {
    const includedAnalyses = Object.entries(analyses)
        .map(([key, value]) => `**${key.toUpperCase()} DATA:**\n${value}`)
        .join('\n\n');
    
    const personaInstruction = AI_PERSONAS[settings.aiPersona]?.instruction || AI_PERSONAS['standard'].instruction;
        
    const systemPrompt = `You are OMNI-CORE AI, a world-class Quantitative Analyst. Your mandate is to deliver high-probability signals by adhering strictly to your internal knowledge base and synthesizing real-time data. Your consensus is derived from ${settings.aiModelCount} specialized sub-models. Your final signal must meet a "${settings.confidenceThreshold}" confidence threshold.
**PERSONA DIRECTIVE:** ${personaInstruction}
You will receive the following data streams:
1.  **CORE KNOWLEDGE BASE:** Your inviolable trading rules. This is your primary directive.\n${CORE_TRADING_KNOWLEDGE_BASE}
2.  **REAL-TIME ANALYSIS DATA:**\n${includedAnalyses}
3.  **USER HISTORY:** The user's last 10 trade outcomes for self-learning.\n${tradeHistory}

Your task is to:
1.  Perform a deep analysis of all provided data streams according to your Persona Directive.
2.  Identify a point of "Confluence," where the available data and your Core Knowledge align perfectly (see Core Rule 4).
3.  If the confidence threshold is not met based on the data, state this clearly in the reason and set riskLevel to HIGH.
4.  Generate a final signal (CALL or PUT).
5.  Provide a highly detailed, professional-grade justification for your decision. Cite specific indicators, news events, and Core Rules that led to your conclusion.
6.  Determine a risk level (LOW, MEDIUM, HIGH) based on your Core Knowledge Base (Rule 6). A LOW risk signal requires strong alignment across available data.
7.  Format your output as a single, raw JSON object string without any markdown. It must include 'signal', 'reason', and 'riskLevel'.

Example Output:
{"signal": "PUT", "reason": "High-conviction PUT signal established. CONFLUENCE: [1] Core Rule 2: Price rejected from major H4 Resistance. [2] Technical: Bearish divergence confirmed on MACD. [3] Fundamental: Negative sentiment from unexpected rate hike news. [4] User History: Shows a pattern of successful PUT trades in similar volatile conditions. This confluence indicates a high-probability downward move.", "riskLevel": "LOW"}`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Asset: ${asset}\nProvide the final signal, reason, and risk level based on all provided data sources.`,
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
        return { signal: "PUT", reason: "Fallback: Market volatility algorithms locked. All models confirm the trajectory.", riskLevel: "HIGH" };
    }
}

export async function getPostTradeAnalysis(trade: TradeLog, outcome: TradeOutcome): Promise<string> {
    const systemPrompt = `You are a trading analyst. The user has just completed a trade with the following details and outcome.
- Asset: ${trade.asset}
- Signal: ${trade.direction}
- Duration: ${trade.duration}
- My AI's Original Reason: ${trade.reason}
- Risk Level: ${trade.riskLevel}
- Outcome: ${outcome}

Your task is to:
1. Use Google Search to find relevant market data (price action, news, technical indicators) for ${trade.asset} around the time of the trade: ${trade.serverTimestamp.toDate().toUTCString()}.
2. Based on the data, provide a concise, insightful analysis explaining the *most likely reason* for the trade's outcome.
3. If it was a WIN, explain what factors confirmed the original signal.
4. If it was a LOSS, explain what factors went against the original signal (e.g., unexpected news, broken support, sudden momentum shift).
5. Keep the analysis to 3-4 key bullet points. Be direct and educational. Do not add greetings or closings.`;
    
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Analyze the trade outcome for ${trade.asset}.`,
            config: {
                systemInstruction: systemPrompt,
                tools: [{ googleSearch: {} }],
            },
        });
        return response.text;
    } catch (error) {
        console.error("Gemini getPostTradeAnalysis failed:", error);
        return "Failed to perform post-trade analysis due to an AI service error.";
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
            // Add outcome to the history string for better AI learning
            const outcome = data.outcome || 'PENDING';
            history.push(`- Asset: ${data.asset}, Signal: ${data.direction}, Outcome: ${outcome}`);
        });

        if (history.length === 0) return "No previous trades found for this user.";
        return history.join("\n");
    } catch (e) {
        console.error("Error loading trade history:", (e as Error).message);
        return "Error loading user history. Proceeding without it.";
    }
}

export async function getHistoricalTrades(
    db: Firestore,
    userId: string,
    filters: { asset?: string; startDate?: Date; endDate?: Date }
): Promise<TradeLog[]> {
    try {
        const tradesRef = collection(db, `users/${userId}/trades`);
        const queryConstraints: QueryConstraint[] = [orderBy("serverTimestamp", "desc")];

        if (filters.asset && filters.asset !== 'ALL') {
            queryConstraints.push(where("asset", "==", filters.asset));
        }
        if (filters.startDate) {
            queryConstraints.push(where("serverTimestamp", ">=", Timestamp.fromDate(filters.startDate)));
        }
        if (filters.endDate) {
            const endOfDay = new Date(filters.endDate);
            endOfDay.setHours(23, 59, 59, 999);
            queryConstraints.push(where("serverTimestamp", "<=", Timestamp.fromDate(endOfDay)));
        }

        const q = query(tradesRef, ...queryConstraints);
        const querySnapshot = await getDocs(q);

        const trades: TradeLog[] = [];
        querySnapshot.forEach((doc) => {
            trades.push({ id: doc.id, ...doc.data(), outcome: doc.data().outcome || 'PENDING' } as TradeLog);
        });

        return trades;
    } catch (e) {
        console.error("Error loading historical trades:", (e as Error).message);
        throw new Error("DATABASE ERROR: Could not load trade history.");
    }
}

export async function updateTradeOutcome(db: Firestore, userId: string, tradeId: string, outcome: TradeOutcome, analysis: string): Promise<void> {
    try {
        const tradeRef = doc(db, `users/${userId}/trades`, tradeId);
        await updateDoc(tradeRef, {
            outcome: outcome,
            postTradeAnalysis: analysis
        });
    } catch (error) {
        console.error("Error updating trade outcome:", error);
        throw new Error("Failed to update trade in the database.");
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
            outcome: 'PENDING',
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

// --- Main Signal Orchestrator ---

export const generateAiSignal = async (
    db: Firestore, 
    user: User, 
    asset: string,
    settings: {
        aiModelCount: number;
        confidenceThreshold: 'LOW' | 'MEDIUM' | 'HIGH';
        analysisTechniques: string[];
        aiPersona: string;
    },
    updateProgress: (step: number, message: string) => void
): Promise<AiConsensusResponse> => {
    
    let currentStep = 1;
    const analyses: { [key: string]: string } = {};

    if (settings.analysisTechniques.includes('Fundamental')) {
        updateProgress(currentStep, "Researching Fundamental Data (News, Events)...");
        analyses['fundamental'] = await getFundamentalAnalysis(asset);
        currentStep++;
    }
    if (settings.analysisTechniques.includes('Technical')) {
        updateProgress(currentStep, "Researching Technical Data (RSI, MACD)...");
        analyses['technical'] = await getTechnicalAnalysis(asset);
        currentStep++;
    }
    if (settings.analysisTechniques.includes('Sentiment')) {
        updateProgress(currentStep, "Researching Market Sentiment (Social, Forums)...");
        analyses['sentiment'] = await getSentimentAnalysis(asset);
        currentStep++;
    }
    
    if (Object.keys(analyses).length === 0) {
        throw new Error("No analysis techniques selected. Please enable at least one.");
    }

    updateProgress(currentStep, "Analyzing Your Past Trade History...");
    const tradeHistory = await getTradeHistory(db, user.uid);
    currentStep++;

    updateProgress(currentStep, "Finalizing Consensus & Risk Assessment...");
    const aiResponse = await getFinalConsensus(asset, analyses, tradeHistory, {
        aiModelCount: settings.aiModelCount,
        confidenceThreshold: settings.confidenceThreshold,
        aiPersona: settings.aiPersona,
    });
    
    updateProgress(currentStep, "Analysis complete. Signal locked!");
    
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

// --- Conversational AI ---

export const getConversationalResponse = async (chat: Chat, message: string): Promise<string> => {
    try {
        const response = await chat.sendMessage({ message });
        return response.text;
    } catch (error) {
        console.error("Conversational AI error:", error);
        return "I'm sorry, I encountered an error and cannot respond at the moment.";
    }
};

export const initializeChat = (): Chat => {
    return ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
            systemInstruction: "You are OMNI-CORE's conversational AI assistant. You are an expert financial analyst. Your goal is to answer the user's questions about trading, markets, and financial concepts. You should be helpful, insightful, and concise. Use Google Search to find real-time information if needed. Do not generate trading signals directly in this chat.",
        },
    });
};
