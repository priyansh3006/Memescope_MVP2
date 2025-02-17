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
exports.HeliusService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const rxjs_1 = require("rxjs");
const dynamo_service_1 = require("../config/dynamo.service");
let HeliusService = class HeliusService {
    constructor(httpService, dynamoService) {
        this.httpService = httpService;
        this.dynamoService = dynamoService;
        this.solanaRpcUrl = 'https://api.mainnet-beta.solana.com';
        this.autoUpdateLeaderboard();
    }
    autoUpdateLeaderboard() {
        setInterval(async () => {
            try {
                console.log(`🔄 Auto-updating leaderboard...`);
                await this.computeLeaderboard();
                console.log(`✅ Leaderboard successfully updated!`);
            }
            catch (error) {
                console.error(`⚠️ Auto-update failed:`, error);
            }
        }, 30000);
    }
    async computeLeaderboard() {
        console.log(`🚀 Fetching recent transactions from Solana RPC...`);
        const transactions = await this.getRecentSolanaTransactions();
        for (const tx of transactions) {
            const signature = tx.signature ?? `txn-${Date.now()}`;
            const traderId = tx.trader ?? `unknown-trader-${signature.slice(0, 6)}`;
            const totalPnL = tx.price ? (tx.price * tx.volume) : 0;
            const tradeCount = 1;
            const timestamp = tx.blockTime ? Number(tx.blockTime) : Date.now();
            console.log(`📌 Processing Trader: ${traderId}, PnL: ${totalPnL}, Signature: ${signature}`);
            await this.dynamoService.saveTraderPnL(signature, traderId, totalPnL, tradeCount, timestamp.toString());
        }
        return "Leaderboard updated with unknown traders!";
    }
    async getLeaderboard() {
        const leaderboard = await this.dynamoService.fetchLeaderboard();
        return leaderboard
            .filter(entry => entry.traderId?.S)
            .map(entry => {
            const timestampNum = parseInt(entry.timestamp?.N ?? '0', 10);
            const timestamp = new Date(timestampNum < 1e12 ? timestampNum * 1000 : timestampNum).toISOString();
            return {
                trader: entry.traderId.S,
                totalPnL: parseFloat(entry.totalPnL?.N ?? '0'),
                tradeCount: parseInt(entry.tradeCount?.N ?? '0', 10),
                timestamp
            };
        });
    }
    async getRecentSolanaTransactions(limit = 10) {
        const requestBody = {
            jsonrpc: '2.0',
            id: 1,
            method: 'getSignaturesForAddress',
            params: [
                '11111111111111111111111111111111',
                { limit },
            ],
        };
        try {
            console.log(`🔄 Requesting latest ${limit} transactions from Solana RPC...`);
            const response = await (0, rxjs_1.lastValueFrom)(this.httpService.post(this.solanaRpcUrl, requestBody));
            if (!response.data.result) {
                throw new Error('Invalid response from Solana RPC');
            }
            return response.data.result.map(tx => ({
                signature: tx.signature,
                slot: tx.slot,
                blockTime: tx.blockTime || null,
                trader: tx.accountKeys ? tx.accountKeys[0] : `unknown-trader-${tx.signature.slice(0, 6)}`,
                price: tx.price || 0,
                volume: tx.volume || 1,
                action: tx.action || 'buy',
            }));
        }
        catch (error) {
            console.error('⚠️ Error fetching transactions from Solana RPC:', error);
            throw new Error('Solana RPC Fetch Error');
        }
    }
};
exports.HeliusService = HeliusService;
exports.HeliusService = HeliusService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [axios_1.HttpService,
        dynamo_service_1.DynamoService])
], HeliusService);
//# sourceMappingURL=helius.service.js.map