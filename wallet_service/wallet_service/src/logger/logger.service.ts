import { Injectable } from '@nestjs/common';
import { CloudWatchLogsClient, PutLogEventsCommand, CreateLogStreamCommand } from "@aws-sdk/client-cloudwatch-logs";
import * as dotenv from 'dotenv';

dotenv.config();

@Injectable()
export class LoggerService {
  private cloudWatchClient: CloudWatchLogsClient;
  private logGroupName: string;
  private logStreamName: string;
  private sequenceToken: string | undefined;

  constructor() {
    const region = process.env.AWS_REGION;
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
    this.logGroupName = process.env.CLOUDWATCH_LOG_GROUP || "DefaultLogGroup"; // Ensure log group is defined
    this.logStreamName = `wallet-service-${Date.now()}`; // Unique stream name

    // Validate environment variables
    if (!region || !accessKeyId || !secretAccessKey) {
      throw new Error("AWS credentials are missing. Check your .env file.");
    }

    // Initialize CloudWatch Client
    this.cloudWatchClient = new CloudWatchLogsClient({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    console.log("CloudWatchLogsClient initialized successfully");

    // Create log stream on startup
    this.createLogStream();
  }

  private async createLogStream() {
    try {
      await this.cloudWatchClient.send(
        new CreateLogStreamCommand({
          logGroupName: this.logGroupName,
          logStreamName: this.logStreamName,
        })
      );
      console.log(`Log stream ${this.logStreamName} created in ${this.logGroupName}`);
    } catch (error) {
      console.error("Error creating log stream:", error);
    }
  }

  async log(message: string) {
    try {
      const logEvent = {
        message: JSON.stringify({ timestamp: new Date().toISOString(), message }),
        timestamp: Date.now(),
      };

      const response = await this.cloudWatchClient.send(
        new PutLogEventsCommand({
          logGroupName: this.logGroupName,
          logStreamName: this.logStreamName,
          logEvents: [logEvent],
          sequenceToken: this.sequenceToken,
        })
      );

      this.sequenceToken = response.nextSequenceToken;
    } catch (error) {
      console.error("Error sending log to CloudWatch:", error);
    }
  }
}
