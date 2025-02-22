import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { WalletService } from './wallet.service';

@Resolver()
export class WalletResolver {
  constructor(private walletService: WalletService) {}

  @Mutation(() => Boolean)
  async followWallet(
    @Args('userId') userId: string,
    @Args('address') address: string,
  ) {
    return this.walletService.followWallet(userId, address);
  }

  @Mutation(() => Boolean)
  async unfollowWallet(
    @Args('userId') userId: string,
    @Args('address') address: string,
  ) {
    return this.walletService.unfollowWallet(userId, address);
  }

  @Query(() => [String])
  async getTrackedWallets(@Args('userId') userId: string) {
    return this.walletService.getTrackedWallets(userId);
  }

  @Query(() => [String])
  async discoverNewTraders() {
    return this.walletService.discoverNewTraders();
  }
}
