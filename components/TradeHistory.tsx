import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Firestore } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { getHistoricalTrades, getPostTradeAnalysis, updateTradeOutcome } from '../services/apiService';
import { TradeLog, TradeOutcome } from '../types';
import Modal from './Modal';

interface TradeHistoryProps {
    db: Firestore;
    user: User;
}

const TradeHistory: React.FC<TradeHistoryProps> = ({ db, user }) => {
    const [allTrades, setAllTrades] = useState<TradeLog[]>([]);
    const [displayTrades, setDisplayTrades] = useState<TradeLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isAnalysisLoading, setIsAnalysisLoading] = useState(false);

    const [assetFilter, setAssetFilter] = useState('ALL');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const [currentPage, setCurrentPage] = useState(1);
    const tradesPerPage = 10;
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalContent, setModalContent] = useState({ title: '', body: '' });

    const uniqueAssets = useMemo(() => {
        const assets = new Set(allTrades.map(trade => trade.asset));
        return ['ALL', ...Array.from(assets)];
    }, [allTrades]);

    const fetchAndSetTrades = useCallback(async (filters: { asset?: string; startDate?: Date; endDate?: Date } = {}) => {
        setLoading(true);
        setError('');
        try {
            const data = await getHistoricalTrades(db, user.uid, filters);
            if (Object.keys(filters).length === 0) {
                setAllTrades(data);
                setDisplayTrades(data);
            } else {
                setDisplayTrades(data);
            }
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    }, [db, user.uid]);

    useEffect(() => {
        fetchAndSetTrades();
    }, [fetchAndSetTrades]);
    
    const handleSetOutcome = async (trade: TradeLog, outcome: TradeOutcome) => {
        if (trade.outcome !== 'PENDING') return;

        setIsAnalysisLoading(true);
        setModalContent({ title: "Analyzing Trade Outcome...", body: "Please wait while OMNI-CORE reviews the market data for this trade..." });
        setIsModalOpen(true);
        try {
            const analysis = await getPostTradeAnalysis(trade, outcome);
            await updateTradeOutcome(db, user.uid, trade.id, outcome, analysis);
            
            // Optimistically update UI
            const updateTrades = (trades: TradeLog[]) => trades.map(t => t.id === trade.id ? {...t, outcome, postTradeAnalysis: analysis} : t);
            setAllTrades(updateTrades);
            setDisplayTrades(updateTrades);

            setModalContent({ title: `Post-Trade Analysis (${outcome})`, body: analysis });
        } catch (e) {
            setError((e as Error).message);
            setIsModalOpen(false);
        } finally {
            setIsAnalysisLoading(false);
        }
    };
    
    const handleViewAnalysis = (trade: TradeLog) => {
        setModalContent({ title: `Post-Trade Analysis (${trade.outcome})`, body: trade.postTradeAnalysis || "No analysis available." });
        setIsModalOpen(true);
    };

    const handleFilter = () => {
        const filters = {
            asset: assetFilter,
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
        };
        setCurrentPage(1);
        fetchAndSetTrades(filters);
    };

    const handleReset = () => {
        setAssetFilter('ALL');
        setStartDate('');
        setEndDate('');
        setCurrentPage(1);
        setDisplayTrades(allTrades);
    };

    const indexOfLastTrade = currentPage * tradesPerPage;
    const indexOfFirstTrade = indexOfLastTrade - tradesPerPage;
    const currentTrades = displayTrades.slice(indexOfFirstTrade, indexOfLastTrade);
    const totalPages = Math.ceil(displayTrades.length / tradesPerPage);

    const paginate = (pageNumber: number) => {
        if (pageNumber < 1 || pageNumber > totalPages) return;
        setCurrentPage(pageNumber);
    };
    
    const renderPagination = () => {
        if (totalPages <= 1) return null;
        return (
            <div className="flex justify-center items-center gap-2 mt-4 text-[var(--text-primary)]">
                <button onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1} className="px-4 py-2 bg-black/30 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/10 transition-colors">Prev</button>
                <span className="font-semibold">Page {currentPage} of {totalPages}</span>
                <button onClick={() => paginate(currentPage + 1)} disabled={currentPage === totalPages} className="px-4 py-2 bg-black/30 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/10 transition-colors">Next</button>
            </div>
        );
    };

    const OutcomeBadge: React.FC<{ outcome: TradeOutcome }> = ({ outcome }) => {
        const styles = {
            WIN: 'bg-green-500/20 text-green-400 border-green-500',
            LOSS: 'bg-red-500/20 text-red-400 border-red-500',
            PUSH: 'bg-yellow-500/20 text-yellow-400 border-yellow-500',
            PENDING: 'bg-gray-500/20 text-gray-400 border-gray-500',
        };
        return <span className={`px-2 py-1 text-xs font-bold rounded-full border ${styles[outcome]}`}>{outcome}</span>
    };

    return (
        <div className="space-y-4 bg-[var(--bg-secondary)]/50 p-5 rounded-xl shadow-2xl backdrop-blur-lg border border-[var(--border-color)] animate-fade-in">
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end p-4 bg-black/20 rounded-lg border border-[var(--border-color)]">
                 <div>
                    <label htmlFor="asset-filter" className="block text-sm font-medium text-gray-400 mb-1">Asset</label>
                    <select id="asset-filter" value={assetFilter} onChange={e => setAssetFilter(e.target.value)} className="w-full bg-black/30 rounded-lg border border-[var(--border-color)] shadow-inner px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]">
                        {uniqueAssets.map(asset => <option key={asset} value={asset}>{asset.replace(' (Live Feed)', '')}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="start-date" className="block text-sm font-medium text-gray-400 mb-1">Start Date</label>
                    <input id="start-date" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full bg-black/30 rounded-lg border border-[var(--border-color)] shadow-inner px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]" />
                </div>
                <div>
                    <label htmlFor="end-date" className="block text-sm font-medium text-gray-400 mb-1">End Date</label>
                    <input id="end-date" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full bg-black/30 rounded-lg border border-[var(--border-color)] shadow-inner px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]" />
                </div>
                <div className="flex gap-2">
                    <button onClick={handleFilter} className="w-full py-2 bg-[var(--accent-primary)] rounded-lg font-bold text-white hover:opacity-80 transition-opacity">Filter</button>
                    <button onClick={handleReset} className="w-full py-2 bg-gray-500 rounded-lg font-bold text-white hover:bg-gray-600 transition-colors">Reset</button>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-300">
                    <thead className="text-xs text-gray-400 uppercase bg-black/30">
                        <tr>
                            <th scope="col" className="px-4 py-3 rounded-tl-lg">Date</th>
                            <th scope="col" className="px-4 py-3">Asset</th>
                            <th scope="col" className="px-4 py-3">Direction</th>
                            <th scope="col" className="px-4 py-3">Outcome</th>
                            <th scope="col" className="px-4 py-3 rounded-tr-lg">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={5} className="text-center py-8 text-lg animate-pulse">Loading Trade History...</td></tr>
                        ) : error ? (
                            <tr><td colSpan={5} className="text-center py-8 text-red-500">{error}</td></tr>
                        ) : currentTrades.length > 0 ? (
                            currentTrades.map(trade => (
                                <tr key={trade.id} className="border-b border-[var(--border-color)] hover:bg-white/5 transition-colors">
                                    <td className="px-4 py-4">{trade.serverTimestamp.toDate().toLocaleString()}</td>
                                    <td className="px-4 py-4 font-medium text-[var(--text-primary)]">{trade.asset}</td>
                                    <td className={`px-4 py-4 font-bold ${trade.direction === 'CALL' ? 'text-green-400' : 'text-red-400'}`}>{trade.direction}</td>
                                    <td className="px-4 py-4"><OutcomeBadge outcome={trade.outcome} /></td>
                                    <td className="px-4 py-4">
                                        {trade.outcome === 'PENDING' ? (
                                            <div className="flex gap-1">
                                                <button onClick={() => handleSetOutcome(trade, 'WIN')} className="px-2 py-1 text-xs font-bold bg-green-500/80 rounded hover:bg-green-500">W</button>
                                                <button onClick={() => handleSetOutcome(trade, 'LOSS')} className="px-2 py-1 text-xs font-bold bg-red-500/80 rounded hover:bg-red-500">L</button>
                                                <button onClick={() => handleSetOutcome(trade, 'PUSH')} className="px-2 py-1 text-xs font-bold bg-yellow-500/80 rounded hover:bg-yellow-500">P</button>
                                            </div>
                                        ) : (
                                            <button onClick={() => handleViewAnalysis(trade)} className="px-3 py-1 text-xs font-semibold bg-[var(--accent-secondary)] text-black rounded hover:opacity-80">View Analysis</button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan={5} className="text-center py-8 text-gray-500">No trades found for the selected filters.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
            {renderPagination()}
            <Modal isOpen={isModalOpen} onClose={() => !isAnalysisLoading && setIsModalOpen(false)} title={modalContent.title}>
                 <div className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">
                    {isAnalysisLoading ? (
                        <div className="flex justify-center items-center p-8">
                            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[var(--accent-primary)]"></div>
                        </div>
                    ) : (
                        modalContent.body.split('\n').map((item, key) => {
                            return <span key={key}>{item}<br/></span>
                        })
                    )}
                </div>
            </Modal>
        </div>
    );
};

export default TradeHistory;
