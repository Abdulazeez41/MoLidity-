# 🔄 S2M - Solidity to Move Transpiler

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A robust monorepo-based toolchain that transpiles Solidity smart contract **ABIs or source `.sol` files** into Move-compatible modules. Built for both CLI and Web usage, it supports advanced type mapping, modular imports, and dynamic Move project integration.

## 📚 Table of Contents

- [📁 Monorepo Structure](#-monorepo-structure)
- [🚀 Features](#-features)
- [🛠️ Installation](#️-installation)
- [💻 Usage](#-usage)

  - [CLI (Local Development)](#cli-local-development)
  - [Web App (File Upload)](#web-app-file-upload)

- [🔬 Move Testing](#-move-testing)
- [📦 Example Input](#-example-input)
- [📄 Generated Output (Simplified)](#-generated-output-simplified)
- [🧪 Tests](#-tests)
- [🔗 Contribution Guide](#-contribution-guide)
- [📌 Roadmap](#-roadmap)
- [📜 License](#-license)

---

## 📁 Monorepo Structure

```
solidity-to-move/
├── core/            # Shared logic (ABI/Solidity parsing, Move generation, type mapping)
├── cli/             # Command-line interface
├── web/
│   ├── backend/     # Express backend API for file-based transpilation
│   └── frontend/    # React frontend for user-friendly file upload
├── move-project/    # Output Move project w/ generated .move and test files
├── examples/        # Sample input (.abi.json or .sol)
├── output/          # Generated Move files
├── README.md        # This file
```

---

## 🚀 Features

- ✅ Parse Solidity `.abi.json` or `.sol` files and generate Move-compatible smart contracts
- ✅ Smart type mapping (`uint256`, `address`, `tuple[]`, etc.) → Move-native types
- ✅ Function logic extraction from Solidity source for richer transpilation
- ✅ Modular and reusable Move code generation
- ✅ CLI and Web interfaces
- ✅ Auto-populates `Move.toml` with dependencies
- ✅ Generates Move unit tests for supported contracts
- ✅ Built-in examples and output folders for inspection

---

## 🛠️ Installation

### 1. Install Yarn Workspaces

```bash
npm install -g yarn
```

### 2. Clone & Bootstrap

```bash
git clone https://github.com/Abdulazeez41/S2M.git
cd S2M
yarn install
```

---

## 💻 Usage

### CLI (Local Development)

```bash
cd cli
yarn dev ../examples/MyContract.abi.json MyContract
```

Or for Solidity source files:

```bash
yarn dev ../examples/MyContract.sol MyContract
```

> Runs the transpiler using the given ABI or Solidity file and contract name.

- Takes `.abi.json` or `.sol` as input.
- Outputs `MyContract.move` into both `/output` and `/move-project/sources/`.
- Optional 4th parameter: `inferredLibs` (e.g. `["0x1::vector"]`) can be passed for custom dependencies.

💡 Tip: Consider renaming `yarn dev` to `yarn transpile` in scripts for clarity.

---

### Web App (File Upload)

1. Start backend:

```bash
cd web/backend
yarn dev
```

2. Start frontend in a new terminal tab:

```bash
cd web/frontend
yarn dev
```

3. Open: [http://localhost:5173](http://localhost:5173)

4. Upload `.abi.json` or `.sol`, enter contract name, and download `.move` file.

💡 Tip: You can run both processes together by adding this to your root `package.json`:

```json
"scripts": {
  "start:web": "cd web/backend && yarn dev & cd web/frontend && yarn dev"
}
```

Then run:

```bash
yarn start:web
```

---

## 🔬 Move Testing

Generated `.move` files are placed inside `move-project/sources/`
Test templates are placed inside `move-project/tests/`

To run tests:

```bash
cd move-project
sui move test
```

> Make sure you have the [Sui CLI](https://sui.dev/cli-tools/sui-cli-tool/) installed.

---

## 📦 Example Input

```json
/* examples/MyContract.json */
[
  {
    "type": "function",
    "name": "storeValue",
    "inputs": [{ "name": "x", "type": "uint256" }],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "getValue",
    "inputs": [],
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view"
  }
]
```

Or:

```solidity
// examples/MyContract.sol
pragma solidity ^0.8.0;

contract MyContract {
    uint256 private value;

    function storeValue(uint256 x) public {
        value = x;
    }

    function getValue() public view returns (uint256) {
        return value;
    }
}
```

---

## 📄 Generated Output (Simplified)

```move
module my_contract::MyContract {

      struct MyContract has key {
        id: UID,
        owner: address,
      }
      struct storeValueEvent has copy, drop, store {
        x: u256,
      };

      struct getValueEvent has copy, drop, store {

      };

      fun init(ctx: &mut TxContext) {
        transfer::transfer(MyContract {
          id: object::new(ctx),
          owner: tx_context::sender(ctx),
        }, tx_context::sender(ctx));
      }

      public entry fun storeValue(self: &mut MyContract, x: u256, ctx: &mut TxContext) {
        // TODO: implement storeValue logic
      }

      public(friend) getValue(): u256 {
            // TODO: implement getValue logic
      }
}
```

---

## 🧪 Tests

```move
#[test]
public fun test_store_and_get_value() {
    let account = @0x1;
    MyContract::store_value(account, 42);
    let value = MyContract::get_value(account);
    Test::assert(value == 42, 100);
}
```

---

## 🔗 Contribution Guide

### 1. Add Feature to Core

Edit these key files:

- `core/src/abiParser.ts` – ABI structure parsing
- `core/src/solParser.ts` – Solidity `.sol` parsing
- `core/src/moveGenerator.ts` – Move code generation
- `core/src/typeMapper.ts` – Solidity ↔ Move type mapping

### 2. Sync Interfaces

- CLI and Web both call `core` with `.abi.json` or `.sol` file input.

### 3. Rebuild & Test

```bash
yarn build
yarn workspace cli dev examples/MyContract.sol MyContract
```

#### Developer Setup Tips

- Node.js ≥ v18 recommended
- Ensure `yarn set version` is used if needed
- Run linters before committing changes

---

## 📌 Roadmap

- [x] Solidity `.sol` → Move transpilation
- [ ] Event → Move `Event` generation
- [ ] Cross-chain value mapping validation
- [ ] On-chain ABI compiler support
- [ ] Multi-module support
- [ ] Playground integration

---

## 📜 License

MIT License © 2025 Abdulazeez

---
