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
exports.JupiterService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const rxjs_1 = require("rxjs");
let JupiterService = class JupiterService {
    constructor(httpService) {
        this.httpService = httpService;
    }
    async onModuleInit() {
        console.log(`✅ JupiterService initialized (using CoinGecko as a fallback).`);
    }
    async getMultipleTokenPrices(tokenSymbols) {
        console.log(`🔍 Fetching token prices for: ${tokenSymbols.join(', ')}`);
        const tokenIds = tokenSymbols.map(symbol => symbol.toLowerCase()).join(',');
        const url = `https://api.coingecko.com/api/v3/simple/price?ids=${tokenIds}&vs_currencies=usd`;
        try {
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get(url));
            console.log(`✅ Token Prices Received:`, response.data);
            const tokenPrices = {};
            tokenSymbols.forEach(symbol => {
                tokenPrices[symbol] = response.data[symbol.toLowerCase()]?.usd || 0;
            });
            return tokenPrices;
        }
        catch (error) {
            console.error(`❌ Error fetching token prices:`, error.message);
            return {};
        }
    }
};
exports.JupiterService = JupiterService;
exports.JupiterService = JupiterService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [axios_1.HttpService])
], JupiterService);
//# sourceMappingURL=jupiter.service.js.map