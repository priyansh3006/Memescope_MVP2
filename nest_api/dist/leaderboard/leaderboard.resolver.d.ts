import { DynamoService } from '../config/dynamo.service';
declare class LeaderboardResolver {
    private readonly dynamoService;
    constructor(dynamoService: DynamoService);
    getLeaderboard(): Promise<{
        wallet: any;
        pnl: any;
    }[]>;
}
export { LeaderboardResolver };
