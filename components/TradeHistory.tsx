
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Firestore } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { getHistoricalTrades } from '../services/apiService';
import { TradeLog } from '../types';

interface TradeHistoryProps {
    db: Firestore;
    user: User;
}

const TradeHistory: React.FC<TradeHistoryProps> = ({ db, user }) => {
    const [allTrades, setAllTrades] = useState<TradeLog[]>([]);
    const [displayTrades, setDisplayTrades] = useState<TradeLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [assetFilter, setAssetFilter] = useState('ALL');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const [currentPage, setCurrentPage] = useState(1);
    const tradesPerPage = 10;

    const uniqueAssets = useMemo(() => {
        const assets = new Set(allTrades.map(trade => trade.asset));
        return ['ALL', ...Array.from(assets)];
    }, [allTrades]);

    const fetchAndSetTrades = useCallback(async (filters: { asset?: string; startDate?: Date; endDate?: Date } = {}) => {
        setLoading(true);
        setError('');
        try {
            const data = await getHistoricalTrades(db, user.uid, filters);
            setDisplayTrades(data);
            if (Object.keys(filters).length === 0) {
                setAllTrades(data);
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
            <div className="flex justify-center items-center gap-2 mt-4 text-white">
                <button onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1} className="px-4 py-2 bg-black/30 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/10 transition-colors">Prev</button>
                <span className="font-semibold">Page {currentPage} of {totalPages}</span>
                <button onClick={() => paginate(currentPage + 1)} disabled={currentPage === totalPages} className="px-4 py-2 bg-black/30 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/10 transition-colors">Next</button>
            </div>
        );
    };

    return (
        <div className="space-y-4 bg-white/5 p-5 rounded-xl shadow-2xl backdrop-blur-lg border border-white/10 animate-fade-in">
            <h2 className="text-lg font-semibold border-b border-white/10 pb-2 mb-4">Trade History</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end p-4 bg-black/20 rounded-lg border border-white/10">
                <div>
                    <label htmlFor="asset-filter" className="block text-sm font-medium text-gray-400 mb-1">Asset</label>
                    <select id="asset-filter" value={assetFilter} onChange={e => setAssetFilter(e.target.value)} className="w-full bg-black/30 rounded-lg border border-white/10 shadow-inner px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#ff5733]">
                        {uniqueAssets.map(asset => <option key={asset} value={asset}>{asset.replace(' (Live Feed)', '')}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="start-date" className="block text-sm font-medium text-gray-400 mb-1">Start Date</label>
                    <input id="start-date" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full bg-black/30 rounded-lg border border-white/10 shadow-inner px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#ff5733]" />
                </div>
                <div>
                    <label htmlFor="end-date" className="block text-sm font-medium text-gray-400 mb-1">End Date</label>
                    <input id="end-date" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full bg-black/30 rounded-lg border border-white/10 shadow-inner px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#ff5733]" />
                </div>
                <div className="flex gap-2">
                    <button onClick={handleFilter} className="w-full py-2 bg-[#ff5733] rounded-lg font-bold text-white hover:bg-orange-600 transition-colors">Filter</button>
                    <button onClick={handleReset} className="w-full py-2 bg-gray-500 rounded-lg font-bold text-white hover:bg-gray-600 transition-colors">Reset</button>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-300">
                    <thead className="text-xs text-gray-400 uppercase bg-black/30">
                        <tr>
                            <th scope="col" className="px-6 py-3 rounded-tl-lg">Date</th>
                            <th scope="col" className="px-6 py-3">Asset</th>
                            <th scope="col" className="px-6 py-3">Direction</th>
                            <th scope="col" className="px-6 py-3">Duration</th>
                            <th scope="col" className="px-6 py-3">Risk</th>
                            <th scope="col" className="px-6 py-3 rounded-tr-lg hidden md:table-cell">Broker</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={6} className="text-center py-8 text-lg animate-pulse">Loading Trade History...</td></tr>
                        ) : error ? (
                            <tr><td colSpan={6} className="text-center py-8 text-red-500">{error}</td></tr>
                        ) : currentTrades.length > 0 ? (
                            currentTrades.map(trade => (
                                <tr key={trade.id} className="border-b border-white/10 hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4">{trade.serverTimestamp.toDate().toLocaleString()}</td>
                                    <td className="px-6 py-4 font-medium text-white">{trade.asset}</td>
                                    <td className={`px-6 py-4 font-bold ${trade.direction === 'CALL' ? 'text-green-400' : 'text-red-400'}`}>{trade.direction}</td>
                                    <td className="px-6 py-4">{trade.duration}</td>
                                    <td className="px-6 py-4">{trade.riskLevel}</td>
                                    <td className="px-6 py-4 hidden md:table-cell">{trade.broker}</td>
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan={6} className="text-center py-8 text-gray-500">No trades found for the selected filters.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
            {renderPagination()}
        </div>
    );
};

export default TradeHistory;
