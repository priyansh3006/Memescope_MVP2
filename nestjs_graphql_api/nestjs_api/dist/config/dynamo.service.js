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
exports.DynamoService = void 0;
const common_1 = require("@nestjs/common");
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const client_ssm_1 = require("@aws-sdk/client-ssm");
let DynamoService = class DynamoService {
    constructor() {
        this.client = new client_dynamodb_1.DynamoDBClient({ region: 'us-east-1' });
        this.ssmClient = new client_ssm_1.SSMClient({ region: 'us-east-1' });
        this.loadDynamoDBTableName().then((name) => {
            this.tableName = name;
        });
    }
    async loadDynamoDBTableName() {
        try {
            const response = await this.ssmClient.send(new client_ssm_1.GetParameterCommand({
                Name: 'DynamoDBTableName',
                WithDecryption: true,
            }));
            const tableName = response.Parameter?.Value;
            if (!tableName) {
                throw new Error('DynamoDB table name not found in AWS SSM Parameter Store');
            }
            console.log(`✅ Successfully fetched DynamoDB table name from AWS SSM: ${tableName}`);
            return tableName;
        }
        catch (error) {
            console.error('⚠️ Error fetching DynamoDB table name from AWS SSM:', error);
            throw new Error('Failed to retrieve DynamoDB table name from AWS SSM');
        }
    }
    async saveTraderPnL(signature, traderId, totalPnL, tradeCount, timestamp) {
        const params = {
            TableName: this.tableName,
            Item: {
                signature: { S: signature },
                traderId: { S: traderId || "unknown-trader" },
                totalPnL: { N: totalPnL.toString() },
                tradeCount: { N: tradeCount.toString() },
                timestamp: { N: timestamp },
            },
        };
        try {
            await this.client.send(new client_dynamodb_1.PutItemCommand(params));
            console.log(`✅ Trader PnL data saved successfully for ${traderId}`);
        }
        catch (error) {
            console.error('❌ ERROR: DynamoDB SaveTraderPnL Failed:', error);
            throw new Error('DynamoDB SaveTraderPnL Error');
        }
    }
    async fetchLeaderboard() {
        const params = {
            TableName: this.tableName,
            IndexName: 'PnLIndex',
            ScanIndexForward: false,
            Limit: 10,
        };
        try {
            const command = new client_dynamodb_1.QueryCommand(params);
            const response = await this.client.send(command);
            return response.Items || [];
        }
        catch (error) {
            console.error(`⚠️ ERROR: Fetching leaderboard failed:`, error);
            throw new Error('DynamoDB FetchLeaderboard Error');
        }
    }
    async getLeaderboard() {
        if (!this.tableName) {
            this.tableName = await this.loadDynamoDBTableName();
        }
        const params = {
            TableName: this.tableName,
            ProjectionExpression: "traderId, totalPnL, tradeCount, #ts",
            ExpressionAttributeNames: {
                "#ts": "timestamp"
            }
        };
        try {
            console.log("📌 Fetching leaderboard with params:", JSON.stringify(params, null, 2));
            const response = await this.client.send(new client_dynamodb_1.ScanCommand(params));
            if (!response.Items || response.Items.length === 0) {
                console.log("ℹ️ No items found in DynamoDB");
                return [];
            }
            console.log(`✅ Found ${response.Items.length} entries in leaderboard`);
            return response.Items.map(item => ({
                trader: item.traderId?.S || "Unknown",
                totalPnL: parseFloat(item.totalPnL?.N || "0"),
                tradeCount: parseInt(item.tradeCount?.N || "0", 10),
                timestamp: item.timestamp?.N
                    ? new Date(parseInt(item.timestamp.N)).toISOString()
                    : new Date().toISOString()
            }));
        }
        catch (error) {
            console.error("❌ ERROR: Fetching leaderboard from DynamoDB:", {
                error: error.message,
                code: error.code,
                requestId: error.$metadata?.requestId
            });
            throw new Error(`DynamoDB Fetch Error: ${error.message}`);
        }
    }
};
exports.DynamoService = DynamoService;
exports.DynamoService = DynamoService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], DynamoService);
//# sourceMappingURL=dynamo.service.js.map