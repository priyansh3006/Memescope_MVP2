import { Module } from '@nestjs/common';
import { TradeResolver } from './trade.resolver';
import { TradeService } from './trade.service';
import { ConfigService } from '../config/config.service'; // Import ConfigService
import { ConfigModule } from '../config/config.module'; // Import ConfigModule

@Module({
    imports: [ConfigModule],
  providers: [TradeResolver, TradeService, ConfigService], // Include ConfigService
  exports: [TradeService, ConfigService], // Export if needed in other modules
})
export class TradeModule {}
