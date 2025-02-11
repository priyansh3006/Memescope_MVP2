"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const config_1 = require("@nestjs/config");
const client_ssm_1 = require("@aws-sdk/client-ssm");
const client_cloudwatch_logs_1 = require("@aws-sdk/client-cloudwatch-logs");
const ssmClient = new client_ssm_1.SSMClient({ region: "us-east-1" });
const cloudWatchClient = new client_cloudwatch_logs_1.CloudWatchLogsClient({ region: "us-east-1" });
async function getSSMParameter(name) {
    try {
        const command = new client_ssm_1.GetParameterCommand({ Name: name, WithDecryption: true });
        const response = await ssmClient.send(command);
        return response.Parameter?.Value || null;
    }
    catch (error) {
        console.error(`Failed to fetch parameter ${name}:`, error);
        return null;
    }
}
let logGroupName;
let logStreamName = `nestjs-log-stream-${Date.now()}`;
async function createLogStream() {
    try {
        logGroupName = await getSSMParameter("cloudWatchLogGroup") || "/nestjs/default-log-group";
        const createStreamCommand = new client_cloudwatch_logs_1.CreateLogStreamCommand({
            logGroupName,
            logStreamName,
        });
        await cloudWatchClient.send(createStreamCommand);
    }
    catch (error) {
        console.error("Failed to create CloudWatch Log Stream:", error);
    }
}
async function logToCloudWatch(message) {
    try {
        const timestamp = Date.now();
        const logCommand = new client_cloudwatch_logs_1.PutLogEventsCommand({
            logGroupName,
            logStreamName,
            logEvents: [{ message, timestamp }],
        });
        await cloudWatchClient.send(logCommand);
    }
    catch (error) {
        console.error("Failed to send log to CloudWatch:", error);
    }
}
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const configService = app.get(config_1.ConfigService);
    await createLogStream();
    process.env.DYNAMODB_TABLE = process.env.DYNAMODB_TABLE || await getSSMParameter("dynamoDbTableName") || "helloworld";
    process.env.SNS_TOPIC_ARN = process.env.SNS_TOPIC_ARN || await getSSMParameter("snsTopicArn") || "helloworld";
    logToCloudWatch(`Using DynamoDB Table: ${process.env.DYNAMODB_TABLE}`);
    logToCloudWatch(`Using SNS Topic ARN: ${process.env.SNS_TOPIC_ARN}`);
    if (!process.env.DYNAMODB_TABLE || !process.env.SNS_TOPIC_ARN) {
        logToCloudWatch("Missing AWS parameters! Ensure they are available in SSM or .env");
        process.exit(1);
    }
    const port = configService.get('PORT') || 3000;
    await app.listen(port);
    logToCloudWatch(`GraphQL API running on http://localhost:${port}/graphql`);
}
bootstrap();
//# sourceMappingURL=main.js.map