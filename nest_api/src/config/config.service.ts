import { Injectable, OnModuleInit } from '@nestjs/common';
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';

@Injectable()
export class ConfigService implements OnModuleInit {
  private ssmClient: SSMClient;

  constructor() {
    this.ssmClient = new SSMClient({ region: 'us-east-1' }); // Change to your AWS region
  }

  async onModuleInit() {
    console.log('✅ ConfigService initialized.');
  }

  /**
   * ✅ Fetch a parameter from AWS SSM Parameter Store using AWS SDK v3.
   */
  private async getSSMParameter(name: string, withDecryption = false): Promise<string> {
    try {
      const command = new GetParameterCommand({
        Name: name,
        WithDecryption: withDecryption,
      });

      const result = await this.ssmClient.send(command);

      if (result.Parameter && result.Parameter.Value) {
        return result.Parameter.Value;
      } else {
        console.warn(`⚠️ Parameter ${name} not found.`);
        return '';
      }
    } catch (error) {
      console.error(`❌ Error fetching SSM parameter ${name}:`, error.message);
      return '';
    }
  }

  /**
   * ✅ Get DynamoDB Table Name from SSM.
   */
  async getDynamoDBTable(): Promise<string> {
    return await this.getSSMParameter('DynamoDBTableName');
  }

  /**
   * ✅ Get Helius API Key from SSM.
   */
  async getHeliusAPIKey(): Promise<string> {
    return await this.getSSMParameter('HeliusApiKey', true);
  }
}
