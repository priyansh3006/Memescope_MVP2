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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TradeResolver = void 0;
const graphql_1 = require("@nestjs/graphql");
const trade_service_1 = require("./trade.service");
const trade_model_1 = require("./trade.model");
const trader_stats_model_1 = require("./trader_stats.model");
const trade_model_2 = require("./trade.model");
let TradeResolver = class TradeResolver {
    constructor(tradeService) {
        this.tradeService = tradeService;
    }
    async getTrades() {
        return await this.tradeService.getAllTrades();
    }
    async getTopTradersByProfit(limit) {
        return this.tradeService.getTopTradersByProfit(limit ?? 10);
    }
    async getTopLosingTraders(limit) {
        return this.tradeService.getTopLosingTraders(limit ?? 5);
    }
    async createTrade(price, volume, trader, action) {
        return this.tradeService.createTrade(price, volume, trader, action);
    }
    async getTraderPnL(username) {
        return this.tradeService.getTraderPnL(username);
    }
};
exports.TradeResolver = TradeResolver;
__decorate([
    (0, graphql_1.Query)(() => [trade_model_1.Trade], { nullable: 'items' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TradeResolver.prototype, "getTrades", null);
__decorate([
    (0, graphql_1.Query)(() => [trader_stats_model_1.TraderStats]),
    __param(0, (0, graphql_1.Args)('limit', { type: () => graphql_1.Int, nullable: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], TradeResolver.prototype, "getTopTradersByProfit", null);
__decorate([
    (0, graphql_1.Query)(() => [trader_stats_model_1.TraderStats]),
    __param(0, (0, graphql_1.Args)('limit', { type: () => graphql_1.Int, nullable: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], TradeResolver.prototype, "getTopLosingTraders", null);
__decorate([
    (0, graphql_1.Mutation)(() => trade_model_1.Trade),
    __param(0, (0, graphql_1.Args)('price')),
    __param(1, (0, graphql_1.Args)('volume')),
    __param(2, (0, graphql_1.Args)('trader')),
    __param(3, (0, graphql_1.Args)('action')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, String, String]),
    __metadata("design:returntype", Promise)
], TradeResolver.prototype, "createTrade", null);
__decorate([
    (0, graphql_1.Query)(() => trade_model_2.TraderPnL, { nullable: true }),
    __param(0, (0, graphql_1.Args)('username')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TradeResolver.prototype, "getTraderPnL", null);
exports.TradeResolver = TradeResolver = __decorate([
    (0, graphql_1.Resolver)(() => trade_model_1.Trade),
    __metadata("design:paramtypes", [trade_service_1.TradeService])
], TradeResolver);
//# sourceMappingURL=trade.resolver.js.map