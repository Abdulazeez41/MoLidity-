const RESERVED_KEYWORDS = new Set([
  "module",
  "fun",
  "struct",
  "public",
  "script",
  "move",
  "use",
  "native",
  "return",
  "let",
  "if",
  "else",
  "while",
  "loop",
  "true",
  "false",
  "address",
  "vector",
  "signer",
  "copy",
  "borrow",
]);

export function sanitizeIdentifier(name: string): string {
  // Replace invalid characters with underscore
  let safeName = name.replace(/[^a-zA-Z0-9_]/g, "_");

  // Collapse multiple underscores to one
  safeName = safeName.replace(/_+/g, "_");

  // Trim leading/trailing underscores
  safeName = safeName.replace(/^_+|_+$/g, "");

  // Prepend underscore if it starts with a digit
  if (/^\d/.test(safeName)) {
    safeName = "_" + safeName;
  }

  // Append underscore if it’s a reserved keyword
  if (RESERVED_KEYWORDS.has(safeName)) {
    safeName = safeName + "_";
  }

  return safeName;
}

export function formatStruct(
  name: string,
  fields: { name: string; type: string }[]
): string {
  const formattedFields = fields
    .map((f) => `  ${sanitizeIdentifier(f.name)}: ${f.type},`)
    .join("\n");

  return `struct ${name} has copy, drop, store {
              ${formattedFields}
          };`;
}
