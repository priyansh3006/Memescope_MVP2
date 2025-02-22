"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const helius_service_1 = require("./helius/helius.service");
const dynamo_service_1 = require("./config/dynamo.service");
const trade_service_1 = require("./trade/trade.service");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.enableCors();
    const heliusService = app.get(helius_service_1.HeliusService);
    const dynamoService = app.get(dynamo_service_1.DynamoService);
    const tradeService = app.get(trade_service_1.TradeService);
    const tokenMint = 'So11111111111111111111111111111111111111112';
    console.log(' Fetching Top Traders...');
    const wallets = await heliusService.getTopHolders(tokenMint);
    if (wallets.length === 0) {
        console.error(' No traders found.');
        await app.close();
        return;
    }
    console.log(' Top 100 Traders Retrieved:', wallets);
    console.log(' Storing traders in DynamoDB...');
    await dynamoService.storeTopHolders(wallets);
    console.log(' Traders stored successfully!');
    const leaderboardData = [];
    console.log(' Calculating PnL for each trader...');
    for (const wallet of wallets) {
        try {
            const transactions = await heliusService.getWalletTransactions(wallet);
            const pnl = await tradeService.calculatePnL(wallet, transactions);
            await dynamoService.updatePnL(wallet, pnl);
            console.log(` PnL updated for ${wallet}: ${pnl}`);
        }
        catch (error) {
            console.error(` Error calculating PnL for ${wallet}:`, error.message);
        }
    }
    await app.listen(3000);
    console.log('✅ API running at http://localhost:3000/graphql');
    console.log('🏆 Current Leaderboard:');
    const currentLeaderboard = dynamoService.getInMemoryLeaderboard();
    console.table(currentLeaderboard);
}
bootstrap().catch((error) => {
    console.error(' Bootstrap Error:', error.message);
});
//# sourceMappingURL=main.js.map