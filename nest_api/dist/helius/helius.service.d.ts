import { OnModuleInit } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '../config/config.service';
export declare class HeliusService implements OnModuleInit {
    private readonly httpService;
    private readonly configService;
    private heliusApiKey;
    constructor(httpService: HttpService, configService: ConfigService);
    onModuleInit(): Promise<void>;
    private sleep;
    getTopHolders(tokenMint: string): Promise<string[]>;
    getWalletTransactions(walletAddress: string, limit?: number): Promise<any[]>;
    private extractBuySellTransactions;
}
