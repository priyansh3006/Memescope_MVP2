import { LoggerService } from '../logger/logger.service';
export declare class WalletService {
    private readonly logger;
    private dynamoDBClient;
    private docClient;
    private tableName;
    constructor(logger: LoggerService);
    followWallet(userId: string, address: string): Promise<boolean>;
    unfollowWallet(userId: string, address: string): Promise<boolean>;
    discoverNewTraders(): Promise<string[]>;
    getTrackedWallets(userId: string): Promise<string[]>;
}
