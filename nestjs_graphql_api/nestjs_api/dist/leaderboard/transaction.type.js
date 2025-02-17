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
exports.TransactionType = void 0;
const graphql_1 = require("@nestjs/graphql");
let TransactionType = class TransactionType {
};
exports.TransactionType = TransactionType;
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", String)
], TransactionType.prototype, "signature", void 0);
__decorate([
    (0, graphql_1.Field)(() => graphql_1.Int),
    __metadata("design:type", Number)
], TransactionType.prototype, "slot", void 0);
__decorate([
    (0, graphql_1.Field)(() => graphql_1.Int, { nullable: true }),
    __metadata("design:type", Number)
], TransactionType.prototype, "blockTime", void 0);
__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    __metadata("design:type", String)
], TransactionType.prototype, "confirmationStatus", void 0);
exports.TransactionType = TransactionType = __decorate([
    (0, graphql_1.ObjectType)()
], TransactionType);
exports.default = TransactionType;
//# sourceMappingURL=transaction.type.js.map