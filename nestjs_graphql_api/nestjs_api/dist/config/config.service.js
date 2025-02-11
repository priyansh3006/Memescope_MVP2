"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigService = void 0;
const common_1 = require("@nestjs/common");
const client_ssm_1 = require("@aws-sdk/client-ssm");
let ConfigService = class ConfigService {
    constructor() {
        this.region = process.env.AWS_REGION || 'us-east-1';
        this.ssmClient = new client_ssm_1.SSMClient({ region: this.region });
        console.log(`ConfigService initialized with AWS Region: ${this.region}`);
    }
    getRegion() {
        return this.region;
    }
    async getParameter(name) {
        try {
            const command = new client_ssm_1.GetParameterCommand({
                Name: name,
                WithDecryption: true,
            });
            const response = await this.ssmClient.send(command);
            console.log(`Successfully fetched parameter: ${name} -> ${response.Parameter?.Value}`);
            return response.Parameter?.Value || '';
        }
        catch (error) {
            console.error(`Failed to get parameter ${name}: ${error}`);
            return '';
        }
    }
};
exports.ConfigService = ConfigService;
exports.ConfigService = ConfigService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], ConfigService);
//# sourceMappingURL=config.service.js.map