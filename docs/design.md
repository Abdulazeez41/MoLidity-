# 🧩 S2M - Solidity to Move Transpiler

This document outlines the architecture, design choices, and implementation structure of the **S2M** project — a **Solidity-to-Move** transpiler that converts Solidity smart contracts into Move modules compatible with **Sui** blockchains.

## 🏗️ 1. Project Overview

### 🔍 Goal

To provide a robust toolchain that:

- Parses Solidity `.sol` files or ABI `.json`
- Converts them into Move-compatible smart contract modules
- Supports multiple Move dialects (Sui and Aptos)
- Is modular, extensible via plugins, and integrates AI-based fallbacks for complex constructs
- Provides CLI and Web interfaces

---

## 📦 2. Monorepo Architecture

The project follows a **monorepo-style structure**, allowing modular development:

```
S2M/
├── README.md
├── package.json
├── tsconfig.json
├── transpiler.config.json      # Optional config file
│
├── core/
│   ├── src/
│   │   ├── abi/
│   │   │   ├── abiParser.ts
│   │   │   ├── solidityAstParser.ts
│   │   │   └── abiDocGenerator.ts
│   │   │
│   │   ├── move/
│   │   │   ├── importMapper.ts
│   │   │   ├── typeMapper.ts
│   │   │   ├── targetMapper.ts
│   │   │   ├── moveGenerator.ts
│   │   │   ├── generators/
│   │   │   │   ├── functionGenerator.ts
│   │   │   │   ├── eventGenerator.ts
│   │   │   │   ├── mappingGenerator.ts
│   │   │   │   └── errorGenerator.ts
│   │   │   └── ast.ts
│   │   │
│   │   ├── plugin/
│   │   │   ├── pluginManager.ts
│   │   │   └── advancedSyntaxPlugin.ts
│   │   │
│   │   ├── utils/
│   │   │   ├── logger.ts
│   │   │   ├── utils.ts
│   │   │   └── configLoader.ts
│   │   │
│   │   ├── types.ts
│   │   ├── config.ts
│   │   └── tomlUpdater.ts
│   │
│   └── tests/
│       ├── abiParser.test.ts
│       ├── moveGenerator.test.ts
│       └── typeMapper.test.ts
│
├── cli/
│   ├── src/
│   │   ├── cli.ts
│   │   ├── index.ts
│   │   └── fileWriter.ts
│   └── dist/                 # Compiled CLI output
│
├── web/
│   ├── backend/
│   │   ├── src/
│   │   │   ├── app.ts
│   │   │   ├── routes/
│   │   │   │   └── transpile.ts
│   │   │   └── types.ts
│   │   └── dist/             # Compiled backend output
│   │
│   ├── frontend/
│   │   ├── public/
│   │   │   └── assets/
│   │   │       └── S2M.png
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   └── FileUploader.tsx
│   │   │   ├── App.tsx
│   │   │   └── main.tsx
│   │   ├── index.html
│   │   └── vite.config.ts
│   │
└── docs/
    ├── design.md
    └── .placeholder
```

Each folder is a standalone module with shared utilities in `core/`.

---

## 🧠 3. Key Design Decisions

### ✅ AST-Based Parsing & Generation

- Solidity source is compiled using `solc` to extract AST
- Move code is generated from structured AST nodes
- Ensures correctness, traceability, and better error handling

### 🔄 Framework Abstraction (Sui/Aptos)

- Uses `MoveTarget` abstraction to handle framework-specific syntax
- Each target defines its own:
  - Import statements
  - Table initialization
  - Event/emitter patterns
  - Context usage (`TxContext`, `Account`)
- Defined in: `core/src/move/targetMapper.ts`

### 🧱 Modular Move Code Generation

- Move code is built using an **AST-based approach**
- Each component (functions, structs, events) is generated separately and composed at the end
- Allows for plugin extensions and testing

### 🛠️ Type Mapping Strategy

- Built-in type mappings between Solidity and Move
- Complex types like arrays, tuples, and structs are recursively parsed
- Mappings → `Table::Table<_, _>`
- Events → Structs + emit logic
- Custom types can be overridden via config or plugins

### 🧩 Plugin System

