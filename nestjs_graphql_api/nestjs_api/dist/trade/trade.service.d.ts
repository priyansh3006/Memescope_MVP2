import { Trade } from './trade.model';
import { ConfigService } from '../config/config.service';
import { TraderStats } from './trader_stats.model';
export declare class TradeService {
    private readonly configService;
    private dynamoDB;
    private tableName;
    private readonly logger;
    constructor(configService: ConfigService);
    initializeDynamoDB(): Promise<void>;
    getAllTrades(): Promise<Trade[]>;
    getTopTradersByProfit(limit?: number): Promise<TraderStats[]>;
    getTopLosingTraders(limit?: number): Promise<TraderStats[]>;
    createTrade(price: number, volume: number, trader: string, action: string): Promise<Trade>;
}
