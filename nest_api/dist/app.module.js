"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = require("@nestjs/axios");
const trade_service_1 = require("./trade/trade.service");
const helius_service_1 = require("./helius/helius.service");
const jupiter_service_1 = require("./jupiter/jupiter.service");
const leaderboard_resolver_1 = require("./leaderboard/leaderboard.resolver");
const dynamo_service_1 = require("./config/dynamo.service");
const config_service_1 = require("./config/config.service");
const graphql_1 = require("@nestjs/graphql");
const apollo_1 = require("@nestjs/apollo");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            graphql_1.GraphQLModule.forRoot({
                driver: apollo_1.ApolloDriver,
                autoSchemaFile: true,
                playground: true,
                debug: true,
            }),
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            axios_1.HttpModule,
        ],
        providers: [
            trade_service_1.TradeService,
            helius_service_1.HeliusService,
            jupiter_service_1.JupiterService,
            leaderboard_resolver_1.LeaderboardResolver,
            dynamo_service_1.DynamoService,
            config_service_1.ConfigService,
        ],
        exports: [trade_service_1.TradeService, helius_service_1.HeliusService, jupiter_service_1.JupiterService, dynamo_service_1.DynamoService, config_service_1.ConfigService, leaderboard_resolver_1.LeaderboardResolver],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map