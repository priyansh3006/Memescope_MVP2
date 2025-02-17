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
exports.Trade = exports.LeaderboardEntry = void 0;
const graphql_1 = require("@nestjs/graphql");
let LeaderboardEntry = class LeaderboardEntry {
};
exports.LeaderboardEntry = LeaderboardEntry;
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", String)
], LeaderboardEntry.prototype, "trader", void 0);
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", Number)
], LeaderboardEntry.prototype, "totalPnL", void 0);
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", Number)
], LeaderboardEntry.prototype, "tradeCount", void 0);
__decorate([
    (0, graphql_1.Field)(() => String),
    __metadata("design:type", String)
], LeaderboardEntry.prototype, "timestamp", void 0);
exports.LeaderboardEntry = LeaderboardEntry = __decorate([
    (0, graphql_1.ObjectType)()
], LeaderboardEntry);
let Trade = class Trade {
};
exports.Trade = Trade;
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", String)
], Trade.prototype, "tradeId", void 0);
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", String)
], Trade.prototype, "timestamp", void 0);
__decorate([
    (0, graphql_1.Field)(() => graphql_1.Float),
    __metadata("design:type", Number)
], Trade.prototype, "price", void 0);
__decorate([
    (0, graphql_1.Field)(() => graphql_1.Int),
    __metadata("design:type", Number)
], Trade.prototype, "volume", void 0);
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", String)
], Trade.prototype, "trader", void 0);
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", String)
], Trade.prototype, "action", void 0);
exports.Trade = Trade = __decorate([
    (0, graphql_1.ObjectType)()
], Trade);
//# sourceMappingURL=trader.entity.js.map