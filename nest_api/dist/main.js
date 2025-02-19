"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const helius_service_1 = require("./helius/helius.service");
const dynamo_service_1 = require("./config/dynamo.service");
async function bootstrap() {
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule);
    const heliusService = app.get(helius_service_1.HeliusService);
    const dynamoService = app.get(dynamo_service_1.DynamoService);
    const tokenMint = 'So11111111111111111111111111111111111111112';
    console.log('🚀 Fetching Top 100 Traders...');
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
//# sourceMappingURL=main.js.map