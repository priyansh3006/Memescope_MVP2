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
exports.LeaderboardResolver = exports.LeaderboardEntry = void 0;
const graphql_1 = require("@nestjs/graphql");
const dynamo_service_1 = require("../config/dynamo.service");
let LeaderboardEntry = class LeaderboardEntry {
};
exports.LeaderboardEntry = LeaderboardEntry;
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", String)
], LeaderboardEntry.prototype, "wallet", void 0);
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", Number)
], LeaderboardEntry.prototype, "pnl", void 0);
exports.LeaderboardEntry = LeaderboardEntry = __decorate([
    (0, graphql_1.ObjectType)()
], LeaderboardEntry);
let LeaderboardResolver = class LeaderboardResolver {
    constructor(dynamoService) {
        this.dynamoService = dynamoService;
    }
    async getLeaderboard() {
        const leaderboard = this.dynamoService.getInMemoryLeaderboard();
        return leaderboard.map((entry) => ({
            wallet: entry.wallet,
            pnl: entry.pnl,
        }));
    }
};
exports.LeaderboardResolver = LeaderboardResolver;
__decorate([
    (0, graphql_1.Query)(() => [LeaderboardEntry]),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], LeaderboardResolver.prototype, "getLeaderboard", null);
exports.LeaderboardResolver = LeaderboardResolver = __decorate([
    (0, graphql_1.Resolver)(),
    __metadata("design:paramtypes", [dynamo_service_1.DynamoService])
], LeaderboardResolver);
//# sourceMappingURL=leaderboard.resolver.js.map