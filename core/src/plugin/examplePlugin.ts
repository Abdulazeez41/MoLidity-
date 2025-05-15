import { TranspilerPlugin } from "./plugin";

export const erc20MappingPlugin: TranspilerPlugin = {
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
