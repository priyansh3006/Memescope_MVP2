import { WalletService } from './wallet.service';
export declare class WalletResolver {
    private walletService;
    constructor(walletService: WalletService);
    followWallet(userId: string, address: string): Promise<boolean>;
    unfollowWallet(userId: string, address: string): Promise<boolean>;
    getTrackedWallets(userId: string): Promise<string[]>;
    discoverNewTraders(): Promise<string[]>;
}
