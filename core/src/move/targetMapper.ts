export interface MoveTarget {
  useStatements: string[];
  initTemplate: (contractName: string, stateFields: string) => string;
  tableImport: string;
  transferInit: string;
  abortImport?: string;
  eventImport?: string;
  vectorType: string;
}

const SUI_TARGET: MoveTarget = {
  useStatements: [
    "use sui::object",
    "use sui::transfer",
    "use sui::tx_context",
  ],
  tableImport: "use sui::table;",
  abortImport: "use sui::abort;",
  eventImport: "use sui::event;",
  vectorType: "vector<u8>",
  initTemplate: getSuiInitTemplate,
  transferInit: "transfer::transfer",
};

const APTOS_TARGET: MoveTarget = {
  useStatements: [
    "use aptos_std::signer",
    "use aptos_std::account",
    "use aptos_std::table",
  ],
  tableImport: "use aptos_std::table;",
  abortImport: "use move_core_types::errors;",
  eventImport: "use aptos_std::event;",
  vectorType: "vector<u8>",
  initTemplate: getAptosInitTemplate,
  transferInit: "move_to",
};

export const TARGET_MAP: Record<string, MoveTarget> = {
  sui: SUI_TARGET,
  aptos: APTOS_TARGET,
};

export function getMoveTarget(targetName: string): MoveTarget {
  const target = TARGET_MAP[targetName.toLowerCase()];
  if (!target) {
    throw new Error(`Unsupported Move target: ${targetName}`);
  }
  return target;
}

function getSuiInitTemplate(contractName: string, stateFields: string): string {
  return `
  fun init(ctx: &mut TxContext) {
      transfer::transfer(${contractName} {
          id: object::new(ctx),
          owner: tx_context::sender(ctx),
          ${stateFields}
      }, tx_context::sender(ctx));
  }`;
}

function getAptosInitTemplate(
  contractName: string,
  stateFields: string
): string {
  return `
  fun init(ctx: &mut Account) {
      let sender = signer::address_of(ctx);
      move_to(ctx, ${contractName} {
          owner: sender,
          ${stateFields}
      });
  }`;
}
