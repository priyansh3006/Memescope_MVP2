import { Resolver, Query } from '@nestjs/graphql';
import { DynamoService } from '../config/dynamo.service';
import { LeaderboardEntry } from './leaderboard.model';

@Resolver()
 class LeaderboardResolver {
  constructor(private readonly dynamoService: DynamoService) {}

  /**
   * ✅ Fetches the leaderboard sorted by highest PnL.
   */
  @Query(() => [String], { name: 'getLeaderboard' })
  async getLeaderboard() {
    console.log('📌 Fetching leaderboard from DynamoDB...');
    const leaderboard = await this.dynamoService.getLeaderboard();
    
    if (!leaderboard || leaderboard.length === 0) {
      console.warn('⚠️ No leaderboard data found.');
      return [];
    }

    console.log(`✅ Leaderboard retrieved with ${leaderboard.length} entries.`);
    return leaderboard.map((entry) => ({
      wallet: entry.wallet_address,
      pnl: entry.pnl,
    }));
  }
}

export { LeaderboardResolver };
