import { ABIEntry } from "../../types";
import { sanitizeIdentifier } from "../../utils/utils";
import { getDefaultInitialValue } from "../typeMapper";

export interface GeneratedFunctionBody {
  body: string;
  requiresAbortImport: boolean;
}

export function generateFunctionBody(entry: ABIEntry): GeneratedFunctionBody {
  const lines: string[] = [];
  let requiresAbortImport = false;

  if (entry.type === "event") {
    const eventName = `${sanitizeIdentifier(entry.name || "Unknown")}Event`;
    const fieldAssignments = (entry.inputs || [])
      .map((param, i) => {
        const paramName = param.name
          ? sanitizeIdentifier(param.name)
          : `arg${i}`;
        const defaultValue = getDefaultInitialValue(param.type);
        return `${paramName}: ${defaultValue}`;
      })
      .join(",\n    ");

    lines.push(`event::emit(${eventName} {\n    ${fieldAssignments}\n});`);

    return {
      body: lines.map((line) => `    ${line}`).join("\n"),
      requiresAbortImport: false,
    };
  }

  if (!entry.body || entry.body.trim() === "") {
    return {
      body: "    // No body found in ABI",
      requiresAbortImport: false,
    };
  }

  const bodyLines = entry.body.split("\n");
  for (const line of bodyLines) {
    const trimmedLine = line.trim();

    if (trimmedLine.startsWith("require")) {
      const match = trimmedLine.match(/require\s*$(.*?)(?:,\s*["'](.*)["'])?$/);
      if (match) {
        const condition = match[1].trim();
        const message = match[2] || "Reverted";
        lines.push(`assert!(${condition}, ${JSON.stringify(message)});`);
        requiresAbortImport = true;
      } else {
        lines.push(`abort(0); // Invalid require statement`);
        requiresAbortImport = true;
      }
    } else if (trimmedLine.includes("revert")) {
      const match = trimmedLine.match(/revert\s*(\w+)/);
      if (match) {
        const errorName = sanitizeIdentifier(match[1]);
        lines.push(`abort(${errorName}Error {}, 0);`);
        requiresAbortImport = true;
      } else {
        lines.push(`abort(0); // Revert without reason`);
        requiresAbortImport = true;
      }
    } else if (trimmedLine.includes("onlyOwner")) {
      lines.push("assert!(tx_context::sender(ctx) == self.owner, 0);");
      requiresAbortImport = true;
    } else if (trimmedLine.includes("transfer")) {
      lines.push("// Example: coin::transfer(...) logic here");
    } else if (trimmedLine.startsWith("if ")) {
      lines.push(trimmedLine);
    } else if (trimmedLine.startsWith("return ")) {
      lines.push(trimmedLine);
    } else if (trimmedLine.endsWith(";")) {
      lines.push(trimmedLine);
    } else if (trimmedLine === "") {
      continue;
    } else {
      lines.push(`// [UNSUPPORTED] ${trimmedLine}`);
    }
  }
  return {
    body: lines.map((line) => `    ${line}`).join("\n"),
    requiresAbortImport,
  };
}
