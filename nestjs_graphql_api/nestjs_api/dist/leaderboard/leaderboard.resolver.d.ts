import { HeliusService } from '../helius/helius.service';
import { DynamoService } from '../config/dynamo.service';
export declare class LeaderboardResolver {
    private readonly heliusService;
    private readonly dynamoService;
    constructor(heliusService: HeliusService, dynamoService: DynamoService);
    getLeaderboard(): Promise<{
        traderId: string;
        totalPnL: number;
        tradeCount: number;
    }[]>;
    computeLeaderboard(): Promise<string>;
}
