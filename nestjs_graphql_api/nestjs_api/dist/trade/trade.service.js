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
var TradeService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TradeService = void 0;
const common_1 = require("@nestjs/common");
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const uuid_1 = require("uuid");
const config_service_1 = require("../config/config.service");
let TradeService = TradeService_1 = class TradeService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(TradeService_1.name);
        this.initializeDynamoDB();
    }
    async initializeDynamoDB() {
        try {
            this.tableName = await this.configService.getParameter('dynamoDbTableName');
            const awsRegion = "us-east-1";
            if (!this.tableName || !awsRegion) {
                console.log(this.tableName);
                console.log(awsRegion);
                throw new Error(' Missing AWS Parameters: DynamoDB Table Name or Region is not set.');
            }
            this.logger.log(`🔹 Using DynamoDB Table: ${this.tableName} in Region: ${awsRegion}`);
            this.dynamoDB = new client_dynamodb_1.DynamoDBClient({ region: awsRegion });
        }
        catch (error) {
            this.logger.error(` Failed to initialize DynamoDB: ${error.message}`);
            throw error;
        }
    }
    async getAllTrades() {
        try {
            if (!this.tableName) {
                await this.initializeDynamoDB();
            }
            const command = new client_dynamodb_1.ScanCommand({
                TableName: this.tableName,
            });
            const response = await this.dynamoDB.send(command);
            if (!response.Items || response.Items.length === 0) {
                this.logger.warn('⚠️ No trades found in DynamoDB.');
                return [];
            }
            return response.Items.map((item) => ({
                tradeId: item?.TradeID?.S || "UNKNOWN_ID",
                timestamp: item?.Timestamp?.S || new Date().toISOString(),
                price: item?.Price?.N ? parseFloat(item.Price.N) : 0,
                volume: item?.Volume?.N ? parseInt(item.Volume.N, 10) : 0,
                trader: item?.Trader?.S || "UNKNOWN_TRADER",
                action: item?.Action?.S || "UNKNOWN_ACTION",
            }));
        }
        catch (error) {
            this.logger.error(`Error fetching trades from DynamoDB: ${error.message}`);
            throw error;
        }
    }
    async getTopTradersByProfit(limit = 10) {
        try {
            if (!this.tableName) {
                await this.initializeDynamoDB();
            }
            const command = new client_dynamodb_1.ScanCommand({
                TableName: this.tableName,
            });
            const response = await this.dynamoDB.send(command);
            if (!response.Items || response.Items.length === 0) {
                this.logger.warn('No trades found for leaderboard calculation.');
                return [];
            }
            const trades = response.Items.map((item) => ({
                trader: item?.Trader?.S || 'UNKNOWN_TRADER',
                price: item?.Price?.N ? parseFloat(item.Price.N) : 0,
                volume: item?.Volume?.N ? parseInt(item.Volume.N, 10) : 0,
                action: item?.Action?.S || 'UNKNOWN_ACTION',
            }));
            const traderMap = new Map();
            trades.forEach((trade) => {
                const tradeValue = trade.price * trade.volume;
                const currentProfit = traderMap.get(trade.trader) || 0;
                if (trade.action === 'BUY') {
                    traderMap.set(trade.trader, currentProfit - tradeValue);
                }
                else if (trade.action === 'SELL') {
                    traderMap.set(trade.trader, currentProfit + tradeValue);
                }
            });
            const leaderboard = Array.from(traderMap.entries())
                .map(([trader, totalProfit]) => ({ trader, totalProfit }))
                .filter((t) => t.totalProfit > 0)
                .sort((a, b) => b.totalProfit - a.totalProfit)
                .slice(0, limit);
            return leaderboard;
        }
        catch (error) {
            this.logger.error(`Error calculating top traders by profit: ${error.message}`);
            throw error;
        }
    }
    async getTopLosingTraders(limit = 5) {
        try {
            if (!this.tableName) {
                await this.initializeDynamoDB();
            }
            const command = new client_dynamodb_1.ScanCommand({
                TableName: this.tableName,
            });
            const response = await this.dynamoDB.send(command);
            if (!response.Items || response.Items.length === 0) {
                this.logger.warn('No trades found for loss leaderboard calculation.');
                return [];
            }
            const trades = response.Items.map((item) => ({
                trader: item?.Trader?.S || 'UNKNOWN_TRADER',
                price: item?.Price?.N ? parseFloat(item.Price.N) : 0,
                volume: item?.Volume?.N ? parseInt(item.Volume.N, 10) : 0,
                action: item?.Action?.S || 'UNKNOWN_ACTION',
            }));
            const traderLosses = new Map();
            trades.forEach((trade) => {
                const tradeValue = trade.price * trade.volume;
                const currentLoss = traderLosses.get(trade.trader) || 0;
                if (trade.action === 'BUY') {
                    traderLosses.set(trade.trader, currentLoss - tradeValue);
                }
                else if (trade.action === 'SELL') {
                    traderLosses.set(trade.trader, currentLoss + tradeValue);
                }
            });
            const leaderboard = Array.from(traderLosses.entries())
                .map(([trader, totalLoss]) => ({ trader, totalLoss }))
                .filter((t) => t.totalLoss < 0)
                .sort((a, b) => a.totalLoss - b.totalLoss)
                .slice(0, limit);
            return leaderboard;
        }
        catch (error) {
            this.logger.error(`Error calculating losing traders leaderboard: ${error.message}`);
            throw error;
        }
    }
    async createTrade(price, volume, trader, action) {
        try {
            if (!this.tableName) {
                await this.initializeDynamoDB();
            }
            const trade = {
                tradeId: (0, uuid_1.v4)(),
                timestamp: new Date().toISOString(),
                price,
                volume,
                trader,
                action,
            };
            const command = new client_dynamodb_1.PutItemCommand({
                TableName: this.tableName,
                Item: {
                    TradeID: { S: trade.tradeId },
                    Timestamp: { S: trade.timestamp },
                    Price: { N: trade.price.toString() },
                    Volume: { N: trade.volume.toString() },
                    Trader: { S: trade.trader },
                    Action: { S: trade.action },
                },
            });
            await this.dynamoDB.send(command);
            this.logger.log(`Trade created successfully: ${JSON.stringify(trade)}`);
            return trade;
        }
        catch (error) {
            this.logger.error(` Error storing trade: ${error.message}`);
            throw error;
        }
    }
};
exports.TradeService = TradeService;
exports.TradeService = TradeService = TradeService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_service_1.ConfigService])
], TradeService);
//# sourceMappingURL=trade.service.js.map