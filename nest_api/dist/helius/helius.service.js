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
const config_service_1 = require("../config/config.service");
let HeliusService = class HeliusService {
    constructor(httpService, configService) {
        this.httpService = httpService;
        this.configService = configService;
    }
    async onModuleInit() {
        this.heliusApiKey = await this.configService.getHeliusAPIKey();
        console.log(` HeliusService initialized with API Key: ${this.heliusApiKey.slice(0, 5)}...`);
    }
    async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    async getTopHolders(tokenMint) {
        console.log(` Fetching top holders for token: ${tokenMint}`);
        this.heliusApiKey = await this.configService.getHeliusAPIKey();
        console.log(` Helius API Key: ${this.heliusApiKey}`);
        const url = `https://mainnet.helius-rpc.com/?api-key=${this.heliusApiKey}`;
        const body = {
            jsonrpc: '2.0',
            id: 1,
            method: 'getTokenLargestAccounts',
            params: [tokenMint],
        };
        try {
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.post(url, body));
            console.log(' Full Helius API Response:', JSON.stringify(response.data, null, 2));
            if (!response.data?.result?.value) {
                console.warn('Unexpected Helius API response format:', response.data);
                return [];
            }
            const holders = response.data.result.value.map((holder) => holder.address);
            console.log(` Successfully fetched ${holders.length} holders.`);
            return holders;
        }
        catch (error) {
            console.error(' Error fetching top holders from Helius:', error.message);
            return [];
        }
    }
    async getWalletTransactions(walletAddress, limit = 10) {
        console.log(` Fetching transactions for wallet: ${walletAddress}`);
        const url = `https://mainnet.helius-rpc.com/?api-key=${this.heliusApiKey}`;
        const body = {
            jsonrpc: '2.0',
            id: 1,
            method: 'getSignaturesForAddress',
            params: [walletAddress, { limit }],
        };
        try {
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.post(url, body));
            const signatures = response.data.result;
            if (!signatures || signatures.length === 0) {
                console.warn(` No transactions found for wallet: ${walletAddress}`);
                return [];
            }
            console.log(` Found ${signatures.length} transactions.`);
            const transactions = [];
            for (const signature of signatures) {
                try {
                    const txBody = {
                        jsonrpc: '2.0',
                        id: 1,
                        method: 'getTransaction',
                        params: [
                            signature.signature,
                            {
                                maxSupportedTransactionVersion: 0,
                            },
                        ],
                    };
                    const txResponse = await (0, rxjs_1.firstValueFrom)(this.httpService.post(url, txBody));
                    console.log(' Full transaction response:', JSON.stringify(txResponse.data, null, 2));
                    if (!txResponse.data.result) {
                        console.warn(` No transaction data found for signature: ${signature.signature}`);
                        continue;
                    }
                    transactions.push(txResponse.data.result);
                }
                catch (error) {
                    console.error(` Error fetching transaction for signature ${signature.signature}:`, error.message);
                    continue;
                }
                await this.sleep(500);
            }
            await this.sleep(1000);
            return this.extractBuySellTransactions(transactions);
        }
        catch (error) {
            console.error(` Error fetching transactions for ${walletAddress}:`, error.message);
            return [];
        }
    }
    extractBuySellTransactions(transactions) {
        const buySellTransactions = [];
        for (const tx of transactions) {
            if (!tx.meta?.preTokenBalances || tx.meta.preTokenBalances.length === 0)
                continue;
            const tokenBalances = tx.meta.preTokenBalances;
            const postTokenBalances = tx.meta.postTokenBalances || [];
            for (const balance of tokenBalances) {
                const tokenMint = balance.mint;
                const wallet = balance.owner;
                const preAmount = parseFloat(balance.uiTokenAmount.amount);
                const postBalance = postTokenBalances.find(pb => pb.owner === wallet && pb.mint === tokenMint);
                const postAmount = postBalance ? parseFloat(postBalance.uiTokenAmount.amount) : 0;
                const amountDiff = postAmount - preAmount;
                if (amountDiff > 0) {
                    buySellTransactions.push({
                        wallet,
                        type: "buy",
                        token: tokenMint,
                        amount: amountDiff,
                        price: 0,
                        timestamp: tx.blockTime * 1000,
                    });
                }
                else if (amountDiff < 0) {
                    buySellTransactions.push({
                        wallet,
                        type: "sell",
                        token: tokenMint,
                        amount: Math.abs(amountDiff),
                        price: 0,
                        timestamp: tx.blockTime * 1000,
                    });
                }
            }
        }
        console.log(` Extracted ${buySellTransactions.length} buy/sell transactions.`);
        return buySellTransactions;
    }
};
exports.HeliusService = HeliusService;
exports.HeliusService = HeliusService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [axios_1.HttpService,
        config_service_1.ConfigService])
], HeliusService);
//# sourceMappingURL=helius.service.js.map