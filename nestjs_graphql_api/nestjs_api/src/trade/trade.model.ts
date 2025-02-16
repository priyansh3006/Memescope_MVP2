import { Float, Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class Trade {
  @Field()
  tradeId: string;

  @Field()
  timestamp: string;

  @Field()
  price: number;

  @Field()
  volume: number;

  @Field()
  trader: string;

  @Field()
  action: string;
}


@ObjectType()
export class TraderStats {
  @Field()
  trader: string;

  @Field()
  totalProfit: number;

  @Field()
  totalLoss: number;
}

@ObjectType()
export class TraderPnL {
  @Field(() => Float)
  totalProfit: number;

  @Field(() => Float)
  totalLoss: number;
}