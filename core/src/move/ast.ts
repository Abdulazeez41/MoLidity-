export type MoveNode =
  | ModuleNode
  | StructNode
  | FunctionNode
  | EventEmitNode
  | StatementNode
  | ExpressionNode;

export interface ModuleNode {
  type: "module";
  name: string;
  packageName: string;
  uses: UseStatement[];
  structs: StructNode[];
  functions: FunctionNode[];
}

export interface UseStatement {
  type: "use";
  path: string;
}

export interface StructNode {
  type: "struct";
  name: string;
  fields: StructField[];
  hasCopy: boolean;
  hasDrop: boolean;
  hasStore: boolean;
}

export interface StructField {
  name: string;
  type: string;
}

export type FunctionVisibility = "public" | "public entry" | "public(friend)";

export interface FunctionNode {
  type: "function";
  visibility: FunctionVisibility;
  name: string;
  params: Param[];
  returnType?: string;
  body: StatementNode[];
}

export interface Param {
  name: string;
  type: string;
}

export interface StatementNode {
  type: "statement";
  content: string;
}

export interface ExpressionNode {
  type: "expression";
  value: string;
}

export interface EventEmitNode {
  type: "event_emit";
  eventName: string;
  args: ExpressionNode[];
}  

export function createModuleNode(): ModuleNode {
  return {
    type: "module",
    name: "",
    packageName: "",
    uses: [],
    structs: [],
    functions: [],
  };
}
