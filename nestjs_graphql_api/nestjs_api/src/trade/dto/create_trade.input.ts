import { InputType, Field, Float, Int } from '@nestjs/graphql';

@InputType()
export class CreateTradeInput {
  @Field(() => Float)
  price: number;

  @Field(() => Int)
  volume: number;

  @Field(() => String)
  trader: string;

  @Field(() => String)
  action: string;
}
