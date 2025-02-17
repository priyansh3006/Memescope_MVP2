import { ObjectType, Field, Float, Int } from '@nestjs/graphql';

@ObjectType()
export class LeaderboardEntry {  // ✅ Ensure it's exported correctly
  @Field({ nullable: true })
  trader: string;  // ✅ Unique trader ID

  @Field(() => Float) // ✅ Explicitly set the Float type
  totalPnL: number;  // ✅ Total profit/loss for the trader

  @Field(() => Int) // ✅ Explicitly set the Int type
  tradeCount: number;  // ✅ Total number of trades

  @Field(() => String, { nullable: true })  // ✅ Ensure it's explicitly a String type
  timestamp: string;  // ✅ Last updated timestamp
}

@ObjectType()
export class Trade {
  @Field()
  tradeId: string;

  @Field()
  timestamp: string;

  @Field(() => Float)
  price: number;

  @Field(() => Int)
  volume: number;

  @Field()
  trader: string;

  @Field()
  action: string;
}
