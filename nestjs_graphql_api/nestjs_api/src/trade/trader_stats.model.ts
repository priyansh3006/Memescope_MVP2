import { Field, ObjectType,Float } from '@nestjs/graphql';

@ObjectType()
export class TraderStats {
  @Field()
  trader: string;

  @Field(() => Float, { nullable: true }) // Allow null values
  totalProfit?: number; 

  @Field(() => Float, { nullable: true }) // Allow null values
  totalLoss?: number; 
}
