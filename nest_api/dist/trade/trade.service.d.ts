import { HeliusService } from '../helius/helius.service';
import { JupiterService } from '../jupiter/jupiter.service';
export declare class TradeService {
    private readonly heliusService;
    private readonly jupiterService;
    constructor(heliusService: HeliusService, jupiterService: JupiterService);
    calculatePnL(walletAddress: string): Promise<number>;
}
