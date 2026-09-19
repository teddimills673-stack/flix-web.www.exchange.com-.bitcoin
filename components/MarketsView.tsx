'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/lib/store';
import { Search, Star, TrendingUp, TrendingDown, ArrowUpDown, ExternalLink } from 'lucide-react';
import { CryptoAsset } from '@/types';
import { INITIAL_ASSETS } from '@/lib/mockData';

const CATEGORIES = [
  'All', 'Favorites', 'Hot', 'Trending', 'Top Market Cap', 
  'DeFi', 'AI Tokens', 'Layer 1', 'Layer 2', 'Meme Coins', 'Stablecoins', 'RWA', 'TradFi'
];

export const MarketsView: React.FC = () => {
  const { setActiveTab } = useApp();
  const [assets, setAssets] = useState<CryptoAsset[]>(INITIAL_ASSETS);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [favorites, setFavorites] = useState<string[]>(['bitcoin', 'ethereum', 'solana']);
  const [apiStatus, setApiStatus] = useState<{ status: string; source: string }>({ status: 'LIVE', source: 'CoinGecko API' });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function fetchMarketData() {
      try {
        const res = await fetch('/api/market');
        const data = await res.json();
        if (data.assets) {
          setAssets(data.assets);
          setApiStatus({ status: data.status, source: data.source });
        }
      } catch (err) {
        console.error("Failed to fetch market data", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchMarketData();
  }, []);

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
  };

  const filteredAssets = assets.filter(asset => {
    const matchesSearch = asset.name.toLowerCase().includes(searchQuery.toLowerCase()) || asset.symbol.toLowerCase().includes(searchQuery.toLowerCase());
    if (selectedCategory === 'Favorites') return matchesSearch && favorites.includes(asset.id);
    if (selectedCategory === 'All') return matchesSearch;
    return matchesSearch && asset.category === selectedCategory;
  });

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* Header & API Status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Institutional Markets</h1>
          <p className="text-xs text-slate-400 mt-1">Real-time cryptocurrency asset prices, volume, and depth data.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl flex items-center gap-2 text-xs">
            <span className={`w-2 h-2 rounded-full ${apiStatus.status === 'LIVE' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
            <span className="text-slate-300 font-mono">Status: <strong className="text-white">{apiStatus.status}</strong> ({apiStatus.source})</span>
          </div>
        </div>
      </div>

      {/* Categories & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Categories scrollable */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 custom-scrollbar">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' 
                  : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search input */}
        <div className="relative w-full md:w-72 shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search coin or symbol..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Markets Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] font-mono text-slate-400 bg-slate-950/50 uppercase">
                <th className="py-3.5 px-4">Asset</th>
                <th className="py-3.5 px-4">Price (USD)</th>
                <th className="py-3.5 px-4">1H Change</th>
                <th className="py-3.5 px-4">24H Change</th>
                <th className="py-3.5 px-4">7D Change</th>
                <th className="py-3.5 px-4">24H Volume</th>
                <th className="py-3.5 px-4">Market Cap</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs font-medium text-slate-200">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500 font-mono">Loading real-time institutional feed...</td>
                </tr>
              ) : filteredAssets.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500 font-mono">No matching crypto assets found.</td>
                </tr>
              ) : (
                filteredAssets.map(asset => {
                  const isFav = favorites.includes(asset.id);
                  return (
                    <tr 
                      key={asset.id} 
                      onClick={() => setActiveTab('trading')}
                      className="hover:bg-slate-800/50 cursor-pointer transition-colors group"
                    >
                      <td className="py-3.5 px-4 flex items-center gap-3">
                        <button onClick={(e) => toggleFavorite(asset.id, e)} className="text-slate-600 hover:text-amber-400">
                          <Star className={`w-4 h-4 ${isFav ? 'fill-amber-400 text-amber-400' : ''}`} />
                        </button>
                        <div className="w-8 h-8 rounded-xl bg-blue-600/20 text-blue-400 font-bold flex items-center justify-center font-mono text-xs">
                          {asset.symbol.slice(0, 3)}
                        </div>
                        <div>
                          <p className="font-bold text-white">{asset.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{asset.symbol}</p>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-white">
                        ${asset.priceUSD >= 1 ? asset.priceUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : asset.priceUSD.toFixed(6)}
                      </td>

                      <td className={`py-3.5 px-4 font-mono ${asset.change1h >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {asset.change1h >= 0 ? '+' : ''}{asset.change1h}%
                      </td>

                      <td className={`py-3.5 px-4 font-mono font-bold ${asset.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {asset.change24h >= 0 ? '+' : ''}{asset.change24h}%
                      </td>

                      <td className={`py-3.5 px-4 font-mono ${asset.change7d >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {asset.change7d >= 0 ? '+' : ''}{asset.change7d}%
                      </td>

                      <td className="py-3.5 px-4 font-mono text-slate-300">
                        ${(asset.volume24h / 1e6).toLocaleString('en-US', { maximumFractionDigits: 1 })}M
                      </td>

                      <td className="py-3.5 px-4 font-mono text-slate-300">
                        ${(asset.marketCap / 1e9).toLocaleString('en-US', { maximumFractionDigits: 2 })}B
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button 
                          onClick={(e) => { e.stopPropagation(); setActiveTab('trading'); }}
                          className="bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white px-3 py-1.5 rounded-xl font-semibold transition-colors"
                        >
                          Trade
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
