import { AstNode, StatementHelperFunctions } from "../types";
import { TranspilerPlugin } from "./plugin";

export const advancedSyntaxPlugin = (): TranspilerPlugin => ({
  name: "advancedSyntaxPlugin",

  handleStatement(
    stmt: AstNode,
    helpers: StatementHelperFunctions
  ): string | null {
    switch (stmt.nodeType) {
      case "TryStatement":
        return generateTryCatch(stmt, helpers);

      case "InlineAssemblyStatement":
        return generateInlineAssembly(stmt);

      default:
        return null;
    }
  },
});

function generateTryCatch(
  stmt: AstNode,
  helpers: StatementHelperFunctions
): string {
  const tryBlock = helpers.walkStatements(stmt.body.statements || []);
  const catchClauses = (stmt.catchClauses || []).map((clause: AstNode) => {
    const clauseName = clause.functionName || "error";
    const clauseBody = helpers.walkStatements(clause.body?.statements || []);
    return `
      // Catch clause: ${clauseName}
      ${clauseBody}
      `;
  });

  return `
  // [UNSUPPORTED] Solidity try/catch is not natively supported in Move
  // Converted to fallback logic with warning
  {
    let success = true;
    ${tryBlock}
    if (!success) {
      ${catchClauses.join("\n")}
    }
  }
  `;
}

function generateInlineAssembly(stmt: AstNode): string {
  const body = stmt.inlineAssembly ? stmt.inlineAssembly.yul : "<unknown>";
  return `
  // [UNSUPPORTED] Solidity inline assembly not supported in Move
  // Original YUL code:
  /*
  ${body}
  */
  `;
}
