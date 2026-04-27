import { SandboxProvider } from "@/lib/e2b-vm/types";

export interface SandboxState {
  fileCache: {
    files: Record<string, { content: string; lastModified: number }>;
    lastSync: number;
    sandboxId: string;
    manifest?: any;
  };
  sandbox: SandboxProvider;
  sandboxData: {
    sandboxId: string;
    url: string;
  };
}
