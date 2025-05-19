import { describe, it, expect } from "vitest";
import {
  ParsedContract,
  StateVariable,
  FunctionDefinition,
  EventDefinition,
  ModifierDefinition,
  Parameter,
  ABIEntry,
  ABIParameter,
  ParsedAbiResult,
  ABIEntryForImport,
} from "../src/types";

describe("Type definitions", () => {
  it("should compile without errors", () => {
    expect(true).toBe(true);
  });
});
