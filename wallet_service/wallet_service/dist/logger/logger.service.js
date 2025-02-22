"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoggerService = void 0;
const common_1 = require("@nestjs/common");
const client_cloudwatch_logs_1 = require("@aws-sdk/client-cloudwatch-logs");
const dotenv = require("dotenv");
dotenv.config();
let LoggerService = class LoggerService {
    constructor() {
        const region = process.env.AWS_REGION;
        const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
        const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
        this.logGroupName = process.env.CLOUDWATCH_LOG_GROUP || "DefaultLogGroup";
        this.logStreamName = `wallet-service-${Date.now()}`;
        if (!region || !accessKeyId || !secretAccessKey) {
            throw new Error("AWS credentials are missing. Check your .env file.");
        }
        this.cloudWatchClient = new client_cloudwatch_logs_1.CloudWatchLogsClient({
            region,
            credentials: {
                accessKeyId,
                secretAccessKey,
            },
        });
        console.log("CloudWatchLogsClient initialized successfully");
        this.createLogStream();
    }
    async createLogStream() {
        try {
            await this.cloudWatchClient.send(new client_cloudwatch_logs_1.CreateLogStreamCommand({
                logGroupName: this.logGroupName,
                logStreamName: this.logStreamName,
            }));
            console.log(`Log stream ${this.logStreamName} created in ${this.logGroupName}`);
        }
        catch (error) {
            console.error("Error creating log stream:", error);
        }
    }
    async log(message) {
        try {
            const logEvent = {
                message: JSON.stringify({ timestamp: new Date().toISOString(), message }),
                timestamp: Date.now(),
            };
            const response = await this.cloudWatchClient.send(new client_cloudwatch_logs_1.PutLogEventsCommand({
                logGroupName: this.logGroupName,
                logStreamName: this.logStreamName,
                logEvents: [logEvent],
                sequenceToken: this.sequenceToken,
            }));
            this.sequenceToken = response.nextSequenceToken;
        }
        catch (error) {
            console.error("Error sending log to CloudWatch:", error);
        }
    }
};
exports.LoggerService = LoggerService;
exports.LoggerService = LoggerService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], LoggerService);
//# sourceMappingURL=logger.service.js.map