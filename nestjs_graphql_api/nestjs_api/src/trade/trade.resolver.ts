import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { TradeService } from './trade.service';
import { Trade } from './trade.model';
import { TraderStats } from './trader_stats.model';
import { TraderPnL } from './trade.model'; // ✅ Import TraderPnL model

@Resolver(() => Trade)
export class TradeResolver {
  constructor(private readonly tradeService: TradeService) {}

  @Query(() => [Trade], { nullable: 'items' })
  async getTrades(): Promise<Trade[]> {
    return await this.tradeService.getAllTrades();
  }

  @Query(() => [TraderStats])
  async getTopTradersByProfit(@Args('limit', { type: () => Int, nullable: true }) limit?: number): Promise<TraderStats[]> {
    return this.tradeService.getTopTradersByProfit(limit ?? 10); // Default is 10
  }

  @Query(() => [TraderStats])
  async getTopLosingTraders(@Args('limit', { type: () => Int, nullable: true }) limit?: number): Promise<TraderStats[]> {
    return this.tradeService.getTopLosingTraders(limit ?? 5);
  }

  @Mutation(() => Trade)
  async createTrade(
    @Args('price') price: number,
    @Args('volume') volume: number,
    @Args('trader') trader: string,
    @Args('action') action: string,
  ): Promise<Trade> {
    return this.tradeService.createTrade(price, volume, trader, action);
  }

  // ✅ New Query: Get Trader's PnL by Username
  @Query(() => TraderPnL, { nullable: true })
  async getTraderPnL(@Args('username') username: string): Promise<TraderPnL | null> {
    return this.tradeService.getTraderPnL(username);
  }
}
