import { Sandbox } from "@e2b/code-interpreter";

export type VmRuntimeMetadata = {
  sandboxId: string;
  template?: string;
};

const TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes in milliseconds

export const createVmForRepo = async (
  _projectId: string,
): Promise<VmRuntimeMetadata> => {
  // We use E2B Code Interpreter for agentic code execution
  const sandbox = await Sandbox.create({
    apiKey: process.env.E2B_API_KEY,
    timeoutMs: TIMEOUT_MS,
  });

  return {
    sandboxId: sandbox.sandboxId,
  };
};

export const getSandbox = async (sandboxId: string) => {
  return await Sandbox.connect(sandboxId, {
    apiKey: process.env.E2B_API_KEY,
    timeoutMs: TIMEOUT_MS,
  });
};
