import { Injectable, OnModuleInit } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ConfigService } from '../config/config.service';

@Injectable()
export class HeliusService implements OnModuleInit {
  private heliusApiKey: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    this.heliusApiKey = await this.configService.getHeliusAPIKey();
    console.log(` HeliusService initialized with API Key: ${this.heliusApiKey.slice(0, 5)}...`);
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async getTopHolders(tokenMint: string): Promise<string[]> {
    console.log(` Fetching top holders for token: ${tokenMint}`);
    this.heliusApiKey = await this.configService.getHeliusAPIKey(); 
    console.log(` Helius API Key: ${this.heliusApiKey}`);
    const url = `https://mainnet.helius-rpc.com/?api-key=${this.heliusApiKey}`;
    const body = {
      jsonrpc: '2.0',
      id: 1,
      method: 'getTokenLargestAccounts',
      params: [tokenMint],
    };

    try {
      const response = await firstValueFrom(this.httpService.post(url, body));
      console.log(' Full Helius API Response:', JSON.stringify(response.data, null, 2));

      if (!response.data?.result?.value) {
        console.warn('Unexpected Helius API response format:', response.data);
        return [];
      }

      const holders = response.data.result.value.map((holder) => holder.address);
      console.log(` Successfully fetched ${holders.length} holders.`);
      return holders;
    } catch (error) {
      console.error(' Error fetching top holders from Helius:', error.message);
      return [];
    }
  }

  async getWalletTransactions(walletAddress: string, limit = 10): Promise<any[]> {
    console.log(` Fetching transactions for wallet: ${walletAddress}`);
  
    const url = `https://mainnet.helius-rpc.com/?api-key=${this.heliusApiKey}`;
    const body = {
      jsonrpc: '2.0',
      id: 1,
      method: 'getSignaturesForAddress',
      params: [walletAddress, { limit }],
    };
  
    try {
      const response = await firstValueFrom(this.httpService.post(url, body));
      const signatures = response.data.result;
  
      if (!signatures || signatures.length === 0) {
        console.warn(` No transactions found for wallet: ${walletAddress}`);
        return [];
      }
  
      console.log(` Found ${signatures.length} transactions.`);
  
      // Fetch full transaction details for each signature with a delay
      const transactions: any[] = [];
      for (const signature of signatures) {
        try {
          const txBody = {
            jsonrpc: '2.0',
            id: 1,
            method: 'getTransaction',
            params: [
              signature.signature, // Transaction signature
              {
                maxSupportedTransactionVersion: 0, // Add this parameter
              },
            ],
          };
          const txResponse = await firstValueFrom(this.httpService.post(url, txBody));
  
          // Log the full transaction response
          console.log(' Full transaction response:', JSON.stringify(txResponse.data, null, 2));
  
          if (!txResponse.data.result) {
            console.warn(` No transaction data found for signature: ${signature.signature}`);
            continue;
          }
  
          transactions.push(txResponse.data.result);
        } catch (error) {
          console.error(` Error fetching transaction for signature ${signature.signature}:`, error.message);
          continue;
        }
  
        // Add a delay of 500ms between each API call
        await this.sleep(500);
      }
  
      await this.sleep(1000); // 1 second delay
  
      return this.extractBuySellTransactions(transactions);
    } catch (error) {
      console.error(` Error fetching transactions for ${walletAddress}:`, error.message);
      return [];
    }
  }


  private extractBuySellTransactions(transactions: any[]): any[] {
    const buySellTransactions: any[] = [];

    for (const tx of transactions) {
        if (!tx.meta?.preTokenBalances || tx.meta.preTokenBalances.length === 0) continue;

        const tokenBalances = tx.meta.preTokenBalances;
        const postTokenBalances = tx.meta.postTokenBalances || [];

        for (const balance of tokenBalances) {
            const tokenMint = balance.mint;
            const wallet = balance.owner;
            const preAmount = parseFloat(balance.uiTokenAmount.amount);

            // Find corresponding post-balance for the same wallet and token
            const postBalance = postTokenBalances.find(pb => pb.owner === wallet && pb.mint === tokenMint);
            const postAmount = postBalance ? parseFloat(postBalance.uiTokenAmount.amount) : 0;

            const amountDiff = postAmount - preAmount; //  Correct calculation

            if (amountDiff > 0) {
                // Buy Transaction
                buySellTransactions.push({
                    wallet,
                    type: "buy",
                    token: tokenMint,
                    amount: amountDiff,
                    price: 0,
                    timestamp: tx.blockTime * 1000,
                });
            } else if (amountDiff < 0) {
                //  Sell Transaction
                buySellTransactions.push({
                    wallet,
                    type: "sell",
                    token: tokenMint,
                    amount: Math.abs(amountDiff),
                    price: 0,
                    timestamp: tx.blockTime * 1000,
                });
            }
        }
    }

    console.log(` Extracted ${buySellTransactions.length} buy/sell transactions.`);
    return buySellTransactions;
}

  // private extractBuySellTransactions(transactions: any[]): any[] {
  //   const buySellTransactions: any[] = [];

  //   for (const tx of transactions) {
  //     if (!tx.meta?.preTokenBalances || tx.meta.preTokenBalances.length === 0) continue;

  //     for (const balance of tx.meta.preTokenBalances) {
  //       buySellTransactions.push({
  //         wallet: balance.owner,
  //         type: balance.uiTokenAmount.amount > 0 ? 'buy' : 'sell',
  //         token: balance.mint,
  //         amount: Math.abs(balance.uiTokenAmount.amount),
  //         price: 0,
  //         timestamp: tx.blockTime * 1000,
  //       });
  //     }
  //   }

  //   console.log(` Extracted ${buySellTransactions.length} buy/sell transactions.`);
  //   return buySellTransactions;
  // }
}