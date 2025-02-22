import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { HeliusService } from './helius/helius.service';
import { DynamoService } from './config/dynamo.service';
import { TradeService } from './trade/trade.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();

  const heliusService = app.get(HeliusService);
  const dynamoService = app.get(DynamoService);
  const tradeService = app.get(TradeService); //  Add TradeService

  //  Correct token mint for SOL (change if needed)
  const tokenMint = 'So11111111111111111111111111111111111111112';

  console.log(' Fetching Top Traders...');
  
  //  Fetch top holders 
  const wallets = await heliusService.getTopHolders(tokenMint);
  
  if (wallets.length === 0) {
    console.error(' No traders found.');
    await app.close(); //  Close the app if no traders are found
    return;
  }

  console.log(' Top 100 Traders Retrieved:', wallets);

  console.log(' Storing traders in DynamoDB...');
  await dynamoService.storeTopHolders(wallets);
  console.log(' Traders stored successfully!');

  const leaderboardData: { wallet: string; pnl: number }[] = [];
  console.log(' Calculating PnL for each trader...');
  for (const wallet of wallets) {
    try {
      const transactions = await heliusService.getWalletTransactions(wallet);
      const pnl = await tradeService.calculatePnL(wallet, transactions);
      await dynamoService.updatePnL(wallet, pnl);
      console.log(` PnL updated for ${wallet}: ${pnl}`);
    } catch (error) {
      console.error(` Error calculating PnL for ${wallet}:`, error.message);
    }
  }
  await app.listen(3000);
  console.log('✅ API running at http://localhost:3000/graphql');

  // After processing all wallets:
  console.log('🏆 Current Leaderboard:');
  const currentLeaderboard = dynamoService.getInMemoryLeaderboard();
  console.table(currentLeaderboard);
}

bootstrap().catch((error) => {
  console.error(' Bootstrap Error:', error.message);
});