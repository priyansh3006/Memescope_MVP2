"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const config_1 = require("@nestjs/config");
const client_ssm_1 = require("@aws-sdk/client-ssm");
async function getSSMParameter(ssmClient, name) {
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
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const configService = app.get(config_1.ConfigService);
    const ssmClient = new client_ssm_1.SSMClient({ region: "us-east-1" });
    process.env.DYNAMODB_TABLE = process.env.DYNAMODB_TABLE || await getSSMParameter(ssmClient, "dynamoDbTableName") || "helloworld";
    process.env.SNS_TOPIC_ARN = process.env.SNS_TOPIC_ARN || await getSSMParameter(ssmClient, "snsTopicArn") || "helloworld";
    console.log(` Using DynamoDB Table: ${process.env.DYNAMODB_TABLE}`);
    console.log(`Using SNS Topic ARN: ${process.env.SNS_TOPIC_ARN}`);
    if (!process.env.DYNAMODB_TABLE || !process.env.SNS_TOPIC_ARN) {
        console.error("Missing AWS parameters! Ensure they are available in SSM or .env");
        process.exit(1);
    }
    const port = configService.get('PORT') || 3000;
    await app.listen(port);
    console.log(`✅ GraphQL API running on http://localhost:${port}/graphql`);
}
bootstrap();
//# sourceMappingURL=main.js.map