import { Injectable } from '@nestjs/common';
import { DynamoDBClient, PutItemCommand, ScanCommand ,QueryCommand, QueryCommandOutput} from '@aws-sdk/client-dynamodb';
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';

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
  async getLeaderboard(limit = 10) {
    if (!this.tableName) {
      throw new Error('DynamoDB table name is not initialized yet.');
    }

    const params = {
      TableName: this.tableName,
      Limit: limit,
    };

    try {
      const command = new ScanCommand(params);
      const response = await this.client.send(command);

      if (!response.Items) {
        return [];
      }

      return response.Items.map(item => ({
        traderId: item.traderId?.S ?? '',
        totalPnL: parseFloat(item.totalPnL?.N ?? '0'),
        tradeCount: parseInt(item.tradeCount?.N ?? '0', 10),
      })).sort((a, b) => b.totalPnL - a.totalPnL); // ✅ Sort leaderboard by highest PnL
    } catch (error) {
      console.error('⚠️ Error fetching leaderboard:', error);
      throw new Error('DynamoDB GetLeaderboard Error');
    }
  }
}
