import * as fs from "fs";
import { z } from "zod";
import { ABIEntry, ABIParameter } from "../types";

const abiParameterSchema: z.Schema<ABIParameter> = z.lazy(() =>
  z.object({
    name: z.string(),
    type: z.string(),
    components: z.array(abiParameterSchema).optional(),
  })
);

const abiEntrySchema = z.object({
  type: z.union([
    z.literal("function"),
    z.literal("event"),
    z.literal("constructor"),
    z.string(),
  ]),
  name: z.string().optional(),
  inputs: z.array(abiParameterSchema).optional(),
  outputs: z.array(abiParameterSchema).optional(),
  stateMutability: z.string().optional(),
  anonymous: z.boolean().optional(),
  payable: z.boolean().optional(),
  constant: z.boolean().optional(),
});

export type ParsedABI = {
  abi: ABIEntry[];
  stateVariables: { name: string; type: string }[];
};

export function parseFullABI(filePath: string): ParsedABI {
  const raw = fs.readFileSync(filePath, "utf-8");
  const abi = JSON.parse(raw);
  const validatedAbi = abiEntrySchema.array().parse(abi);

  const stateVariables: { name: string; type: string }[] = [];
  for (const entry of validatedAbi) {
    if (entry.type === "constructor" && Array.isArray(entry.inputs)) {
      for (const param of entry.inputs) {
        if (param.name) {
          stateVariables.push({ name: param.name, type: param.type });
        }
      }
    }
  }

  return { abi: validatedAbi, stateVariables };
}

export function getFunctionABIs(abi: ABIEntry[]): ABIEntry[] {
  return abi.filter((item): item is ABIEntry => item.type === "function");
}
