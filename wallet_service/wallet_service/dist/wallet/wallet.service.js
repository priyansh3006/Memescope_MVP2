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
exports.WalletService = void 0;
const common_1 = require("@nestjs/common");
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const logger_service_1 = require("../logger/logger.service");
const dotenv = require("dotenv");
dotenv.config();
let WalletService = class WalletService {
    constructor(logger) {
        this.logger = logger;
        const region = process.env.AWS_REGION;
        const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
        const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
        if (!region || !accessKeyId || !secretAccessKey) {
            throw new Error("AWS credentials are missing. Check your .env file.");
        }
        this.dynamoDBClient = new client_dynamodb_1.DynamoDBClient({
            region,
            credentials: {
                accessKeyId,
                secretAccessKey,
            }
        });
        this.docClient = lib_dynamodb_1.DynamoDBDocumentClient.from(this.dynamoDBClient);
        this.tableName = process.env.DYNAMODB_WALLET_TABLE || "DefaultWalletTable";
        console.log("DynamoDB Client initialized successfully");
    }
    async followWallet(userId, address) {
        await this.logger.log(`User ${userId} followed wallet ${address}`);
        const command = new lib_dynamodb_1.PutCommand({
            TableName: this.tableName,
            Item: { userId, address }
        });
        await this.docClient.send(command);
        return true;
    }
    async unfollowWallet(userId, address) {
        await this.logger.log(`User ${userId} unfollowed wallet ${address}`);
        const command = new lib_dynamodb_1.DeleteCommand({
            TableName: this.tableName,
            Key: { userId, address }
        });
        await this.docClient.send(command);
        return true;
    }
    async discoverNewTraders() {
        await this.logger.log("Fetching new traders to follow");
        return ['0xTrader1', '0xTrader2', '0xTrader3'];
    }
    async getTrackedWallets(userId) {
        await this.logger.log(`Fetching tracked wallets for user ${userId}`);
        const command = new lib_dynamodb_1.QueryCommand({
            TableName: this.tableName,
            KeyConditionExpression: "userId = :userId",
            ExpressionAttributeValues: { ":userId": userId }
        });
        const response = await this.docClient.send(command);
        return response.Items?.map(item => item.address) || [];
    }
};
exports.WalletService = WalletService;
exports.WalletService = WalletService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [logger_service_1.LoggerService])
], WalletService);
//# sourceMappingURL=wallet.service.js.map