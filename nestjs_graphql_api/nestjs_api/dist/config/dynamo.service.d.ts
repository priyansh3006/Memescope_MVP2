import { LeaderboardEntry } from '../leaderboard/trader.entity';
export declare class DynamoService {
    private readonly client;
    private readonly ssmClient;
    private tableName;
    constructor();
    private loadDynamoDBTableName;
    saveTraderPnL(signature: string, traderId: string, totalPnL: number, tradeCount: number, timestamp: string): Promise<void>;
    fetchLeaderboard(): Promise<Record<string, import("@aws-sdk/client-dynamodb").AttributeValue>[]>;
    getLeaderboard(): Promise<LeaderboardEntry[]>;
}
