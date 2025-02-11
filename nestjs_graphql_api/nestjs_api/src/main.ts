import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { SSMClient, GetParameterCommand } from "@aws-sdk/client-ssm";
import { CloudWatchLogsClient, PutLogEventsCommand, CreateLogStreamCommand } from "@aws-sdk/client-cloudwatch-logs";

// Initialize AWS Clients
const ssmClient = new SSMClient({ region: "us-east-1" });
const cloudWatchClient = new CloudWatchLogsClient({ region: "us-east-1" });

// Fetch parameters from AWS SSM
async function getSSMParameter(name: string): Promise<string | null> {
  try {
    const command = new GetParameterCommand({ Name: name, WithDecryption: true });
    const response = await ssmClient.send(command);
    return response.Parameter?.Value || null;
  } catch (error) {
    console.error(`Failed to fetch parameter ${name}:`, error);
    return null;
  }
}

// CloudWatch Logging
let logGroupName: string;
let logStreamName: string = `nestjs-log-stream-${Date.now()}`;

// Create CloudWatch Log Stream
async function createLogStream() {
  try {
    logGroupName = await getSSMParameter("cloudWatchLogGroup") || "/nestjs/default-log-group";

    const createStreamCommand = new CreateLogStreamCommand({
      logGroupName,
      logStreamName,
    });
    await cloudWatchClient.send(createStreamCommand);
  } catch (error) {
    console.error("Failed to create CloudWatch Log Stream:", error);
  }
}

// Send logs to CloudWatch
async function logToCloudWatch(message: string) {
  try {
    const timestamp = Date.now();
    const logCommand = new PutLogEventsCommand({
      logGroupName,
      logStreamName,
      logEvents: [{ message, timestamp }],
    });
    await cloudWatchClient.send(logCommand);
  } catch (error) {
    console.error("Failed to send log to CloudWatch:", error);
  }
}

// Bootstrap Function
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Initialize CloudWatch Logging
  await createLogStream();

  // Fetch AWS SSM parameters
  process.env.DYNAMODB_TABLE = process.env.DYNAMODB_TABLE || await getSSMParameter("dynamoDbTableName") || "helloworld";
  process.env.SNS_TOPIC_ARN = process.env.SNS_TOPIC_ARN || await getSSMParameter("snsTopicArn") || "helloworld";

  // Log environment variables
  logToCloudWatch(`Using DynamoDB Table: ${process.env.DYNAMODB_TABLE}`);
  logToCloudWatch(`Using SNS Topic ARN: ${process.env.SNS_TOPIC_ARN}`);

  if (!process.env.DYNAMODB_TABLE || !process.env.SNS_TOPIC_ARN) {
    logToCloudWatch("Missing AWS parameters! Ensure they are available in SSM or .env");
    process.exit(1);
  }

  // Start the server
  const port = configService.get<number>('PORT') || 3000;
  await app.listen(port);

  logToCloudWatch(`GraphQL API running on http://localhost:${port}/graphql`);
}

bootstrap();
