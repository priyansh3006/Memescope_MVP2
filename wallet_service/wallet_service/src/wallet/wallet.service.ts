import { Injectable } from '@nestjs/common';
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, DeleteCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { LoggerService } from '../logger/logger.service';
import * as dotenv from 'dotenv';

dotenv.config(); // Load environment variables

@Injectable()
export class WalletService {
  private dynamoDBClient: DynamoDBClient;
  private docClient: DynamoDBDocumentClient;
  private tableName: string;

  constructor(private readonly logger: LoggerService) {
    const region = process.env.AWS_REGION;
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

    // Check for missing environment variables
    if (!region || !accessKeyId || !secretAccessKey) {
      throw new Error("AWS credentials are missing. Check your .env file.");
    }

    this.dynamoDBClient = new DynamoDBClient({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      }
    });

    this.docClient = DynamoDBDocumentClient.from(this.dynamoDBClient);
    this.tableName = process.env.DYNAMODB_WALLET_TABLE || "DefaultWalletTable";

    console.log("DynamoDB Client initialized successfully");
  }

  async followWallet(userId: string, address: string): Promise<boolean> {
    await this.logger.log(`User ${userId} followed wallet ${address}`);

    const command = new PutCommand({
      TableName: this.tableName,
      Item: { userId, address }
    });

    await this.docClient.send(command);
    return true;
  }

  async unfollowWallet(userId: string, address: string): Promise<boolean> {
    await this.logger.log(`User ${userId} unfollowed wallet ${address}`);

    const command = new DeleteCommand({
      TableName: this.tableName,
      Key: { userId, address }
    });

    await this.docClient.send(command);
    return true;
  }

  // Will configure it later
  async discoverNewTraders(): Promise<string[]> {
    await this.logger.log("Fetching new traders to follow");
    // Simulating fetching new traders
    return ['0xTrader1', '0xTrader2', '0xTrader3'];
}


  async getTrackedWallets(userId: string): Promise<string[]> {
    await this.logger.log(`Fetching tracked wallets for user ${userId}`);

    const command = new QueryCommand({
      TableName: this.tableName,
      KeyConditionExpression: "userId = :userId",
      ExpressionAttributeValues: { ":userId": userId }
    });

    const response = await this.docClient.send(command);
    return response.Items?.map(item => item.address) || [];
  }
}
