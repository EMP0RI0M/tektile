import { execSync } from "child_process";

export interface CommandResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  success: boolean;
}

/**
 * Execute synchronous shell commands.
 * Use for builds, installations, and quick checks. 
 */
export async function executeCommand(command: string): Promise<CommandResult> {
  try {
    const stdout = execSync(command, { encoding: "utf-8" });
    return {
      stdout,
      stderr: "",
      exitCode: 0,
      success: true
    };
  } catch (err: any) {
    return {
      stdout: err.stdout || "",
      stderr: err.stderr || err.message,
      exitCode: err.status || 1,
      success: false
    };
  }
}

/**
 * Run application build.
 * Specific helper for the verifier loop. 
 */
export async function runBuild() {
  return await executeCommand("npm run build");
}

export async function checkLint() {
  return await executeCommand("npm run lint");
}
