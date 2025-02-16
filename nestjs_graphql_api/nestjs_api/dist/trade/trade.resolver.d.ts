import { TradeService } from './trade.service';
import { Trade } from './trade.model';
import { TraderStats } from './trader_stats.model';
import { TraderPnL } from './trade.model';
export declare class TradeResolver {
    private readonly tradeService;
    constructor(tradeService: TradeService);
    getTrades(): Promise<Trade[]>;
    getTopTradersByProfit(limit?: number): Promise<TraderStats[]>;
    getTopLosingTraders(limit?: number): Promise<TraderStats[]>;
    createTrade(price: number, volume: number, trader: string, action: string): Promise<Trade>;
    getTraderPnL(username: string): Promise<TraderPnL | null>;
}
