import { Module } from '@nestjs/common';
import { ConfigService } from './config.service';

@Module({
  providers: [ConfigService], // Providing ConfigService
  exports: [ConfigService], //  Exporting so that other modules (like TradeModule) can use it
})
export class ConfigModule {}
