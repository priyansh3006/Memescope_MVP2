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
      this.tableName = await this.configService.getParameter('dynamoDbTableName');
      const awsRegion = "us-east-1";

      if (!this.tableName || !awsRegion) {
        throw new Error('Missing AWS Parameters: DynamoDB Table Name or Region is not set.');
      }

      this.logger.log(`🔹 Using DynamoDB Table: ${this.tableName} in Region: ${awsRegion}`);
      this.dynamoDB = new DynamoDBClient({ region: awsRegion });
    } catch (error) {
      this.logger.error(`Failed to initialize DynamoDB: ${error.message}`);
      throw error;
    }
  }

  // ✅ Get Trader's PnL by Username
  async getTraderPnL(username: string): Promise<{ totalProfit: number; totalLoss: number }> {
    try {
      if (!this.tableName) {
        await this.initializeDynamoDB();
      }

      const command = new ScanCommand({ TableName: this.tableName });
      const response = await this.dynamoDB.send(command);

      if (!response.Items || response.Items.length === 0) {
        return { totalProfit: 0, totalLoss: 0 };
      }

      const trades = response.Items
        .map(item => unmarshall(item))
        .filter(trade => trade.Trader === username);

      let totalProfit = 0;
      let totalLoss = 0;

      trades.forEach(trade => {
        const tradeValue = trade.price * trade.volume;
        if (trade.action === 'BUY') {
          totalLoss += tradeValue;
        } else if (trade.action === 'SELL') {
          totalProfit += tradeValue;
        }
      });

      return { totalProfit, totalLoss };
    } catch (error) {
      this.logger.error(`Error fetching PnL for trader ${username}: ${error.message}`);
      throw error;
    }
  }

  // ✅ Get All Trades
  async getAllTrades(): Promise<Trade[]> {
    try {
      if (!this.tableName) {
        await this.initializeDynamoDB();
      }

      const command = new ScanCommand({ TableName: this.tableName });
      const response = await this.dynamoDB.send(command);

      if (!response.Items || response.Items.length === 0) {
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
    } catch (error) {
      this.logger.error(`Error fetching trades from DynamoDB: ${error.message}`);
      throw error;
    }
  }

  // ✅ Get Top Profitable Traders
  async getTopTradersByProfit(limit: number = 10): Promise<TraderStats[]> {
    try {
      if (!this.tableName) {
        await this.initializeDynamoDB();
      }

      const command = new ScanCommand({ TableName: this.tableName });
      const response = await this.dynamoDB.send(command);

      if (!response.Items || response.Items.length === 0) {
        return [];
      }

      const trades = response.Items.map(item => ({
        trader: item?.Trader?.S || "UNKNOWN_TRADER",
        price: item?.Price?.N ? parseFloat(item.Price.N) : 0,
        volume: item?.Volume?.N ? parseInt(item.Volume.N, 10) : 0,
        action: item?.Action?.S || "UNKNOWN_ACTION"
      }));

      const traderMap = new Map<string, number>();

      trades.forEach(trade => {
        const tradeValue = trade.price * trade.volume;
        const currentProfit = traderMap.get(trade.trader) || 0;

        if (trade.action === 'BUY') {
          traderMap.set(trade.trader, currentProfit - tradeValue);
        } else if (trade.action === 'SELL') {
          traderMap.set(trade.trader, currentProfit + tradeValue);
        }
      });

      return Array.from(traderMap.entries())
        .map(([trader, totalProfit]) => ({ trader, totalProfit }))
        .filter(t => t.totalProfit > 0)
        .sort((a, b) => b.totalProfit - a.totalProfit)
        .slice(0, limit);
    } catch (error) {
      this.logger.error(`Error calculating top traders by profit: ${error.message}`);
      throw error;
    }
  }

  // ✅ Get Top Losing Traders
  async getTopLosingTraders(limit: number = 5): Promise<TraderStats[]> {
    try {
      if (!this.tableName) {
        await this.initializeDynamoDB();
      }

      const command = new ScanCommand({ TableName: this.tableName });
      const response = await this.dynamoDB.send(command);

      if (!response.Items || response.Items.length === 0) {
        return [];
      }

      const trades = response.Items.map(item => ({
        trader: item?.Trader?.S || "UNKNOWN_TRADER",
        price: item?.Price?.N ? parseFloat(item.Price.N) : 0,
        volume: item?.Volume?.N ? parseInt(item.Volume.N, 10) : 0,
        action: item?.Action?.S || "UNKNOWN_ACTION"
      }));

      const traderLosses = new Map<string, number>();

      trades.forEach(trade => {
        const tradeValue = trade.price * trade.volume;
        const currentLoss = traderLosses.get(trade.trader) || 0;

        if (trade.action === 'BUY') {
          traderLosses.set(trade.trader, currentLoss + tradeValue);
        } else if (trade.action === 'SELL') {
          traderLosses.set(trade.trader, currentLoss - tradeValue);
        }
      });

      return Array.from(traderLosses.entries())
        .map(([trader, totalLoss]) => ({ trader, totalLoss }))
        .sort((a, b) => a.totalLoss - b.totalLoss)
        .slice(0, limit);
    } catch (error) {
      this.logger.error(`Error calculating losing traders leaderboard: ${error.message}`);
      throw error;
    }
  }

  // ✅ Create Trade
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
      return trade;
    } catch (error) {
      this.logger.error(`Error storing trade: ${error.message}`);
      throw error;
    }
  }
}
