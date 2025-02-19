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
const config_1 = require("@nestjs/config");
const util_dynamodb_1 = require("@aws-sdk/util-dynamodb");
let DynamoService = class DynamoService {
    constructor(configService) {
        this.configService = configService;
        const region = this.configService.get('AWS_REGION') || 'us-east-1';
        this.dynamoDB = new client_dynamodb_1.DynamoDBClient({ region });
        this.tableName = '';
    }
    async onModuleInit() {
        this.tableName = 'solanaTransactions-db3e21b';
        if (!this.tableName) {
            console.error('❌ DynamoDB Table Name is missing! Check AWS SSM.');
            throw new Error('DynamoDB Table Name not found.');
        }
        console.log(`✅ DynamoService initialized with table: ${this.tableName}`);
    }
    async storeTopHolders(wallets) {
        console.log(`🔍 Storing ${wallets.length} wallet addresses in DynamoDB...`);
        for (const wallet of wallets) {
            if (!wallet || typeof wallet !== 'string' || wallet.trim() === '') {
                console.warn(`⚠️ Skipping invalid wallet: ${wallet}`);
                continue;
            }
            const signature = `sig_${wallet}_${Date.now()}`;
            const timestamp = Math.floor(Date.now() / 1000);
            const params = new client_dynamodb_1.PutItemCommand({
                TableName: this.tableName,
                Item: {
                    signature: { S: signature },
                    timestamp: { N: timestamp.toString() },
                    token: { S: 'SOL' },
                    wallet_address: { S: wallet },
                    pnl: { N: '0' }
                }
            });
            try {
                await this.dynamoDB.send(params);
                console.log(`✅ Stored wallet: ${wallet} with signature ${signature}`);
            }
            catch (error) {
                console.error(`❌ Error storing wallet ${wallet}:`, error.message);
            }
        }
    }
    async getLeaderboard() {
        console.log('📌 Fetching leaderboard from DynamoDB...');
        const params = new client_dynamodb_1.ScanCommand({
            TableName: this.tableName,
        });
        try {
            const result = await this.dynamoDB.send(params);
            const leaderboard = result.Items ? result.Items.map(item => (0, util_dynamodb_1.unmarshall)(item)) : [];
            console.log(`✅ Retrieved ${leaderboard.length} leaderboard entries.`);
            return leaderboard.sort((a, b) => (b.pnl ?? 0) - (a.pnl ?? 0));
        }
        catch (error) {
            console.error('❌ Error fetching leaderboard:', error.message);
            return [];
        }
    }
    async updatePnL(walletAddress, pnl) {
        console.log(`🔄 Updating PnL for wallet: ${walletAddress}`);
        const params = new client_dynamodb_1.UpdateItemCommand({
            TableName: this.tableName,
            Key: { wallet_address: { S: walletAddress } },
            UpdateExpression: 'SET pnl = :pnl',
            ExpressionAttributeValues: { ':pnl': { N: pnl.toString() } },
        });
        try {
            await this.dynamoDB.send(params);
            console.log(`✅ Updated PnL for wallet ${walletAddress}: ${pnl}`);
        }
        catch (error) {
            console.error(`❌ Error updating PnL for ${walletAddress}:`, error.message);
        }
    }
};
exports.DynamoService = DynamoService;
exports.DynamoService = DynamoService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], DynamoService);
//# sourceMappingURL=dynamo.service.js.map