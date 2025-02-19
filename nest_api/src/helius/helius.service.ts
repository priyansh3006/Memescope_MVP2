import { Injectable, OnModuleInit } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class HeliusService implements OnModuleInit {
  private heliusApiKey: string;

  constructor(private readonly httpService: HttpService) {}

  async onModuleInit() {
    this.heliusApiKey = "0e0c96f0-c9db-4f90-9fff-ba97daa505c3"; // ✅ Use hardcoded API key (for now)
    console.log(`✅ HeliusService initialized with API Key: ${this.heliusApiKey.slice(0, 5)}...`);
  }

  /**
   * 🚀 Fetch top token holders from Helius.
   */
  async getTopHolders(tokenMint: string): Promise<string[]> {
    console.log(`🔍 Fetching top holders for token: ${tokenMint}`);

    const url = `https://mainnet.helius-rpc.com/?api-key=${this.heliusApiKey}`;
    const body = {
      jsonrpc: '2.0',
      id: 1,
      method: 'getTokenLargestAccounts',
      params: [tokenMint],
    };

    try {
      const response = await firstValueFrom(this.httpService.post(url, body));

      // ✅ Log full response for debugging
      console.log('📌 Full Helius API Response:', JSON.stringify(response.data, null, 2));

      // ✅ Ensure response is in expected format
      if (!response.data?.result?.value) {
        console.warn('⚠️ Unexpected Helius API response format:', response.data);
        return [];
      }

      // ✅ Extract wallet addresses
      const holders = response.data.result.value.map((holder) => holder.address);
      console.log(`✅ Successfully fetched ${holders.length} holders.`);
      return holders;
    } catch (error) {
      console.error('❌ Error fetching top holders from Helius:', error.message);
      return [];
    }
  }

  /**
   * 🚀 Fetch the last 100 transactions for a wallet.
   */
  async getWalletTransactions(walletAddress: string, limit = 100): Promise<any[]> {
    console.log(`🔍 Fetching transactions for wallet: ${walletAddress}`);

    const url = `https://mainnet.helius-rpc.com/?api-key=${this.heliusApiKey}`;
    const body = {
      jsonrpc: '2.0',
      id: 1,
      method: 'searchTransactions',
      params: {
        account: walletAddress,
        before: null,
        after: null,
        limit: limit,
      },
    };

    try {
      const response = await firstValueFrom(this.httpService.post(url, body));
      const transactions = response.data.result;

      if (!transactions || transactions.length === 0) {
        console.warn(`⚠️ No transactions found for wallet: ${walletAddress}`);
        return [];
      }

      console.log(`✅ Found ${transactions.length} transactions.`);
      return this.extractBuySellTransactions(transactions);
    } catch (error) {
      console.error(`❌ Error fetching transactions for ${walletAddress}:`, error.message);
      return [];
    }
  }

  /**
   * 🚀 Extract buy/sell transactions from raw transaction data.
   */
  private extractBuySellTransactions(transactions: any[]): {
    wallet: string;
    type: string;
    token: string;
    amount: number;
    price: number;
    timestamp: number;
  }[] {
    const buySellTransactions: {
      wallet: string;
      type: string;
      token: string;
      amount: number;
      price: number;
      timestamp: number;
    }[] = [];

    for (const tx of transactions) {
      if (!tx.tokenTransfers || tx.tokenTransfers.length === 0) continue;

      for (const transfer of tx.tokenTransfers) {
        buySellTransactions.push({
          wallet: transfer.userAccount,
          type: transfer.amount > 0 ? 'buy' : 'sell',
          token: transfer.mint,
          amount: Math.abs(transfer.amount),
          price: 0, // ✅ Price will be updated later
          timestamp: tx.blockTime * 1000,
        });
      }
    }

    console.log(`✅ Extracted ${buySellTransactions.length} buy/sell transactions.`);
    return buySellTransactions;
  }
}
