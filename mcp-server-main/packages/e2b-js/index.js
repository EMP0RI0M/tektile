#!/usr/bin/env node
const { Server } = require("@modelcontextprotocol/sdk/server/index.js");
const { StdioServerTransport } = require("@modelcontextprotocol/sdk/server/stdio.js");
const { 
  CallToolRequestSchema, 
  ListToolsRequestSchema,
  ErrorCode,
  McpError
} = require("@modelcontextprotocol/sdk/types.js");
const { Sandbox, CodeInterpreter } = require("@e2b/code-interpreter");
require("dotenv").config();

/**
 * E2B MCP Server (JS version)
 * This server provides tools to interact with E2B sandboxes.
 */
class E2bServer {
  constructor() {
    this.server = new Server(
      {
        name: "e2b-mcp-server-js",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.sandbox = null;
    this.setupTools();
    
    // Error handling
    this.server.onerror = (error) => console.error("[MCP Error]", error);
    process.on("SIGINT", async () => {
      await this.cleanup();
      process.exit(0);
    });
  }

  async getSandbox() {
    if (!this.sandbox) {
      console.error("Initializing E2B Sandbox...");
      this.sandbox = await CodeInterpreter.create({
        apiKey: process.env.E2B_API_KEY
      });
      console.error(`Sandbox created: ${this.sandbox.sandboxId}`);
    }
    return this.sandbox;
  }

  async cleanup() {
    if (this.sandbox) {
      console.error("Closing sandbox...");
      await this.sandbox.close();
      this.sandbox = null;
    }
  }

  setupTools() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: "run_shell",
          description: "Execute a shell command in the E2B sandbox",
          inputSchema: {
            type: "object",
            properties: {
              command: { type: "string", description: "The shell command to run" },
            },
            required: ["command"],
          },
        },
        {
          name: "run_python",
          description: "Run Python code in the sandbox (Code Interpreter)",
          inputSchema: {
            type: "object",
            properties: {
              code: { type: "string", description: "The Python code to execute" },
            },
            required: ["code"],
          },
        },
        {
          name: "write_file",
          description: "Write a file to the sandbox",
          inputSchema: {
            type: "object",
            properties: {
              path: { type: "string", description: "Path to write to" },
              content: { type: "string", description: "File content" },
            },
            required: ["path", "content"],
          },
        },
        {
          name: "read_file",
          description: "Read a file from the sandbox",
          inputSchema: {
            type: "object",
            properties: {
              path: { type: "string", description: "Path to read" },
            },
            required: ["path"],
          },
        },
        {
          name: "list_files",
          description: "List files in a directory",
          inputSchema: {
            type: "object",
            properties: {
              path: { type: "string", description: "Directory path (default: /home/user)" },
            },
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      const sandbox = await this.getSandbox();

      try {
        switch (name) {
          case "run_shell": {
            const result = await sandbox.commands.run(args.command);
            return {
              content: [
                { type: "text", text: `Exit code: ${result.exitCode}\nStdout: ${result.stdout}\nStderr: ${result.stderr}` }
              ],
            };
          }
          case "run_python": {
            const execution = await sandbox.notebook.execCell(args.code);
            return {
              content: [
                { 
                  type: "text", 
                  text: `Stdout: ${execution.logs.stdout.join("\n")}\nStderr: ${execution.logs.stderr.join("\n")}\nResults: ${JSON.stringify(execution.results)}` 
                }
              ],
            };
          }
          case "write_file": {
            await sandbox.files.write(args.path, args.content);
            return {
              content: [{ type: "text", text: `Successfully wrote to ${args.path}` }],
            };
          }
          case "read_file": {
            const content = await sandbox.files.read(args.path);
            return {
              content: [{ type: "text", text: content }],
            };
          }
          case "list_files": {
            const path = args.path || "/home/user";
            const files = await sandbox.files.list(path);
            const list = files.map(f => `${f.name} (${f.isDir ? 'dir' : 'file'})`).join("\n");
            return {
              content: [{ type: "text", text: list || "(empty directory)" }],
            };
          }
          default:
            throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error: ${error.message}` }],
          isError: true,
        };
      }
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("E2B MCP Server (JS) running on stdio");
  }
}

const server = new E2bServer();
server.run().catch(console.error);
