import { OnModuleInit } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
export declare class JupiterService implements OnModuleInit {
    private readonly httpService;
    constructor(httpService: HttpService);
    onModuleInit(): Promise<void>;
    getMultipleTokenPrices(tokenSymbols: string[]): Promise<Record<string, number>>;
}
