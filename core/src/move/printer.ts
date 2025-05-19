import {
  ModuleNode,
  StructNode,
  FunctionNode,
  UseStatement,
  StatementNode,
} from "./ast";
import { MoveTarget, TARGET_MAP, getMoveTarget } from "./targetMapper";

export function printMoveModule(
  ast: ModuleNode,
  moveTarget: MoveTarget
): string {
  const lines = [];

  lines.push(`module ${ast.packageName}::${ast.name} {`);

  for (const use of ast.uses) {
    lines.push(`  ${use.path};`);
  }

  for (const struct of ast.structs) {
    lines.push(printStruct(struct));
  }

  for (const fn of ast.functions) {
    lines.push(printFunction(fn));
  }

  lines.push("}");

  return lines.join("\n");
}

function printStruct(node: StructNode): string {
  const traits = [
    node.hasCopy ? "copy" : "",
    node.hasDrop ? "drop" : "",
    node.hasStore ? "store" : "",
  ]
    .filter(Boolean)
    .join(", ");

  const traitStr = traits.length ? `has ${traits}` : "";

  const fieldLines = node.fields.map((f) => `  ${f.name}: ${f.type},`);

  return `
struct ${node.name} ${traitStr} {
${fieldLines.join("\n")}
};
`.trim();
}

function printFunction(node: FunctionNode): string {
  const paramList = node.params.map((p) => `${p.name}: ${p.type}`).join(", ");
  const returnStr = node.returnType ? ` ${node.returnType}` : "";

  const bodyLines = node.body.map((stmt) => `  ${stmt.content}`).join("\n");

  return `
${node.visibility} fun ${node.name}(${paramList})${returnStr} {
${bodyLines}
}
`.trim();
}
