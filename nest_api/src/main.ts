import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { HeliusService } from './helius/helius.service';
import { DynamoService } from './config/dynamo.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const heliusService = app.get(HeliusService);
  const dynamoService = app.get(DynamoService);

  // ✅ Correct token mint for SOL (change if needed)
  const tokenMint = 'So11111111111111111111111111111111111111112';

  console.log('🚀 Fetching Top 100 Traders...');
  
  // ✅ Fetch top holders 
  const wallets = await heliusService.getTopHolders(tokenMint);
  
  if (wallets.length === 0) {
    console.error('❌ No traders found.');
    return;
  }

  console.log('✅ Top 100 Traders Retrieved:', wallets);

  console.log('🔍 Storing traders in DynamoDB...');
  await dynamoService.storeTopHolders(wallets);
  console.log('✅ Traders stored successfully!');
}

bootstrap();