- Plugin hooks allow extending:
  - Before/after ABI parsing
  - Before/after Move generation
  - Type overrides
  - Library imports
- Plugins can be written to add support for new Solidity features
- Implemented in: `core/src/plugin/`

### 🌐 Web Interface

- A **React-based frontend** allows users to upload `.sol` or `.json`
- Move code is displayed with syntax highlighting
- Users can download the generated `.move` file
- Optional: Toggle between Move code and raw AST dump

### 🖥️ CLI Tool

- CLI supports:
  - File input/output
  - Target framework selection (`--target sui/aptos`)
  - Dry run mode (`--dry-run`)
  - AST dump (`--dump-ast`)
- Fully configurable via `transpiler.config.json`

### 🤖 AI Integration (Optional)

- DeepSeek Coder model integration via API
- Used as fallback for unsupported syntax
- Can suggest Move equivalents for unknown Solidity types
- Generates Move code when deterministic rules don't apply
- Implemented in: `core/src/ai/deepseekAiService.ts`

---

## ⚙️ 4. Core Components

### 1. `core/src/abi/solidityAstParser.ts`

- Compiles Solidity code using `solc`
- Extracts AST for function/event/state variable analysis
- Handles external imports via resolver callback
- Returns `ParsedContract[]` objects

```ts
interface ParsedContract {
  contractName: string;
  baseContracts: string[];
  stateVariables: StateVariable[];
  functions: FunctionDefinition[];
  events: EventDefinition[];
  modifiers: ModifierDefinition[];
}
```

---

### 2. `core/src/abi/abiParser.ts`

- Parses standard `.abi.json` files
- Maps ABI entries to Move function definitions
- Detects function types: `function`, `event`, `error`, `constructor`

---

### 3. `core/src/move/typeMapper.ts`

- Centralized type conversion system
- Maps Solidity types to Move types:
  - `uint256` → `u256`
  - `address` → `address`
  - `bool` → `bool`
  - `mapping(...)` → `Table::Table<_, _>`
  - `tuple`, `struct` → custom Move structs
- Supports nested arrays, mappings, and structs

```ts
export function mapSolidityTypeToMove(
  type: string,
  components?: any[],
  contextName = "Tuple",
  customTypes: Record<string, string> = {}
): { moveType: string; structs: MoveStruct[] };
```

---

### 4. `core/src/move/importMapper.ts`

- Maps Solidity libraries to Move imports
- Adds framework-specific imports (`use sui::table`, etc.)
- Example mapping:

```ts
const solidityToMoveLibraryMap: Record<string, string> = {
  SafeMath: "0x1::SafeMath",
  Ownable: "0x1::AccessControl",
  IERC20: "0x1::coin",
  Address: "0x1::AddressUtils",
};
```

---

### 5. `core/src/move/moveGenerator.ts`

- Main Move generator
- Builds full module from AST or ABI
- Uses AST-based node generation for modularity
- Handles:
  - Structs
  - Functions
  - Events
  - Error structs
  - Init function

```ts
function generateMoveModule(
  name: string,
  abi: ABIEntry[],
  inferredLibs: string[],
  stateVariables: StateVariable[],
  options: TranspilerConfig
): string;
```

---

### 6. `core/src/move/generators/`

#### `functionGenerator.ts`

- Generates Move function bodies from Solidity function logic
- Supports `require()`, `revert()`, basic expressions

```ts
function generateFunctionBody(entry: ABIEntry): GeneratedFunctionBody;
```

#### `eventGenerator.ts`

- Solidity events → Move structs
- Emits event structs inside Move functions

```ts
function generateEventStruct(
  entry: ABIEntry,
  structDefs: Map<string, string>
): string;
```

#### `mappingGenerator.ts`

- Parses `mapping(...)` syntax
- Converts to `Table::Table<_, _>` for Sui/Aptos

```ts
function parseMappingType(type: string): MappingInfo;
```

#### `errorGenerator.ts`

- Solidity errors → Move structs
- Emits abort logic where needed

```ts
function generateCustomErrorStruct(
  name: string,
  fields: StructField[]
): StructNode;
```

---

### 7. `core/src/move/ast.ts`

