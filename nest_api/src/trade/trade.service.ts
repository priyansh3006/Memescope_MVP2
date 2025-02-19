import { Injectable } from '@nestjs/common';
import { HeliusService } from '../helius/helius.service';
import { JupiterService } from '../jupiter/jupiter.service';

@Injectable()
export class TradeService {
  constructor(
    private readonly heliusService: HeliusService,
    private readonly jupiterService: JupiterService
  ) {}

  /**
   * 🚀 Calculate PnL for a given wallet address.
   */
  async calculatePnL(walletAddress: string): Promise<number> {
    console.log(`🔍 Fetching transactions for wallet: ${walletAddress}`);

    // ✅ Fetch transactions from Helius
    const transactions = await this.heliusService.getWalletTransactions(walletAddress);

    if (!transactions.length) {
      console.warn(`⚠️ No transactions found for wallet: ${walletAddress}`);
      return 0;
    }

    console.log(`✅ Retrieved ${transactions.length} transactions for wallet: ${walletAddress}`);

    // ✅ Collect unique tokens from transactions
    const tokenSet = new Set<string>();
    transactions.forEach(tx => tokenSet.add(tx.token));

    console.log(`🔍 Fetching real-time prices for ${tokenSet.size} tokens...`);

    // ✅ Fetch real-time prices using Jupiter API
    const tokenPrices = await this.jupiterService.getMultipleTokenPrices(Array.from(tokenSet));

    console.log(`✅ Received prices for ${Object.keys(tokenPrices).length} tokens.`);

    // 🚀 Calculate PnL
    let pnl = 0;
    for (const tx of transactions) {
      const price = tokenPrices[tx.token] || 0;
      if (tx.type === 'buy') {
        pnl -= tx.amount * price;
      } else if (tx.type === 'sell') {
        pnl += tx.amount * price;
      }
    }

    console.log(`✅ Calculated PnL for wallet ${walletAddress}: ${pnl}`);
    return pnl;
  }
}
