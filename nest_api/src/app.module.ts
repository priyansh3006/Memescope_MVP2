import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { TradeService } from './trade/trade.service';
import { HeliusService } from './helius/helius.service';
import { JupiterService } from './jupiter/jupiter.service';
import { LeaderboardResolver } from './leaderboard/leaderboard.resolver';
import { DynamoService } from './config/dynamo.service';
import { ConfigService } from './config/config.service';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,  // ✅ Generates schema automatically
      playground: true,      // ✅ Enables GraphQL Playground
      debug: true,           // ✅ Enables debugging in development
    }),
    ConfigModule.forRoot({ isGlobal: true }), // ✅ Loads environment variables globally
    HttpModule, // ✅ Enables HTTP requests
  ],
  providers: [
    TradeService,   // ✅ Registers TradeService
    HeliusService,  // ✅ Registers HeliusService
    JupiterService, // ✅ Registers JupiterService
    LeaderboardResolver, // ✅ Registers GraphQL resolver
    DynamoService, // ✅ Registers DynamoService
    ConfigService, // ✅ Registers ConfigService
  ],
  exports: [TradeService, HeliusService, JupiterService, DynamoService, ConfigService,LeaderboardResolver], // ✅ Export services if needed
})
export class AppModule {}