import { Resolver, Query, ObjectType, Field } from '@nestjs/graphql';
import { DynamoService } from '../config/dynamo.service';

@ObjectType()
export class LeaderboardEntry {
  @Field()
  wallet: string;

  @Field()
  pnl: number;
}

@Resolver()
export class LeaderboardResolver {
  constructor(private readonly dynamoService: DynamoService) {}

  @Query(() => [LeaderboardEntry])
  async getLeaderboard(): Promise<LeaderboardEntry[]> {
    const leaderboard = this.dynamoService.getInMemoryLeaderboard(); // Fetch leaderboard from DynamoDB
    return leaderboard.map((entry) => ({
      wallet: entry.wallet,
      pnl: entry.pnl,
    }));
  }
}
