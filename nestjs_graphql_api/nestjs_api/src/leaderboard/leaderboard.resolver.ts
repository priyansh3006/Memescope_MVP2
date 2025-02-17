import { Resolver, Query, Mutation, Args, Float, Int } from '@nestjs/graphql';
import { HeliusService } from '../helius/helius.service';
import { DynamoService } from '../config/dynamo.service';
import { LeaderboardEntry,Trade } from '../leaderboard/trader.entity'; 

@Resolver()
export class LeaderboardResolver {
  constructor(
    private readonly heliusService: HeliusService,
    private readonly dynamoService: DynamoService
  ) {}

  @Query(() => [LeaderboardEntry]) // ✅ Ensure GraphQL returns an array of LeaderboardEntry
  async getLeaderboard(): Promise<LeaderboardEntry[]> {
    return await this.dynamoService.getLeaderboard();
  }


  @Query(() => String)
  async computeLeaderboard() {
    await this.heliusService.computeLeaderboard();
    return "Leaderboard updated!";
  }

  @Mutation(() => String)
  async addTestEntry() {
    const testData = {
      signature: "test-signature-" + Date.now(),
      traderId: "test-trader-1",
      totalPnL: 1000.50,
      tradeCount: 5,
      timestamp: Date.now().toString()
    };

    await this.dynamoService.saveTraderPnL(
      testData.signature,
      testData.traderId,
      testData.totalPnL,
      testData.tradeCount,
      testData.timestamp
    );

    return "Test entry added successfully!";
  }
}
