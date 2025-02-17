import { ObjectType, Field, Float, Int } from '@nestjs/graphql';

@ObjectType()
export class LeaderboardEntry {  
  @Field()
  trader: string;  // ✅ Unique trader ID

  @Field()
  totalPnL: number;  // ✅ Total profit/loss for the trader

  @Field()
  tradeCount: number;  // ✅ Total number of trades

  @Field(() => String)  // Explicitly define as String type
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