- Abstract Syntax Tree representation for Move
- Helps build Move code programmatically

```ts
export type FunctionVisibility = "public" | "public entry" | "public(friend)";
export interface Param {
  name: string;
  type: string;
}
export interface StatementNode {
  type: "statement";
  content: string;
}
export interface ModuleNode {
  type: "module";
  name: string;
  packageName: string;
  uses: UseStatement[];
  structs: StructNode[];
  functions: FunctionNode[];
}
```

---

### 8. `core/src/move/printer.ts`

- Converts AST back to Move code
- Handles formatting, indentation, and trait declarations

```ts
export function printMoveModule(
  ast: ModuleNode,
  moveTarget: MoveTarget
): string;
```

---

### 9. `core/src/plugin/`

- Plugin interface enables extension points
- Supports adding new type mappers, import resolvers, or AST transformers

```ts
export interface TranspilerPlugin {
  name: string;

  beforeParseABI?(rawABI: any[]): void;
  afterParseABI?(parsedABI: ABIEntry[]): ABIEntry[];

  beforeGenerateMove?(contractName: string, abi: ABIEntry[]): void;
  afterGenerateMove?(moveCode: string): string;

  getTypeOverrides?(): Record<string, string>;
  getLibraryOverrides?(): Record<string, string>;
}
```

---

## 🧪 5. Testing Strategy

### Unit Tests

- Located in: `core/tests/`
- Tests include:
  - ABI parsing
  - Type mapping
  - Move generation
  - Plugin behavior

```bash
vitest run
```

### Integration Tests

- End-to-end test using sample Solidity files
- Validates correct Move output
- Checks for linter compatibility

```bash
cd move-project && sui move test
```

---

## 🧩 6. Plugin Examples

### `advancedSyntaxPlugin.ts`

- Handles try/catch, inline assembly
- Returns placeholder comments or AI-generated code

```ts
export const advancedSyntaxPlugin = (): TranspilerPlugin => ({
  name: "advancedSyntaxPlugin",
  handleStatement(
    stmt: AstNode,
    helpers: StatementHelperFunctions
  ): string | null {
    if (stmt.nodeType === "TryStatement") {
      return generateTryCatch(stmt, helpers);
    } else if (stmt.nodeType === "InlineAssemblyStatement") {
      return generateInlineAssembly(stmt);
    }
    return null;
  },
});
```

### `forLoopPlugin.ts`

- Translates `for (...) { ... }` into `loop {}` pattern

```ts
return `// [UNSUPPORTED] Solidity for loop not yet supported`;
```

---

## 🧑‍💻 7. CLI Tool

### Features

- Accepts `.sol` and `.json` files
- Outputs Move code to console or file
- Supports:
  - `--target sui/aptos`
  - `--dry-run`
  - `--dump-ast`
  - `--skip-lint`
  - Configurable via `transpiler.config.json`

### Example Usage

```bash
s2m transpile -i examples/MyToken.sol -n MyToken --target sui --dry-run
```

---

## 🌐 8. Web Interface

### Backend

- RESTful API at `/api/transpile/upload/`
- Accepts file upload and returns Move code or AST
- Handles large files via memory-safe uploads

### Frontend

- Built with React + Tailwind CSS
- Includes:
  - File uploader
  - Contract name input
  - Target framework selector
  - Move code preview with syntax highlighting
  - Download button for `.move` file
  - AST dump toggle

---

## 🎨 9. UI Design

### FileUploader.tsx

- Upload `.sol` or `.json`
- Choose contract name and target platform
- View Move code with syntax highlighting
- Download Move file directly

```tsx
<label className="flex items-center gap-2 mb-4">
  <input
    type="checkbox"
    checked={dumpAst}
    onChange={() => setDumpAst(!dumpAst)}
  />
  <span>Dump AST instead of Move code</span>
