"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.erc20MappingPlugin = void 0;
exports.erc20MappingPlugin = {
    name: "erc20-mapping",
    getTypeOverrides() {
        return {
            IERC20: "0x2::coin::CoinStore",
        };
    },
    getLibraryOverrides() {
        return {
            IERC20: "0x2::coin",
        };
    },
};
