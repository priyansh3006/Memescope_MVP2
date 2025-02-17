import { HttpService } from '@nestjs/axios';
import { DynamoService } from '../config/dynamo.service';
export declare class HeliusService {
    private readonly httpService;
    private readonly dynamoService;
    private readonly solanaRpcUrl;
    constructor(httpService: HttpService, dynamoService: DynamoService);
    private autoUpdateLeaderboard;
    computeLeaderboard(): Promise<string>;
    getLeaderboard(): Promise<{
        trader: string | undefined;
        totalPnL: number;
        tradeCount: number;
        timestamp: string;
    }[]>;
    getRecentSolanaTransactions(): Promise<any>;
}
