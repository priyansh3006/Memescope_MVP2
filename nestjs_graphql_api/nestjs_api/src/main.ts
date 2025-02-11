import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { SSMClient, GetParameterCommand } from "@aws-sdk/client-ssm";

async function getSSMParameter(ssmClient: SSMClient, name: string): Promise<string | null> {
  try {
    const command = new GetParameterCommand({ Name: name, WithDecryption: true });
    const response = await ssmClient.send(command);
    return response.Parameter?.Value || null;
  } catch (error) {
    console.error(`Failed to fetch parameter ${name}:`, error);
    return null;
  }
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // AWS SSM Client Initialization
  const ssmClient = new SSMClient({ region: "us-east-1" });

  // Load AWS parameters from SSM if not available in env
  process.env.DYNAMODB_TABLE = process.env.DYNAMODB_TABLE || await getSSMParameter(ssmClient, "dynamoDbTableName") || "helloworld";
  process.env.SNS_TOPIC_ARN = process.env.SNS_TOPIC_ARN || await getSSMParameter(ssmClient, "snsTopicArn") || "helloworld";

  //debugging the dynamoDB and SNS parameters
  console.log(` Using DynamoDB Table: ${process.env.DYNAMODB_TABLE}`);
  console.log(`Using SNS Topic ARN: ${process.env.SNS_TOPIC_ARN}`);

  // Ensure parameters are set
  if (!process.env.DYNAMODB_TABLE || !process.env.SNS_TOPIC_ARN) {
    console.error("Missing AWS parameters! Ensure they are available in SSM or .env");
    process.exit(1);
  }

  // Get port from ConfigService or default to 3000
  const port = configService.get<number>('PORT') || 3000;
  await app.listen(port);
  console.log(` GraphQL API running on http://localhost:${port}/graphql`);
}

bootstrap();
