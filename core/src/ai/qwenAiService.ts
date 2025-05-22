import axios from "axios";
import { logger } from "../utils/logger";
import { AIService } from "./AIService";

export class QwenAIService implements AIService {
  private readonly apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey || process.env.QWEN_API_KEY || "";
    if (!this.apiKey) throw new Error("Qwen API key not provided");
  }

  private async callQwen(
    prompt: string,
    temperature = 0.1,
    max_tokens = 2048
  ): Promise<string> {
    try {
      const res = await axios.post(
        "https://dashscope-intl.aliyuncs.com/api/v1/services/aigc/text-generation/generation ",
        {
          model: "qwen-max",
          input: {
            prompt: prompt,
          },
          parameters: {
            temperature,
            max_tokens,
            top_p: 0.8,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "HTTP-Referer": "https://www.sitename.com",
            "X-Title": "SiteName",
            "Content-Type": "application/json",
          },
        }
      );

      return res.data.output.text.trim();
    } catch (err: any) {
      logger.error("Qwen API call failed: " + err.message);
      console.error(err.response?.data);
      return (
        "// Qwen AI failed\n// Reason: " +
        (err.response?.data?.message || err.message)
      );
    }
  }

  async translateSolidityToMove(code: string): Promise<string> {
    const prompt = `
You are a Solidity-to-Move smart contract transpiler assistant.
Your task is to convert the provided Solidity code into idiomatic Sui Move code.

Requirements:
- Use 'public entry fun' for public functions
- Define structs with 'has key, store'
- Handle state variables as fields in the main struct
- Emit events using 'event::emit(...)'
- Use '&mut TxContext' where needed
- Avoid unsupported syntax; replace with idioms
- Be professional

Return only the Move module — no explanation.

Solidity Code:

${code}


Return only the Move code.
    `.trim();

    return this.callQwen(prompt);
  }

  async suggestMoveMapping(type: string): Promise<Record<string, string>> {
    const prompt = `Map Solidity type "${type}" → Move type. Return JSON like {"keyType": "address", "valueType": "u64"}.`;

    const raw = await this.callQwen(prompt);
    try {
      const parsed = JSON.parse(raw);
      if (typeof parsed === "object" && parsed.keyType && parsed.valueType) {
        return parsed;
      }
    } catch (e) {
      logger.warn("Failed to parse Qwen mapping response");
    }
    return {};
  }

  async explainError(error: string): Promise<string> {
    const prompt = `Explain this transpilation error and suggest how to fix it:\n\n${error}`;
    return this.callQwen(prompt, 0.3, 512);
  }
}
