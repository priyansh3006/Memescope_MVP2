import { ObjectType, Field, Int } from '@nestjs/graphql';

@ObjectType()
export class TransactionType {
  @Field()
  signature: string;

  @Field(() => Int)
  slot: number;

  @Field(() => Int, { nullable: true })
  blockTime?: number;

  @Field({ nullable: true })
  confirmationStatus?: string;
}

export default TransactionType; // ✅ Explicitly export the class
