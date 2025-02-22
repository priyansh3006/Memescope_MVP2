import { Injectable, OnModuleInit } from '@nestjs/common';
import { DynamoDBClient, ScanCommand, PutItemCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { ConfigService } from './config.service';
import { unmarshall } from '@aws-sdk/util-dynamodb';

@Injectable()
export class DynamoService implements OnModuleInit {
  private dynamoDB: DynamoDBClient;
  private tableName: string;
  private leaderboardData: { wallet: string; pnl: number }[] = [];

  constructor(private readonly configService: ConfigService) {
    const region = 'us-east-1'; // Will change this later
    this.dynamoDB = new DynamoDBClient({ region });
    this.tableName = '';
  }

  async onModuleInit() {
    this.tableName = 'solanaTransactions';
    if (!this.tableName) {
      console.error('DynamoDB Table Name is missing! Check AWS SSM.');
      throw new Error('DynamoDB Table Name not found.');
    }
    console.log(` DynamoService initialized with table: ${this.tableName}`);
  }

  async storeTopHolders(wallets: string[]): Promise<void> {
    console.log(` Storing ${wallets.length} wallet addresses in DynamoDB...`);
    this.tableName = 'solanaTransactions';
    for (const wallet of wallets) {
      if (!wallet || typeof wallet !== 'string' || wallet.trim() === '') {
        console.warn(` Skipping invalid wallet: ${wallet}`);
        continue;
      }

      const signature = `sig_${wallet}_${Date.now()}`;
      const timestamp = Math.floor(Date.now() / 1000);

      const params = new PutItemCommand({
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
        console.log(` Stored wallet: ${wallet} with signature ${signature}`);
      } catch (error) {
        console.error(` Error storing wallet ${wallet}:`, error.message);
      }
    }
  }

  async getLeaderboard(): Promise<any[]> {
    console.log(' Fetching leaderboard from DynamoDB...');

    const params = new ScanCommand({
      TableName: this.tableName,
    });

    try {
      const result = await this.dynamoDB.send(params);
      const leaderboard = result.Items ? result.Items.map(item => unmarshall(item)) : [];

      console.log(` Retrieved ${leaderboard.length} leaderboard entries.`);
      return leaderboard.sort((a, b) => (b.pnl ?? 0) - (a.pnl ?? 0));
    } catch (error) {
      console.error(' Error fetching leaderboard:', error.message);
      return [];
    }
  }

  async updatePnL(walletAddress: string, pnl: number): Promise<void> {
    console.log(` Updating PnL for wallet: ${walletAddress}`);

    const params = new UpdateItemCommand({
      TableName: this.tableName,
      Key: { wallet_address: { S: walletAddress } },
      UpdateExpression: 'SET pnl = :pnl',
      ExpressionAttributeValues: { ':pnl': { N: pnl.toString() } },
    });

    const existingWallet = this.leaderboardData.find((item) => item.wallet === walletAddress);
    if (existingWallet) {
      existingWallet.pnl = pnl;
    } else {
      this.leaderboardData.push({ wallet: walletAddress, pnl });
    }

    try {
      await this.dynamoDB.send(params);
      console.log(` Updated PnL for wallet ${walletAddress}: ${pnl}`);
    } catch (error) {
      console.error(` Error updating PnL for ${walletAddress}:`, error.message);
    }
  }

  getInMemoryLeaderboard(): { wallet: string; pnl: number }[] {
    return [...this.leaderboardData].sort((a, b) => b.pnl - a.pnl);
  }
}