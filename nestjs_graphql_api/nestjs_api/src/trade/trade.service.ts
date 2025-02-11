import { Injectable, Logger } from '@nestjs/common';
import { Trade } from './trade.model';
import { DynamoDBClient, PutItemCommand, ScanCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { ConfigService } from '../config/config.service'; 
import { TraderStats } from './trader_stats.model';

@Injectable()
export class TradeService {
  private dynamoDB: DynamoDBClient;
  private tableName: string;
  private readonly logger = new Logger(TradeService.name);

  constructor(private readonly configService: ConfigService) {
    this.initializeDynamoDB();
  }

  async initializeDynamoDB() {
    try {
      // Fetch DynamoDB Table Name & Region from AWS SSM
      this.tableName = await this.configService.getParameter('dynamoDbTableName');
      const awsRegion = "us-east-1"; // Ensure Pulumi exports region

      if (!this.tableName || !awsRegion) {
        console.log(this.tableName);
        console.log(awsRegion);
        throw new Error(' Missing AWS Parameters: DynamoDB Table Name or Region is not set.');
      }

      this.logger.log(`🔹 Using DynamoDB Table: ${this.tableName} in Region: ${awsRegion}`);

      // Initialize DynamoDB Client with AWS Credentials from Environment (Pulumi-configured)
      this.dynamoDB = new DynamoDBClient({ region: awsRegion });

    } catch (error) {
      this.logger.error(` Failed to initialize DynamoDB: ${error.message}`);
      throw error;
    }
  }

  

  async getAllTrades(): Promise<Trade[]> {
    try {
      if (!this.tableName) {
        await this.initializeDynamoDB(); // Ensure table name is loaded
      }

      const command = new ScanCommand({
        TableName: this.tableName,
      });

      const response = await this.dynamoDB.send(command);

      if (!response.Items || response.Items.length === 0) {
        this.logger.warn('⚠️ No trades found in DynamoDB.');
        return [];
      }

      return response.Items.map((item) => ({
        tradeId: item?.TradeID?.S || "UNKNOWN_ID",  // Ensure a fallback value
        timestamp: item?.Timestamp?.S || new Date().toISOString(), // Added timestamp field
        price: item?.Price?.N ? parseFloat(item.Price.N) : 0,  // Convert safely
        volume: item?.Volume?.N ? parseInt(item.Volume.N, 10) : 0,  // Convert safely
        trader: item?.Trader?.S || "UNKNOWN_TRADER",
        action: item?.Action?.S || "UNKNOWN_ACTION",
      }));
    } catch (error) {
      this.logger.error(`Error fetching trades from DynamoDB: ${error.message}`);
      throw error;
    }
  }

  //Top trader according to the proft
  async getTopTradersByProfit(limit: number = 10): Promise<TraderStats[]> {
    try {
      if (!this.tableName) {
        await this.initializeDynamoDB();
      }
  
      const command = new ScanCommand({
        TableName: this.tableName,
      });
  
      const response = await this.dynamoDB.send(command);
  
      if (!response.Items || response.Items.length === 0) {
        this.logger.warn('No trades found for leaderboard calculation.');
        return [];
      }
  
      // Convert items from DynamoDB format
      const trades = response.Items.map((item) => ({
        trader: item?.Trader?.S || 'UNKNOWN_TRADER',
        price: item?.Price?.N ? parseFloat(item.Price.N) : 0,
        volume: item?.Volume?.N ? parseInt(item.Volume.N, 10) : 0,
        action: item?.Action?.S || 'UNKNOWN_ACTION',
      }));
  
      // Group trades by trader and calculate profit
      const traderMap = new Map<string, number>();
  
      trades.forEach((trade) => {
        const tradeValue = trade.price * trade.volume;
        const currentProfit = traderMap.get(trade.trader) || 0;
  
        if (trade.action === 'BUY') {
          traderMap.set(trade.trader, currentProfit - tradeValue);
        } else if (trade.action === 'SELL') {
          traderMap.set(trade.trader, currentProfit + tradeValue);
        }
      });
  
      // Convert to an array and sort by profit (descending)
      const leaderboard = Array.from(traderMap.entries())
        .map(([trader, totalProfit]) => ({ trader, totalProfit }))
        .filter((t) => t.totalProfit > 0) // ✅ Only keep profitable traders
        .sort((a, b) => b.totalProfit - a.totalProfit) // ✅ Sort in descending order
        .slice(0, limit); // ✅ Allow selecting top `N` traders
  
      return leaderboard;
    } catch (error) {
      this.logger.error(`Error calculating top traders by profit: ${error.message}`);
      throw error;
    }
  }
  

  //Top traders according to loss
  async getTopLosingTraders(limit: number = 5): Promise<TraderStats[]> {
    try {
      if (!this.tableName) {
        await this.initializeDynamoDB();
      }
  
      const command = new ScanCommand({
        TableName: this.tableName,
      });
  
      const response = await this.dynamoDB.send(command);
  
      if (!response.Items || response.Items.length === 0) {
        this.logger.warn('No trades found for loss leaderboard calculation.');
        return [];
      }
  
      // Convert DynamoDB response to usable format
      const trades = response.Items.map((item) => ({
        trader: item?.Trader?.S || 'UNKNOWN_TRADER',
        price: item?.Price?.N ? parseFloat(item.Price.N) : 0,
        volume: item?.Volume?.N ? parseInt(item.Volume.N, 10) : 0,
        action: item?.Action?.S || 'UNKNOWN_ACTION',
      }));
  
      // Group trades by trader and calculate total loss
      const traderLosses = new Map<string, number>();
  
      trades.forEach((trade) => {
        const tradeValue = trade.price * trade.volume;
        const currentLoss = traderLosses.get(trade.trader) || 0;
  
        if (trade.action === 'BUY') {
          traderLosses.set(trade.trader, currentLoss - tradeValue);
        } else if (trade.action === 'SELL') {
          traderLosses.set(trade.trader, currentLoss + tradeValue);
        }
      });
  
      // Filter only losing traders and sort by total loss (ascending)
      const leaderboard = Array.from(traderLosses.entries())
        .map(([trader, totalLoss]) => ({ trader, totalLoss }))
        .filter((t) => t.totalLoss < 0) // Keep only traders with losses
        .sort((a, b) => a.totalLoss - b.totalLoss) // Sort in ascending order (biggest loss first)
        .slice(0, limit); // Limit results
  
      return leaderboard;
    } catch (error) {
      this.logger.error(`Error calculating losing traders leaderboard: ${error.message}`);
      throw error;
    }
  }
  
  
  // Create a new trade record in DynamoDB
  async createTrade(price: number, volume: number, trader: string, action: string): Promise<Trade> {
    try {
      if (!this.tableName) {
        await this.initializeDynamoDB();
      }

      const trade: Trade = {
        tradeId: uuidv4(),
        timestamp: new Date().toISOString(),
        price,
        volume,
        trader,
        action,
      };

      const command = new PutItemCommand({
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
    } catch (error) {
      this.logger.error(` Error storing trade: ${error.message}`);
      throw error;
    }
  }
}
