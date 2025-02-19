import { OnModuleInit } from '@nestjs/common';
export declare class ConfigService implements OnModuleInit {
    private ssmClient;
    constructor();
    onModuleInit(): Promise<void>;
    private getSSMParameter;
    getDynamoDBTable(): Promise<string>;
    getHeliusAPIKey(): Promise<string>;
}
