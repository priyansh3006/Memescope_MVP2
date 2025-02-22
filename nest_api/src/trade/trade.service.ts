import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class TradeService {
  /**
   * Cache to store token prices for 5 minutes.
   */
  private priceCache: Record<string, { price: number; timestamp: number }> = {};
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  constructor(private readonly httpService: HttpService) {}

  /**
   * Calculate approximate PnL (in USD) from a list of transactions.
   */
  async calculatePnL(walletAddress: string, transactions: any[]): Promise<number> {
    let pnl = 0;

    for (const tx of transactions) {
      const tokenPrice = await this.fetchTokenPrice(tx.token);
      if (tx.type === 'buy') {
        console.log(` Buying ${tx.amount} of ${tx.token} at ${tokenPrice} USD`);
        pnl -= tx.amount * tokenPrice; // Buying = spending money
      } else if (tx.type === 'sell') {
        console.log(` Selling ${tx.amount} of ${tx.token} at ${tokenPrice} USD`);
        pnl += tx.amount * tokenPrice; // Selling = gaining money
      }
    }

    console.log(` Calculated PnL for wallet ${walletAddress}: ${pnl}`);
    return pnl;
  }

  /**
   * Fetches a token price in USD with caching and fallback.
   */
  async fetchTokenPrice(tokenMint: string): Promise<number> {
    const now = Date.now();

    // Check cache first
    if (this.priceCache[tokenMint] && now - this.priceCache[tokenMint].timestamp < this.CACHE_DURATION) {
      console.log(`Returning cached price for ${tokenMint}: $${this.priceCache[tokenMint].price}`);
      return this.priceCache[tokenMint].price;
    }

    const maxRetries = 3;
    let retryDelay = 1000;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // ---------------------------------
        // Step 1: Try fetching from CoinGecko
        // ---------------------------------
        console.log(` Fetching price from CoinGecko for ${tokenMint}...`);
        const cgPrice = await this.fetchPriceFromCoinGecko(tokenMint);
        if (cgPrice > 0) {
          this.cachePrice(tokenMint, cgPrice);
          return cgPrice;
        }

        // ---------------------------------
        // Step 2: Try Jupiter API as fallback
        // ---------------------------------
        console.warn(`CoinGecko did not return a price. Trying Jupiter API for ${tokenMint}...`);
        const jupPrice = await this.fetchPriceFromJupiter(tokenMint);
        if (jupPrice > 0) {
          this.cachePrice(tokenMint, jupPrice);
          return jupPrice;
        }

      } catch (error) {
        // If rate-limited (429), use exponential backoff
        if (error?.response?.status === 429) {
          console.warn(` [Attempt ${attempt}] Rate-limited fetching price for ${tokenMint}. Retrying in ${retryDelay}ms...`);
          await this.sleep(retryDelay);
          retryDelay *= 2; // Exponential backoff
        } else {
          console.error(` [Attempt ${attempt}] Error fetching price for ${tokenMint}:`, error.message);
          return 0;
        }
      }
    }

    console.error(` Failed to fetch token price for ${tokenMint} after ${maxRetries} attempts`);
    return 0;
  }

  /**
   * Fetches token price from CoinGecko.
   */
  private async fetchPriceFromCoinGecko(tokenMint: string): Promise<number> {
    try {
      const url = `https://api.coingecko.com/api/v3/simple/token_price/solana?contract_addresses=${tokenMint}&vs_currencies=usd`;
      const response = await firstValueFrom(this.httpService.get(url));

      const price = response.data[tokenMint]?.usd ?? 0;
      if (price > 0) {
        console.log(` CoinGecko price for ${tokenMint}: $${price}`);
      }
      return price;
    } catch (error) {
      console.error(` Error fetching price from CoinGecko for ${tokenMint}:`, error.message);
      return 0;
    }
  }

  /**
   * Fetches token price from Jupiter API as a fallback.
   */
  private async fetchPriceFromJupiter(tokenMint: string, vsToken?: string): Promise<number> {
    const baseUrl = 'https://api.jup.ag/price/v2';
    const url = vsToken 
        ? `${baseUrl}?ids=${tokenMint}&vsToken=${vsToken}`
        : `${baseUrl}?ids=${tokenMint}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const priceData = await response.json();

        // Extract the price from the response
        const price = priceData?.data?.[tokenMint]?.price;

        if (price && parseFloat(price) > 0) {
            console.log(` Jupiter price for ${tokenMint}: $${price}`);
            return parseFloat(price);
        } else {
            console.warn(` No valid price found for ${tokenMint} at Jupiter`);
            return 0;
        }
    } catch (error) {
        console.error(` Error fetching price from Jupiter API for ${tokenMint}:`, error.message || error);
        return 0;
    }
}

  /**
   * Caches the token price for 5 minutes.
   */
  private cachePrice(tokenMint: string, price: number) {
    this.priceCache[tokenMint] = { price, timestamp: Date.now() };
    console.log(`🛠 Cached price for ${tokenMint}: $${price}`);
  }

  /**
   * Utility function to delay execution (used for backoff retries).
   */
  private async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
