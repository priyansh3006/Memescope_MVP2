import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
export declare class DynamoService implements OnModuleInit {
    private readonly configService;
    private dynamoDB;
    private tableName;
    constructor(configService: ConfigService);
    onModuleInit(): Promise<void>;
    storeTopHolders(wallets: string[]): Promise<void>;
    getLeaderboard(): Promise<any[]>;
    updatePnL(walletAddress: string, pnl: number): Promise<void>;
}
