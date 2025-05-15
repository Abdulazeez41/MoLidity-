export interface ABIEntryForImport {
  name?: string;
  inputs?: {
    type: string;
  }[];
}

export interface ParsedAbiResult {
  abi: ABIEntry[];
  stateVariables: { name: string; type: string }[];
}

export interface ABIParameter {
  name: string;
  type: string;
  components?: ABIParameter[];
}

export interface ABIEntry {
  type: "function" | "event" | "constructor" | string;
  name?: string;
  inputs?: ABIParameter[];
  outputs?: ABIParameter[];
  stateMutability?: string;
  anonymous?: boolean;
  payable?: boolean;
  constant?: boolean;
}

export interface ParsedContract {
  contractName: string;
  stateVariables: { name: string; type: string }[];
  functions: {
    name: string;
    params: { name: string; type: string }[];
    returns: { name: string; type: string }[];
    visibility: string;
    mutability: string;
    body: string;
  }[];
}
