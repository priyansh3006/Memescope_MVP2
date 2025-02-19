import { ObjectType, Field, Float } from '@nestjs/graphql';

@ObjectType()
export class LeaderboardEntry {
  @Field()
  wallet_address: string;

  @Field(() => Float)
  pnl: number;
}
