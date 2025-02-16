export declare class Trade {
    tradeId: string;
    timestamp: string;
    price: number;
    volume: number;
    trader: string;
    action: string;
}
export declare class TraderStats {
    trader: string;
    totalProfit: number;
    totalLoss: number;
}
export declare class TraderPnL {
    totalProfit: number;
    totalLoss: number;
}
