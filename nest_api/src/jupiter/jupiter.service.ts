import { Injectable, OnModuleInit } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class JupiterService implements OnModuleInit {
  constructor(private readonly httpService: HttpService) {}

  async onModuleInit() {
    console.log(`✅ JupiterService initialized (using CoinGecko as a fallback).`);
  }

  async getMultipleTokenPrices(tokenSymbols: string[]): Promise<Record<string, number>> {
    console.log(`🔍 Fetching token prices for: ${tokenSymbols.join(', ')}`);

    const tokenIds = tokenSymbols.map(symbol => symbol.toLowerCase()).join(',');
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${tokenIds}&vs_currencies=usd`;

    try {
      const response = await firstValueFrom(this.httpService.get(url));
      console.log(`✅ Token Prices Received:`, response.data);

      const tokenPrices: Record<string, number> = {};
      tokenSymbols.forEach(symbol => {
        tokenPrices[symbol] = response.data[symbol.toLowerCase()]?.usd || 0;
      });

      return tokenPrices;
    } catch (error) {
      console.error(`❌ Error fetching token prices:`, error.message);
      return {};
    }
  }
}
