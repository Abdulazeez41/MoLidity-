import { TranspilerPlugin } from "./plugin";
import { AstNode, StatementHelperFunctions } from "../types";

export const forLoopPlugin: TranspilerPlugin = {
    name: "forLoopPlugin",
    handleStatement(stmt: AstNode, helpers: StatementHelperFunctions): string | null {
      if (stmt.nodeType === "ForStatement") {
        const init = stmt.initialization
          ? helpers.walkStatements([stmt.initialization])
          : "";
        const condition = stmt.condition
          ? helpers.walkExpression(stmt.condition)
          : "true";
        const increment = stmt.increment
          ? helpers.walkExpression(stmt.increment)
          : "";
        const body = helpers.walkStatements(stmt.body.statements || []);
  
        return `
  {
    ${init}
    loop {
      if (!(${condition})) { break; }
      ${body}
      ${increment};
    }
  }`;
      }
      return null;
    },
  };