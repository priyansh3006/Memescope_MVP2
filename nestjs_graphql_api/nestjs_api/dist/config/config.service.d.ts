export declare class ConfigService {
    private ssmClient;
    private region;
    constructor();
    getRegion(): string;
    getParameter(name: string): Promise<string>;
}
