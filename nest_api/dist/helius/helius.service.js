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
let HeliusService = class HeliusService {
    constructor(httpService) {
        this.httpService = httpService;
    }
    async onModuleInit() {
        this.heliusApiKey = "0e0c96f0-c9db-4f90-9fff-ba97daa505c3";
        console.log(`✅ HeliusService initialized with API Key: ${this.heliusApiKey.slice(0, 5)}...`);
    }
    async getTopHolders(tokenMint) {
        console.log(`🔍 Fetching top holders for token: ${tokenMint}`);
        const url = `https://mainnet.helius-rpc.com/?api-key=${this.heliusApiKey}`;
        const body = {
            jsonrpc: '2.0',
            id: 1,
            method: 'getTokenLargestAccounts',
            params: [tokenMint],
        };
        try {
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.post(url, body));
            console.log('📌 Full Helius API Response:', JSON.stringify(response.data, null, 2));
            if (!response.data?.result?.value) {
                console.warn('⚠️ Unexpected Helius API response format:', response.data);
                return [];
            }
            const holders = response.data.result.value.map((holder) => holder.address);
            console.log(`✅ Successfully fetched ${holders.length} holders.`);
            return holders;
        }
        catch (error) {
            console.error('❌ Error fetching top holders from Helius:', error.message);
            return [];
        }
    }
    async getWalletTransactions(walletAddress, limit = 100) {
        console.log(`🔍 Fetching transactions for wallet: ${walletAddress}`);
        const url = `https://mainnet.helius-rpc.com/?api-key=${this.heliusApiKey}`;
        const body = {
            jsonrpc: '2.0',
            id: 1,
            method: 'searchTransactions',
            params: {
                account: walletAddress,
                before: null,
                after: null,
                limit: limit,
            },
        };
        try {
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.post(url, body));
            const transactions = response.data.result;
            if (!transactions || transactions.length === 0) {
                console.warn(`⚠️ No transactions found for wallet: ${walletAddress}`);
                return [];
            }
            console.log(`✅ Found ${transactions.length} transactions.`);
            return this.extractBuySellTransactions(transactions);
        }
        catch (error) {
            console.error(`❌ Error fetching transactions for ${walletAddress}:`, error.message);
            return [];
        }
    }
    extractBuySellTransactions(transactions) {
        const buySellTransactions = [];
        for (const tx of transactions) {
            if (!tx.tokenTransfers || tx.tokenTransfers.length === 0)
                continue;
            for (const transfer of tx.tokenTransfers) {
                buySellTransactions.push({
                    wallet: transfer.userAccount,
                    type: transfer.amount > 0 ? 'buy' : 'sell',
                    token: transfer.mint,
                    amount: Math.abs(transfer.amount),
                    price: 0,
                    timestamp: tx.blockTime * 1000,
                });
            }
        }
        console.log(`✅ Extracted ${buySellTransactions.length} buy/sell transactions.`);
        return buySellTransactions;
    }
};
exports.HeliusService = HeliusService;
exports.HeliusService = HeliusService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [axios_1.HttpService])
], HeliusService);
//# sourceMappingURL=helius.service.js.map