import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { tool } from "ai";
import { z } from "zod";

/**
 * MCP Bridge Utility
 * 
 * Bridges MCP servers to the Vercel AI SDK tool format.
 */
export async function createMcpTools(command: string, args: string[] = [], env: Record<string, string> = {}) {
  let transport: StdioClientTransport | null = null;
  try {
    console.log(`[MCP Bridge] Connecting to ${command} ${args.join(' ')}...`);
    
    transport = new StdioClientTransport({
      command,
      args,
      env: { ...process.env, ...env },
    });

    const client = new Client(
      {
        name: "forge-mcp-client",
        version: "1.0.0",
      },
      {
        capabilities: {},
      }
    );

    // Add a timeout to the connection
    const connectPromise = client.connect(transport);
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("Connection timeout after 5s")), 5000)
    );

    await Promise.race([connectPromise, timeoutPromise]);

    const { tools: mcpTools } = await client.listTools();
    console.log(`[MCP Bridge] Successfully connected. Found ${mcpTools.length} tools.`);
    
    const bridgedTools: Record<string, any> = {};

    for (const mcpTool of mcpTools) {
      bridgedTools[mcpTool.name] = tool({
        description: mcpTool.description || "",
        inputSchema: mcpTool.inputSchema as any,
        execute: async (input) => {
          try {
            const result = await client.callTool({
              name: mcpTool.name,
              arguments: input as any,
            });
            return result;
          } catch (e: any) {
            console.error(`[MCP Bridge] Tool call failed (${mcpTool.name}):`, e);
            return { error: e.message };
          }
        },
      });
    }

    return { tools: bridgedTools, client, transport };
  } catch (error: any) {
    console.error(`[MCP Bridge] Failed to connect to MCP server (${command}):`, error.message);
    if (transport) {
      try { await transport.close(); } catch (e) {}
    }
    return { tools: {}, client: null, transport: null, error: error.message };
  }
}
