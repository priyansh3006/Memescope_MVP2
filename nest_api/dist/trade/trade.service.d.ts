import { HttpService } from '@nestjs/axios';
export declare class TradeService {
    private readonly httpService;
    private priceCache;
    private readonly CACHE_DURATION;
    constructor(httpService: HttpService);
    calculatePnL(walletAddress: string, transactions: any[]): Promise<number>;
    fetchTokenPrice(tokenMint: string): Promise<number>;
    private fetchPriceFromCoinGecko;
    private fetchPriceFromJupiter;
    private cachePrice;
    private sleep;
}
