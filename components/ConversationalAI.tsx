import React, { useState, useEffect, useRef } from 'react';
import { Chat } from '@google/genai';
import { initializeChat, getConversationalResponse } from '../services/apiService';

interface Message {
    sender: 'user' | 'ai';
    text: string;
}

const ConversationalAI: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { sender: 'ai', text: "Hello! I am OMNI-CORE's analytical assistant. How can I help you with your market analysis today?" }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const chatRef = useRef<Chat | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!chatRef.current) {
            chatRef.current = initializeChat();
        }
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isLoading]);

    const handleSendMessage = async () => {
        if (!inputValue.trim() || isLoading) return;

        const userMessage: Message = { sender: 'user', text: inputValue };
        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setIsLoading(true);
        
        try {
            if (chatRef.current) {
                const aiResponseText = await getConversationalResponse(chatRef.current, inputValue);
                const aiMessage: Message = { sender: 'ai', text: aiResponseText };
                setMessages(prev => [...prev, aiMessage]);
            }
        } catch (error) {
            console.error("Chat API error:", error);
            const errorMessage: Message = { sender: 'ai', text: "Sorry, I'm having trouble connecting right now. Please try again later." };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSendMessage();
        }
    };

    return (
        <>
            {/* Chat Window */}
            <div className={`fixed bottom-20 right-4 w-full max-w-sm rounded-xl shadow-2xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] flex flex-col transition-all duration-300 ease-in-out z-40 ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}>
                {/* Header */}
                <div className="flex justify-between items-center p-3 border-b border-[var(--border-color)]">
                    <h3 className="font-bold text-[var(--text-primary)]">Chat with OMNI-CORE</h3>
                    <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white">&times;</button>
                </div>

                {/* Messages */}
                <div className="flex-1 p-4 overflow-y-auto h-96">
                    <div className="space-y-4">
                        {messages.map((msg, index) => (
                            <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${msg.sender === 'user' ? 'bg-[var(--accent-primary)] text-white' : 'bg-black/30 text-gray-200'}`}>
                                    <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="max-w-xs lg:max-w-md px-4 py-2 rounded-lg bg-black/30 text-gray-200">
                                    <p className="text-sm animate-pulse">OMNI-CORE is typing...</p>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                </div>

                {/* Input */}
                <div className="p-3 border-t border-[var(--border-color)] flex gap-2">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Ask about the market..."
                        disabled={isLoading}
                        className="flex-1 w-full px-4 py-2 bg-black/30 border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
                    />
                    <button onClick={handleSendMessage} disabled={isLoading || !inputValue.trim()} className="px-4 py-2 bg-[var(--accent-primary)] text-white font-bold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed">
                        Send
                    </button>
                </div>
            </div>

            {/* FAB */}
            <button onClick={() => setIsOpen(!isOpen)} className="fixed bottom-4 right-4 w-16 h-16 bg-[var(--accent-primary)] rounded-full text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform duration-200 z-50">
                {isOpen ? (
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                )}
            </button>
        </>
    );
};

export default ConversationalAI;
