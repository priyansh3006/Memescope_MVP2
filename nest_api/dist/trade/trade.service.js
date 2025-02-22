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
const axios_1 = require("@nestjs/axios");
const rxjs_1 = require("rxjs");
let TradeService = class TradeService {
    constructor(httpService) {
        this.httpService = httpService;
        this.priceCache = {};
        this.CACHE_DURATION = 5 * 60 * 1000;
    }
    async calculatePnL(walletAddress, transactions) {
        let pnl = 0;
        for (const tx of transactions) {
            const tokenPrice = await this.fetchTokenPrice(tx.token);
            if (tx.type === 'buy') {
                console.log(` Buying ${tx.amount} of ${tx.token} at ${tokenPrice} USD`);
                pnl -= tx.amount * tokenPrice;
            }
            else if (tx.type === 'sell') {
                console.log(` Selling ${tx.amount} of ${tx.token} at ${tokenPrice} USD`);
                pnl += tx.amount * tokenPrice;
            }
        }
        console.log(` Calculated PnL for wallet ${walletAddress}: ${pnl}`);
        return pnl;
    }
    async fetchTokenPrice(tokenMint) {
        const now = Date.now();
        if (this.priceCache[tokenMint] && now - this.priceCache[tokenMint].timestamp < this.CACHE_DURATION) {
            console.log(`Returning cached price for ${tokenMint}: $${this.priceCache[tokenMint].price}`);
            return this.priceCache[tokenMint].price;
        }
        const maxRetries = 3;
        let retryDelay = 1000;
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(` Fetching price from CoinGecko for ${tokenMint}...`);
                const cgPrice = await this.fetchPriceFromCoinGecko(tokenMint);
                if (cgPrice > 0) {
                    this.cachePrice(tokenMint, cgPrice);
                    return cgPrice;
                }
                console.warn(`CoinGecko did not return a price. Trying Jupiter API for ${tokenMint}...`);
                const jupPrice = await this.fetchPriceFromJupiter(tokenMint);
                if (jupPrice > 0) {
                    this.cachePrice(tokenMint, jupPrice);
                    return jupPrice;
                }
            }
            catch (error) {
                if (error?.response?.status === 429) {
                    console.warn(` [Attempt ${attempt}] Rate-limited fetching price for ${tokenMint}. Retrying in ${retryDelay}ms...`);
                    await this.sleep(retryDelay);
                    retryDelay *= 2;
                }
                else {
                    console.error(` [Attempt ${attempt}] Error fetching price for ${tokenMint}:`, error.message);
                    return 0;
                }
            }
        }
        console.error(` Failed to fetch token price for ${tokenMint} after ${maxRetries} attempts`);
        return 0;
    }
    async fetchPriceFromCoinGecko(tokenMint) {
        try {
            const url = `https://api.coingecko.com/api/v3/simple/token_price/solana?contract_addresses=${tokenMint}&vs_currencies=usd`;
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get(url));
            const price = response.data[tokenMint]?.usd ?? 0;
            if (price > 0) {
                console.log(` CoinGecko price for ${tokenMint}: $${price}`);
            }
            return price;
        }
        catch (error) {
            console.error(` Error fetching price from CoinGecko for ${tokenMint}:`, error.message);
            return 0;
        }
    }
    async fetchPriceFromJupiter(tokenMint, vsToken) {
        const baseUrl = 'https://api.jup.ag/price/v2';
        const url = vsToken
            ? `${baseUrl}?ids=${tokenMint}&vsToken=${vsToken}`
            : `${baseUrl}?ids=${tokenMint}`;
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            const priceData = await response.json();
            const price = priceData?.data?.[tokenMint]?.price;
            if (price && parseFloat(price) > 0) {
                console.log(` Jupiter price for ${tokenMint}: $${price}`);
                return parseFloat(price);
            }
            else {
                console.warn(` No valid price found for ${tokenMint} at Jupiter`);
                return 0;
            }
        }
        catch (error) {
            console.error(` Error fetching price from Jupiter API for ${tokenMint}:`, error.message || error);
            return 0;
        }
    }
    cachePrice(tokenMint, price) {
        this.priceCache[tokenMint] = { price, timestamp: Date.now() };
        console.log(`🛠 Cached price for ${tokenMint}: $${price}`);
    }
    async sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
};
exports.TradeService = TradeService;
exports.TradeService = TradeService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [axios_1.HttpService])
], TradeService);
//# sourceMappingURL=trade.service.js.map