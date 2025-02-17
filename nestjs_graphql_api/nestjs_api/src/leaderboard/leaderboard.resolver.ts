import { Resolver, Query, Int } from '@nestjs/graphql';
import { HeliusService } from '../helius/helius.service';
import { DynamoService } from '../config/dynamo.service';
import { LeaderboardEntry } from '../leaderboard/trader.entity'; 

@Resolver()
export class LeaderboardResolver {
  constructor(
    private readonly heliusService: HeliusService,
    private readonly dynamoService: DynamoService
  ) {}

  @Query(() => [LeaderboardEntry])
  async getLeaderboard() {
    return this.dynamoService.getLeaderboard();
  }

  @Query(() => String)
  async computeLeaderboard() {
    await this.heliusService.computeLeaderboard();
    return "Leaderboard updated!";
  }
}
