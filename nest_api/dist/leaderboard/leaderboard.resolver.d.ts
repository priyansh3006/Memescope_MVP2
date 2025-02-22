import { DynamoService } from '../config/dynamo.service';
export declare class LeaderboardEntry {
    wallet: string;
    pnl: number;
}
export declare class LeaderboardResolver {
    private readonly dynamoService;
    constructor(dynamoService: DynamoService);
    getLeaderboard(): Promise<LeaderboardEntry[]>;
}
