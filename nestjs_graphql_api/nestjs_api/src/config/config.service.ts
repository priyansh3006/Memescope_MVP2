import { Injectable } from '@nestjs/common';
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';

@Injectable()
export class ConfigService {
  private ssmClient: SSMClient;
  private region: string;

  constructor() {
    // Get AWS Region from environment variable set by Pulumi
    this.region = process.env.AWS_REGION || 'us-east-1';

    // Initialize AWS SSM Client
    this.ssmClient = new SSMClient({ region: this.region });

    console.log(`ConfigService initialized with AWS Region: ${this.region}`);
  }

  /**
   * Returns the AWS region being used.
   * AWS does not allow fetching the region from SSM, so we use an environment variable.
   */
  getRegion(): string {
    return this.region;
  }

  /**
   * Fetches parameters from AWS SSM Parameter Store.
   * @param name The name of the parameter to fetch.
   * @returns The value of the parameter as a string.
   */
  async getParameter(name: string): Promise<string> {
    try {
      const command = new GetParameterCommand({
        Name: name,
        WithDecryption: true,
      });
      const response = await this.ssmClient.send(command);
      console.log(`Successfully fetched parameter: ${name} -> ${response.Parameter?.Value}`);
      return response.Parameter?.Value || '';
    } catch (error) {
      console.error(`Failed to get parameter ${name}: ${error}`);
      return '';
    }
  }
}
