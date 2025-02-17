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
exports.LeaderboardResolver = void 0;
const graphql_1 = require("@nestjs/graphql");
const helius_service_1 = require("../helius/helius.service");
const dynamo_service_1 = require("../config/dynamo.service");
const trader_entity_1 = require("../leaderboard/trader.entity");
let LeaderboardResolver = class LeaderboardResolver {
    constructor(heliusService, dynamoService) {
        this.heliusService = heliusService;
        this.dynamoService = dynamoService;
    }
    async getLeaderboard() {
        return await this.dynamoService.getLeaderboard();
    }
    async computeLeaderboard() {
        await this.heliusService.computeLeaderboard();
        return "Leaderboard updated!";
    }
    async addTestEntry() {
        const testData = {
            signature: "test-signature-" + Date.now(),
            traderId: "test-trader-1",
            totalPnL: 1000.50,
            tradeCount: 5,
            timestamp: Date.now().toString()
        };
        await this.dynamoService.saveTraderPnL(testData.signature, testData.traderId, testData.totalPnL, testData.tradeCount, testData.timestamp);
        return "Test entry added successfully!";
    }
};
exports.LeaderboardResolver = LeaderboardResolver;
__decorate([
    (0, graphql_1.Query)(() => [trader_entity_1.LeaderboardEntry]),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], LeaderboardResolver.prototype, "getLeaderboard", null);
__decorate([
    (0, graphql_1.Query)(() => String),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], LeaderboardResolver.prototype, "computeLeaderboard", null);
__decorate([
    (0, graphql_1.Mutation)(() => String),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], LeaderboardResolver.prototype, "addTestEntry", null);
exports.LeaderboardResolver = LeaderboardResolver = __decorate([
    (0, graphql_1.Resolver)(),
    __metadata("design:paramtypes", [helius_service_1.HeliusService,
        dynamo_service_1.DynamoService])
], LeaderboardResolver);
//# sourceMappingURL=leaderboard.resolver.js.map