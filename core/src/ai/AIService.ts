export interface AIService {
  translateSolidityToMove(code: string): Promise<string>;
  suggestMoveMapping(type: string): Promise<Record<string, string>>;
  explainError(error: string): Promise<string>;
}