</label>
```

---

## 🧠 10. AI Integration Design

### `core/src/ai/AIService.ts`

- Abstracts LLM interaction
- Allows easy switch between OpenAI, Anthropic, Groq, DeepSeek

### `core/src/ai/deepseekAiService.ts`

- Implements `AIService` using DeepSeek Coder API
- Used for:
  - Type suggestions
  - Fallback translation
  - Error explanation
  - Dynamic plugin generation

```ts
async translateSolidityToMove(code: string): Promise<string>
async suggestMoveMapping(type: string): Promise<string>
async explainError(error: string): Promise<string>
```

---

## 📁 11. Configuration System

### `transpiler.config.json`

- Define default values for:
  - Target framework (`sui`, `aptos`)
  - Module name override
  - Package name override
  - Custom type mappings
  - Inferred libs

Example:

```json
{
  "target": "sui",
  "moduleName": "MyToken",
  "packageName": "token_module",
  "customTypes": {
    "MyLib.MyEnum": "MyMoveEnum"
  },
  "libs": ["event", "table"]
}
```

---

## 🧭 12. Roadmap Enhancements

| Feature                  | Description                                           |
| ------------------------ | ----------------------------------------------------- |
| ✅ Basic Conversion      | Convert simple Solidity functions to Move             |
| ✅ Event Support         | Generate Move structs and emit logic                  |
| ✅ Mapping Support       | Solidity `mapping(...) → Table::Table<_, _>`          |
| ✅ Multiple Contracts    | Handle multiple Solidity contracts per file           |
| ✅ Source Mapping        | Add comments linking to original Solidity             |
| ✅ CLI Options           | `--target`, `--dry-run`, `--dump-ast`                 |
| ✅ Web UI                | Upload + preview + download Move code                 |
| 🟡 Move.toml Scaffolding | Auto-generate Move project structure                  |
| 🟡 Multi-contract Output | One `.move` per Solidity contract                     |
| 🟡 Full AST Printer      | Pretty-print Move AST                                 |
| 🔜 Aptos Support         | Add MoveStdlib support                                |
| 🔜 AI-Powered Plugins    | Let AI generate Move utility plugins from description |
| 🔜 Unit Tests            | For Move generator and AST builder                    |

---

## 🧪 13. Known Limitations

| Area               | Limitation                          |
| ------------------ | ----------------------------------- |
| Inline Assembly    | Not supported, emits warning        |
| Try/Catch          | Emitted as placeholder              |
| Custom Errors      | Supported but no helper functions   |
| Nested Structs     | Limited depth support               |
| External Libraries | Currently assume they exist in Move |
| Complex Loops      | Only basic `for` support            |

---

## 📊 14. Technical Debt / Areas for Improvement

| Task                                    | Status         |
| --------------------------------------- | -------------- |
| Better mapping validation               | 🟡 In Progress |
| Structured Move tests                   | 🔜 Coming Soon |
| Move.toml scaffolding                   | 🔜 Coming Soon |
| Full AST printer                        | 🔜 Coming Soon |
| Recursive tuple parsing                 | ✅ Done        |
| Graceful fallback for unsupported types | ✅ Done        |
| AI-powered linting                      | 🔜 Coming Soon |

---

## 📄 15. Appendix

### Example Solidity → Move

#### Solidity

```solidity
contract MyToken {
  uint public totalSupply;
  mapping(address => uint) public balances;

  function mint(address to, uint amount) public {
    require(to != address(0), "Invalid recipient");
    balances[to] += amount;
  }
}
```

#### Move (Sui)

```move
module my_token::MyToken {
  use sui::object;
  use sui::transfer;
  use sui::tx_context;
  use sui::table;
  use sui::event;

  struct MyToken has key {
    id: UID,
    owner: address,
    totalSupply: u64,
    balances: Table::Table<address, u64>,
  };

  fun init(ctx: &mut TxContext): MyToken {
    transfer::transfer(MyToken {
      id: object::new(ctx),
      owner: tx_context::sender(ctx),
      totalSupply: 0,
      balances: table::new<address, u64>(ctx),
    }, tx_context::sender(ctx))
  }

  public entry fun mint(self: &mut MyToken, to: address, amount: u64, ctx: &mut TxContext) {
    assert!(to != ::default(), 0); // Reverted by condition
    self.balances.borrow_mut(&to).value = self.balances.borrow_mut(&to).value + amount;
  }
}
```

---

## 📜 16. License

MIT License – see `LICENSE` file
