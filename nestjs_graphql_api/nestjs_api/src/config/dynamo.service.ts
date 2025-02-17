import { Injectable } from '@nestjs/common';
import { DynamoDBClient, PutItemCommand, ScanCommand ,QueryCommand, QueryCommandOutput} from '@aws-sdk/client-dynamodb';
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';
import { LeaderboardEntry } from '../leaderboard/trader.entity';

@Injectable()
export class DynamoService {
  private readonly client: DynamoDBClient;
  private readonly ssmClient: SSMClient;
  private tableName: string;

  constructor() {
    this.client = new DynamoDBClient({ region: 'us-east-1' });
    this.ssmClient = new SSMClient({ region: 'us-east-1' });

    // Fetch table name dynamically from AWS SSM
    this.loadDynamoDBTableName().then((name) => {
      this.tableName = name;
    });
  }

  /**
   * Fetch the DynamoDB table name from AWS SSM Parameter Store.
   */
  private async loadDynamoDBTableName(): Promise<string> {
    try {
      const response = await this.ssmClient.send(
        new GetParameterCommand({
          Name: 'DynamoDBTableName', // ✅ Ensure this matches the stored parameter
          WithDecryption: true,
        })
      );

      const tableName = response.Parameter?.Value;
      if (!tableName) {
        throw new Error('DynamoDB table name not found in AWS SSM Parameter Store');
      }

      console.log(`✅ Successfully fetched DynamoDB table name from AWS SSM: ${tableName}`);
      return tableName;
    } catch (error) {
      console.error('⚠️ Error fetching DynamoDB table name from AWS SSM:', error);
      throw new Error('Failed to retrieve DynamoDB table name from AWS SSM');
    }
  }

  /**
   * Store trader PnL data in DynamoDB
   */
  async saveTraderPnL(signature: string, traderId: string, totalPnL: number, tradeCount: number, timestamp: string) {
    const params = {
      TableName: this.tableName,
      Item: {
        signature: { S: signature },
        traderId: { S: traderId || "unknown-trader" },  // ✅ Ensure a valid trader ID
        totalPnL: { N: totalPnL.toString() },
        tradeCount: { N: tradeCount.toString() },
        timestamp: { N: timestamp },
      },
    };
  
    try {
      await this.client.send(new PutItemCommand(params));
      console.log(`✅ Trader PnL data saved successfully for ${traderId}`);
    } catch (error) {
      console.error('❌ ERROR: DynamoDB SaveTraderPnL Failed:', error);
      throw new Error('DynamoDB SaveTraderPnL Error');
    }
  }
  
  
  //Fetch Leaderboard from DynamoDB
  async fetchLeaderboard() {
    const params = {
      TableName: this.tableName,
      IndexName: 'PnLIndex', // ✅ Ensure this GSI exists
      ScanIndexForward: false, // ✅ Sort by highest PnL
      Limit: 10,
    };
  
    try {
      const command = new QueryCommand(params);
      const response: QueryCommandOutput = await this.client.send(command); // ✅ Ensure correct type
  
      return response.Items || []; // ✅ Fix: Items should now exist
    } catch (error) {
      console.error(`⚠️ ERROR: Fetching leaderboard failed:`, error);
      throw new Error('DynamoDB FetchLeaderboard Error');
    }
  }
  
  

  /**
   * Fetch leaderboard sorted by Profit & Loss
   */
  async getLeaderboard(): Promise<LeaderboardEntry[]> {
    // Ensure table name is loaded
    if (!this.tableName) {
      this.tableName = await this.loadDynamoDBTableName();
    }

    const params = {
      TableName: this.tableName,
      ProjectionExpression: "traderId, totalPnL, tradeCount, #ts", // Using expression attribute name for reserved word
      ExpressionAttributeNames: {
        "#ts": "timestamp"
      }
    };

    try {
      console.log("📌 Fetching leaderboard with params:", JSON.stringify(params, null, 2));
      const response = await this.client.send(new ScanCommand(params));
      
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
    } catch (error) {
      console.error("❌ ERROR: Fetching leaderboard from DynamoDB:", {
        error: error.message,
        code: error.code,
        requestId: error.$metadata?.requestId
      });
      throw new Error(`DynamoDB Fetch Error: ${error.message}`);
    }
  }
  
}
