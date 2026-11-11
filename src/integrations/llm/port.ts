export interface LlmPort {
  generate(input: {
    system: string;
    input: string;
    jsonSchema?: Record<string, unknown>;
    maxTokens?: number;
  }): Promise<string>;
}
