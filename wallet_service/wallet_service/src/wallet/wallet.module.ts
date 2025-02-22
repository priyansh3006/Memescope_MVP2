import { Module } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { WalletResolver } from './wallet.resolver';
import { LoggerService } from '../logger/logger.service';

@Module({
  providers: [WalletService, WalletResolver, LoggerService],
  exports: [WalletService],
})
export class WalletModule {}
