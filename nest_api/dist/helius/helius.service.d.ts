import { OnModuleInit } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
export declare class HeliusService implements OnModuleInit {
    private readonly httpService;
    private heliusApiKey;
    constructor(httpService: HttpService);
    onModuleInit(): Promise<void>;
    getTopHolders(tokenMint: string): Promise<string[]>;
    getWalletTransactions(walletAddress: string, limit?: number): Promise<any[]>;
    private extractBuySellTransactions;
}
