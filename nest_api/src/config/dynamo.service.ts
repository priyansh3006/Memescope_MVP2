import { Injectable, OnModuleInit } from '@nestjs/common';
import { DynamoDBClient, ScanCommand, PutItemCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { ConfigService } from '@nestjs/config';
import { unmarshall } from '@aws-sdk/util-dynamodb';

@Injectable()
export class DynamoService implements OnModuleInit {
  private dynamoDB: DynamoDBClient;
  private tableName: string;

  constructor(private readonly configService: ConfigService) {
    // ✅ Initialize AWS SDK with region from config
    const region = this.configService.get<string>('AWS_REGION') || 'us-east-1';
    this.dynamoDB = new DynamoDBClient({ region });
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

  /**
   * ✅ Store top traders' wallet addresses in DynamoDB.
   */
  async storeTopHolders(wallets: string[]): Promise<void> {
    console.log(`🔍 Storing ${wallets.length} wallet addresses in DynamoDB...`);

    for (const wallet of wallets) {
      if (!wallet || typeof wallet !== 'string' || wallet.trim() === '') {
        console.warn(`⚠️ Skipping invalid wallet: ${wallet}`);
        continue; // Skip invalid wallet addresses
      }

      // ✅ Generate a unique signature (mock signature for now)
      const signature = `sig_${wallet}_${Date.now()}`;

      // ✅ Get the current timestamp
      const timestamp = Math.floor(Date.now() / 1000);

      const params = new PutItemCommand({
        TableName: this.tableName,
        Item: {
          signature: { S: signature }, // ✅ Ensure primary key (HASH)
          timestamp: { N: timestamp.toString() }, // ✅ Ensure sort key (RANGE)
          token: { S: 'SOL' }, // ✅ Store the token (hardcoded for now)
          wallet_address: { S: wallet }, // ✅ Store wallet address as a secondary attribute
          pnl: { N: '0' } // Default PnL to 0
        }
      });

      try {
        await this.dynamoDB.send(params);
        console.log(`✅ Stored wallet: ${wallet} with signature ${signature}`);
      } catch (error) {
        console.error(`❌ Error storing wallet ${wallet}:`, error.message);
      }
    }
  }

  /**
   * ✅ Fetch all stored wallets and their PnL (leaderboard).
   */
  async getLeaderboard(): Promise<any[]> {
    console.log('📌 Fetching leaderboard from DynamoDB...');

    const params = new ScanCommand({
      TableName: this.tableName,
    });

    try {
      const result = await this.dynamoDB.send(params);
      const leaderboard = result.Items ? result.Items.map(item => unmarshall(item)) : [];

      // ✅ Log retrieved items
      console.log(`✅ Retrieved ${leaderboard.length} leaderboard entries.`);

      // ✅ Sort leaderboard based on PnL (highest first)
      return leaderboard.sort((a, b) => (b.pnl ?? 0) - (a.pnl ?? 0));
    } catch (error) {
      console.error('❌ Error fetching leaderboard:', error.message);
      return [];
    }
  }

  /**
   * ✅ Update PnL for a specific wallet.
   */
  async updatePnL(walletAddress: string, pnl: number): Promise<void> {
    console.log(`🔄 Updating PnL for wallet: ${walletAddress}`);

    const params = new UpdateItemCommand({
      TableName: this.tableName,
      Key: { wallet_address: { S: walletAddress } },
      UpdateExpression: 'SET pnl = :pnl',
      ExpressionAttributeValues: { ':pnl': { N: pnl.toString() } },
    });

    try {
      await this.dynamoDB.send(params);
      console.log(`✅ Updated PnL for wallet ${walletAddress}: ${pnl}`);
    } catch (error) {
      console.error(`❌ Error updating PnL for ${walletAddress}:`, error.message);
    }
  }
}
