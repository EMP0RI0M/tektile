import { tool } from "ai";
import { Sandbox } from "@e2b/code-interpreter";
import { z } from "zod";
import { WORKDIR } from "./vars";
import { applyMorphEdit } from "../ai/core/morph-utils";
import { createMcpTools } from "../mcp-bridge";

type CreateToolsOptions = {
  sourceRepoId?: string;
  metadataRepoId?: string;
};

const normalizeRelativePath = (rawPath: string): string | null => {
  const value = rawPath.trim();
  if (!value || value.includes("\0")) return null;

  // Allow absolute paths in known workdirs
  if (value.startsWith("/code") || value.startsWith("/workspace")) {
    return value;
  }

  // Disallow other absolute paths
  if (value.startsWith("/")) return null;

  const normalized = value.replace(/^\.\//, "");
  const segments = normalized.split("/");
  if (segments.some((segment) => segment === "..")) return null;

  return normalized || ".";
};

const shellQuote = (value: string): string => {
  return `'${value.replace(/'/g, `'\\''`)}'`;
};

export const createTools = async (sandbox: Sandbox, options?: CreateToolsOptions) => {
  const runExecCommand = async (command: string) => {
    const output = await sandbox.commands.run(command);
    
    return {
      ok: output.exitCode === 0,
      stdout: output.stdout,
      stderr: output.stderr,
      exitCode: output.exitCode,
      command,
    };
  };

  const bashTool = tool({
    description: "Run a bash command inside the E2B Sandbox and return its output.",
    inputSchema: z.object({
      command: z.string().min(1).describe("The bash command to execute."),
    }),
    execute: async ({ command }) => {
      return runExecCommand(command);
    },
  });

  const readFileTool = tool({
    description: "Read the content of a file in the Sandbox.",
    inputSchema: z.object({
      file: z.string().min(1).describe("The path of the file to read."),
    }),
    execute: async ({ file }) => {
      const safeFile = normalizeRelativePath(file);
      if (!safeFile) return { ok: false, error: "Invalid file path." };
      try {
        const content = await sandbox.files.read(safeFile);
        return { content };
      } catch (err: any) {
        return { ok: false, error: err.message };
      }
    },
  });

  const writeFileTool = tool({
    description: "Write content to a file in the Sandbox.",
    inputSchema: z.object({
      file: z.string().min(1).describe("The path of the file to write."),
      content: z.string().describe("The content to write to the file."),
    }),
    execute: async ({ file, content }) => {
      const safeFile = normalizeRelativePath(file);
      if (!safeFile) return { ok: false, error: "Invalid file path." };
      try {
        await sandbox.files.write(safeFile, content);
        return { ok: true };
      } catch (err: any) {
        return { ok: false, error: err.message };
      }
    },
  });

  const listFilesTool = tool({
    description: "List files or directories from a given path.",
    inputSchema: z.object({
      path: z.string().default(".").describe("Path to list."),
    }),
    execute: async ({ path }) => {
      const safePath = normalizeRelativePath(path ?? ".");
      if (!safePath) return { ok: false, error: "Invalid path." };
      return runExecCommand(`ls -la ${shellQuote(safePath)}`);
    },
  });

  const makeDirectoryTool = tool({
    description: "Create a directory path.",
    inputSchema: z.object({
      path: z.string().min(1).describe("Directory path to create."),
    }),
    execute: async ({ path }) => {
      const safePath = normalizeRelativePath(path);
      if (!safePath) return { ok: false, error: "Invalid path." };
      return runExecCommand(`mkdir -p ${shellQuote(safePath)}`);
    },
  });

  const deletePathTool = tool({
    description: "Delete a file or directory path.",
    inputSchema: z.object({
      path: z.string().min(1).describe("File or directory path to delete."),
    }),
    execute: async ({ path }) => {
      const safePath = normalizeRelativePath(path);
      if (!safePath) return { ok: false, error: "Invalid path." };
      return runExecCommand(`rm -rf ${shellQuote(safePath)}`);
    },
  });

  const patchFileTool = tool({
    description: "Surgically edit a file using a natural language instruction and a sparse code block. Use this for targeted updates to existing files to save tokens and improve speed. Uses Morph V3 API.",
    inputSchema: z.object({
      file: z.string().min(1).describe("The path of the file to edit."),
      instructions: z.string().describe("What to change in the file."),
      codeEdit: z.string().describe("A sparse code block showing the changes, using '// ... existing code ...' for unchanged parts."),
    }),
    execute: async ({ file, instructions, codeEdit }) => {
      const safeFile = normalizeRelativePath(file);
      if (!safeFile) return { ok: false, error: "Invalid file path." };
      
      try {
        const original = await sandbox.files.read(safeFile);
        const merged = await applyMorphEdit(original, {
          targetFile: safeFile,
          instructions,
          codeEdit,
        });
        
        await sandbox.files.write(safeFile, merged);
        return { ok: true, file: safeFile };
      } catch (err: any) {
        return { ok: false, error: err.message };
      }
    },
  });

  const deployToCloudflareTool = tool({
    description: "Deploy the current project to Cloudflare Pages. This creates a permanent live URL.",
    inputSchema: z.object({
      projectName: z.string().describe("The name of the project on Cloudflare Pages."),
    }),
    execute: async ({ projectName }) => {
      const apiToken = process.env.CLOUDFLARE_API_TOKEN;
      const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;

      if (!apiToken || !accountId) {
        return { ok: false, error: "Missing Cloudflare credentials (API_TOKEN or ACCOUNT_ID)." };
      }

      try {
        // 1. Install wrangler in the sandbox
        await sandbox.commands.run("npm install -g wrangler");

        // 2. Run deployment
        // Note: Using environment variables for auth
        const deployCmd = `export CLOUDFLARE_API_TOKEN=${apiToken} && export CLOUDFLARE_ACCOUNT_ID=${accountId} && wrangler pages deploy . --project-name=${projectName} --branch main`;
        
        const output = await sandbox.commands.run(deployCmd);
        
        if (output.exitCode !== 0) {
          return { ok: false, error: output.stderr || "Deployment failed." };
        }

        // 3. Extract URL from wrangler output (matches 'Deployment complete! Take a look at it at: https://...')
        const urlMatch = output.stdout.match(/https:\/\/[a-z0-9-]+\.pages\.dev/);
        const url = urlMatch ? urlMatch[0] : null;

        return { ok: true, url, stdout: output.stdout };
      } catch (err: any) {
        return { ok: false, error: err.message };
      }
    },
  });

  const webSearchTool = tool({
    description: "Search the web for information using SearXNG. Use this to get up-to-date info, documentation, or code examples.",
    inputSchema: z.object({
      query: z.string().describe("The search query to execute."),
    }),
    execute: async ({ query }) => {
      const searxngUrl = process.env.SEARXNG_URL || "http://34.16.85.155:8080";
      try {
        const response = await fetch(`${searxngUrl}/search?q=${encodeURIComponent(query)}&format=json`);
        if (!response.ok) {
          return { ok: false, error: `SearXNG error: ${response.statusText}` };
        }
        const data = await response.json();
        const results = (data.results || []).slice(0, 5).map((r: any) => ({
          title: r.title,
          url: r.url,
          content: r.content || r.snippet,
        }));
        return { ok: true, results };
      } catch (err: any) {
        return { ok: false, error: err.message };
      }
    },
  });

  const allTools: any = {
    bashTool,
    readFileTool,
    writeFileTool,
    listFilesTool,
    makeDirectoryTool,
    deletePathTool,
    patchFileTool,
    deployToCloudflareTool,
    webSearchTool,
  };

  const activeMcpServers: string[] = [];

  const getPostgresEnv = (urlStr: string) => {
    const env: any = { POSTGRES_URL: urlStr };
    try {
      const url = new URL(urlStr);
      env.POSTGRES_PASSWORD = url.password;
      env.POSTGRES_HOST = url.hostname;
      env.POSTGRES_PORT = url.port || "5432";
      env.POSTGRES_USER = url.username;
      env.POSTGRES_DB = url.pathname.slice(1);
      env.POSTGRES_DATABASE = env.POSTGRES_DB; // Toolbox SDK specifically wants this
    } catch (e) {}
    return env;
  };
  
  // 1. Load dynamic MCP servers from registry
  try {
    const fs = require('fs');
    const path = require('path');
    const registryPath = path.join(process.cwd(), 'src/config/mcp-registry.json');
    if (fs.existsSync(registryPath)) {
      const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
      for (const server of registry.servers || []) {
        if (server.disabled) continue;
        console.log(`[MCP] Initializing dynamic server: ${server.name}...`);
        
        // Ensure postgres servers get their parsed env vars
        let env = server.env || {};
        if (server.type === "postgres" && env.POSTGRES_URL) {
          env = { ...env, ...getPostgresEnv(env.POSTGRES_URL) };
        }

        const mcp = await createMcpTools(server.command, server.args || [], env);
        if (mcp.client) {
          activeMcpServers.push(`${server.name} (${server.command})`);
          Object.assign(allTools, mcp.tools);
        }
      }
    }
  } catch (e) {
    console.error("[MCP] Registry load failed:", e);
  }


  // 2. Add Postgres MCP Tools if POSTGRES_URL is present (Legacy/Shortcut)
  if (process.env.POSTGRES_URL && !activeMcpServers.some(s => s.includes("Postgres"))) {
    console.log("[MCP] Initializing Postgres Toolbox from ENV...");
    const pgMcp = await createMcpTools("npx", [
      "-y",
      "@toolbox-sdk/server",
      "--prebuilt=postgres"
    ], getPostgresEnv(process.env.POSTGRES_URL));
    
    if (pgMcp.client) {
      activeMcpServers.push("Postgres (Env)");
      Object.assign(allTools, pgMcp.tools);
    }
  }

  // 3. Management Tools
  allTools.listMcpTools = tool({
    description: "List currently connected MCP servers and their available tools.",
    inputSchema: z.object({}),
    execute: async () => {
      return {
        activeServers: activeMcpServers,
        totalTools: Object.keys(allTools).length,
        tools: Object.keys(allTools)
      };
    }
  });

  allTools.addMcpServer = tool({
    description: "Register a new MCP server. Examples: 'postgres', 'mysql', 'bigquery', or a custom command.",
    inputSchema: z.object({
      name: z.string().describe("Friendly name for the server."),
      type: z.enum(["postgres", "mysql", "bigquery", "custom"]).describe("Prebuilt server type or 'custom'."),
      connectionString: z.string().optional().describe("For prebuilt types, the connection URL."),
      command: z.string().optional().describe("For custom types, the command to run."),
      args: z.array(z.string()).optional().describe("For custom types, command arguments."),
    }),
    execute: async ({ name, type, connectionString, command, args }) => {
      const fs = require('fs');
      const path = require('path');
      const registryPath = path.join(process.cwd(), 'src/config/mcp-registry.json');
      
      let finalCommand = command || "npx";
      let finalArgs = args || ["-y", "@toolbox-sdk/server", `--prebuilt=${type}`];
      let env: any = {};

      if (type === "postgres" && connectionString) {
        env = { ...env, ...getPostgresEnv(connectionString) };
      }
      if (type === "mysql") env.MYSQL_URL = connectionString;
      if (type === "bigquery") env.BIGQUERY_PROJECT_ID = connectionString;

      const newServer = { name, type, command: finalCommand, args: finalArgs, env };
      
      const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
      registry.servers = [...(registry.servers || []), newServer];
      fs.writeFileSync(registryPath, JSON.stringify(registry, null, 2));

      return { success: true, message: `Server '${name}' registered. Tools will be available in the next turn.` };
    }
  });

  allTools.removeMcpServer = tool({
    description: "Unregister an MCP server by name.",
    inputSchema: z.object({
      name: z.string().describe("Name of the server to remove."),
    }),
    execute: async ({ name }) => {
      const fs = require('fs');
      const path = require('path');
      const registryPath = path.join(process.cwd(), 'src/config/mcp-registry.json');
      
      const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
      registry.servers = (registry.servers || []).filter((s: any) => s.name !== name);
      fs.writeFileSync(registryPath, JSON.stringify(registry, null, 2));

      return { success: true, message: `Server '${name}' removed.` };
    }
  });

  return allTools;
};
