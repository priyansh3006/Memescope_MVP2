import { HeliusService } from '../helius/helius.service';
import { DynamoService } from '../config/dynamo.service';
import { LeaderboardEntry } from '../leaderboard/trader.entity';
export declare class LeaderboardResolver {
    private readonly heliusService;
    private readonly dynamoService;
    constructor(heliusService: HeliusService, dynamoService: DynamoService);
    getLeaderboard(): Promise<LeaderboardEntry[]>;
    computeLeaderboard(): Promise<string>;
    addTestEntry(): Promise<string>;
}
