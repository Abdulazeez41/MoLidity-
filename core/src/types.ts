export interface ParsedContract {
  contractName: string;
  baseContracts: string[];
  stateVariables: StateVariable[];
  functions: FunctionDefinition[];
  events: EventDefinition[];
  modifiers: ModifierDefinition[];
}

export interface StateVariable {
  name: string;
  type: string;
}

export interface FunctionDefinition {
  name: string;
  visibility: string;
  mutability: string;
  params: Parameter[];
  returns: Parameter[];
  body: string;
}

export interface EventDefinition {
  name: string;
  params: Parameter[];
}

export interface ModifierDefinition {
  name: string;
}

export interface Parameter {
  name: string;
  type: string;
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
  body?: string;
  src?: string;
}

export interface ABIParameter {
  name: string;
  type: string;
  components?: ABIParameter[];
}

export interface ParsedAbiResult {
  abi: ABIEntry[];
  stateVariables: { name: string; type: string }[];
}

export interface ABIEntryForImport {
  name?: string;
  inputs?: {
    type: string;
  }[];
}

export interface MappingInfo {
  name: string;
  keyType: string;
  valueType: string;
}

export interface AstNode {
  nodeType: string;
  [key: string]: any;
}

export interface FunctionDefinition extends ABIEntry {
  body: string;
}

export interface StatementHelperFunctions {
  walkStatements: (statements: AstNode[]) => string;
  walkExpression: (expr: AstNode) => string;
}
