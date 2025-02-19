"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TradeService = void 0;
const common_1 = require("@nestjs/common");
const helius_service_1 = require("../helius/helius.service");
const jupiter_service_1 = require("../jupiter/jupiter.service");
let TradeService = class TradeService {
    constructor(heliusService, jupiterService) {
        this.heliusService = heliusService;
        this.jupiterService = jupiterService;
    }
    async calculatePnL(walletAddress) {
        console.log(`🔍 Fetching transactions for wallet: ${walletAddress}`);
        const transactions = await this.heliusService.getWalletTransactions(walletAddress);
        if (!transactions.length) {
            console.warn(`⚠️ No transactions found for wallet: ${walletAddress}`);
            return 0;
        }
        console.log(`✅ Retrieved ${transactions.length} transactions for wallet: ${walletAddress}`);
        const tokenSet = new Set();
        transactions.forEach(tx => tokenSet.add(tx.token));
        console.log(`🔍 Fetching real-time prices for ${tokenSet.size} tokens...`);
        const tokenPrices = await this.jupiterService.getMultipleTokenPrices(Array.from(tokenSet));
        console.log(`✅ Received prices for ${Object.keys(tokenPrices).length} tokens.`);
        let pnl = 0;
        for (const tx of transactions) {
            const price = tokenPrices[tx.token] || 0;
            if (tx.type === 'buy') {
                pnl -= tx.amount * price;
            }
            else if (tx.type === 'sell') {
                pnl += tx.amount * price;
            }
        }
        console.log(`✅ Calculated PnL for wallet ${walletAddress}: ${pnl}`);
        return pnl;
    }
};
exports.TradeService = TradeService;
exports.TradeService = TradeService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [helius_service_1.HeliusService,
        jupiter_service_1.JupiterService])
], TradeService);
//# sourceMappingURL=trade.service.js.map