import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { DynamoService } from '../config/dynamo.service';

@Injectable()
export class HeliusService {
  private readonly solanaRpcUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly dynamoService: DynamoService
  ) {
    this.solanaRpcUrl = 'https://api.mainnet-beta.solana.com';
    this.autoUpdateLeaderboard(); // ✅ Automatically update leaderboard every 30 seconds
  }

  /**
   * Automatically fetch transactions and update the leaderboard every 30 seconds.
   */
  private autoUpdateLeaderboard() {
    setInterval(async () => {
      try {
        console.log(`🔄 Auto-updating leaderboard...`);
        await this.computeLeaderboard();
        console.log(`✅ Leaderboard successfully updated!`);
      } catch (error) {
        console.error(`⚠️ Auto-update failed:`, error);
      }
    }, 30000); // ✅ Runs every 30 seconds
  }

  /**
   * Fetch transactions from Solana and compute PnL for each trader.
   */
  async computeLeaderboard() {
    console.log(`🚀 Fetching recent transactions from Solana RPC...`);

    const transactions = await this.getRecentSolanaTransactions();

    for (const tx of transactions) {
      const signature = tx.signature ?? `txn-${Date.now()}`;
      const traderId = tx.trader ?? `unknown-trader-${signature.slice(0, 6)}`;
      const totalPnL = tx.price ? (tx.price * tx.volume) : 0; // PnL based on trade volume
      const tradeCount = 1; // Each transaction is counted as a trade
      const timestamp = tx.blockTime ? Number(tx.blockTime) : Date.now();
      console.log(`📌 Processing Trader: ${traderId}, PnL: ${totalPnL}, Signature: ${signature}`);

      await this.dynamoService.saveTraderPnL(
        signature, 
        traderId, 
        totalPnL, 
        tradeCount, 
        timestamp.toString()
      );
    }

    return "Leaderboard updated with unknown traders!";
  }

  //Get Leaderboard from DynamoDB
  async getLeaderboard() {
    const leaderboard = await this.dynamoService.fetchLeaderboard();
    
    return leaderboard
      .filter(entry => entry.traderId?.S) // Only process entries with valid trader IDs
      .map(entry => {
        // Normalize timestamp to milliseconds
        const timestampNum = parseInt(entry.timestamp?.N ?? '0', 10);
        const timestamp = new Date(
          timestampNum < 1e12 ? timestampNum * 1000 : timestampNum
        ).toISOString();

        return {
          trader: entry.traderId.S,
          totalPnL: parseFloat(entry.totalPnL?.N ?? '0'),
          tradeCount: parseInt(entry.tradeCount?.N ?? '0', 10),
          timestamp
        };
      });
  }
  
  

  /**
   * Fetch recent transactions from Solana RPC.
   */
  async getRecentSolanaTransactions(limit = 10) {
    const requestBody = {
      jsonrpc: '2.0',
      id: 1,
      method: 'getSignaturesForAddress',
      params: [
        '11111111111111111111111111111111', // 🔄 Replace with actual Solana program or wallet address
        { limit },
      ],
    };

    try {
      console.log(`🔄 Requesting latest ${limit} transactions from Solana RPC...`);

      const response = await lastValueFrom(this.httpService.post(this.solanaRpcUrl, requestBody));

      if (!response.data.result) {
        throw new Error('Invalid response from Solana RPC');
      }

      return response.data.result.map(tx => ({
        signature: tx.signature,
        slot: tx.slot,
        blockTime: tx.blockTime || null,
        trader: tx.accountKeys ? tx.accountKeys[0] : `unknown-trader-${tx.signature.slice(0, 6)}`, // Extract trader if available
        price: tx.price || 0, // Replace with actual data from parsed transactions
        volume: tx.volume || 1,
        action: tx.action || 'buy', // Default action as buy
      }));
    } catch (error) {
      console.error('⚠️ Error fetching transactions from Solana RPC:', error);
      throw new Error('Solana RPC Fetch Error');
    }
  }
}
