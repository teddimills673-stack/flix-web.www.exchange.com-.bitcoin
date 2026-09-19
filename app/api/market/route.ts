import { NextResponse } from "next/server";
import { INITIAL_ASSETS } from "@/lib/mockData";

export async function GET() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=15&page=1&sparkline=true&price_change_percentage=1h,24h,7d', {
      headers: { 'Accept': 'application/json' },
      signal: controller.signal,
      next: { revalidate: 30 }
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`CoinGecko API returned status ${res.status}`);
    }

    const data = await res.json();
    
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error("Invalid API response format");
    }

    const formatted = data.map((coin: any) => ({
      id: coin.id || 'unknown',
      name: coin.name || 'Unknown',
      symbol: (coin.symbol || '???').toUpperCase(),
      priceUSD: typeof coin.current_price === 'number' ? coin.current_price : 0.00,
      change1h: coin.price_change_percentage_1h_in_currency || 0,
      change24h: coin.price_change_percentage_24h || 0,
      change7d: coin.price_change_percentage_7d_in_currency || 0,
      marketCap: coin.market_cap || 0,
      volume24h: coin.total_volume || 0,
      circulatingSupply: coin.circulating_supply || 0,
      maxSupply: coin.max_supply || undefined,
      category: (coin.market_cap_rank && coin.market_cap_rank <= 5) ? 'Top Market Cap' : 'Hot',
      iconUrl: coin.image || '',
      sparkline: Array.isArray(coin.sparkline_in_7d?.price) ? coin.sparkline_in_7d.price.slice(-10) : []
    }));

    return NextResponse.json({ status: 'LIVE', source: 'CoinGecko API', assets: formatted });
  } catch (error) {
    // Fallback response with delayed/unavailable status and mock assets
    return NextResponse.json({ 
      status: 'UNAVAILABLE', 
      source: 'Standard Fallback Feed', 
      error: 'Market data temporarily unavailable. Please try again.',
      assets: INITIAL_ASSETS 
    });
  }
}
