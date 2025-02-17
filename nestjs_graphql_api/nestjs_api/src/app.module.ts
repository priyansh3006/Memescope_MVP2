import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { ConfigModule } from '@nestjs/config';
import { HeliusService } from './helius/helius.service';
import { DynamoService } from './config/dynamo.service';
import { LeaderboardResolver } from './leaderboard/leaderboard.resolver';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
    }),
    HttpModule.register({}),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver, // Required in NestJS v10+
      autoSchemaFile: true, //  Automatically generate scheme
      playground: true, // Enables GraphQL Playground UI
    }),
  ],
  providers: [HeliusService, DynamoService, LeaderboardResolver],
})
export class AppModule {}
