export declare class LoggerService {
    private cloudWatchClient;
    private logGroupName;
    private logStreamName;
    private sequenceToken;
    constructor();
    private createLogStream;
    log(message: string): Promise<void>;
}
