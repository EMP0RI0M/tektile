import { NextResponse } from 'next/server';
import { SandboxFactory } from '@/lib/e2b-vm/factory';
import { sandboxManager } from '@/lib/e2b-vm/sandbox-manager';
import type { SandboxState } from '@/types/sandbox';

// Store active sandbox globally for development persistence
declare global {
  var activeSandboxProvider: any;
  var sandboxData: any;
  var existingFiles: Set<string>;
  var sandboxState: SandboxState;
}

/**
 * create-ai-sandbox-v2
 * 
 * Orchestrates the creation and initialization of a high-performance
 * engineering sandbox. This route handles multi-provider logic (E2B/Vercel),
 * environment setup (Vite/React), and global state synchronization.
 */
export async function POST() {
  try {
    console.log('[create-ai-sandbox-v2] Initializing fresh engineering environment...');
    
    // Clean up all existing sandboxes to prevent resource leakage
    console.log('[create-ai-sandbox-v2] Terminating legacy sessions...');
    await sandboxManager.terminateAll();
    
    // Clean up legacy global state if it exists
    if (global.activeSandboxProvider) {
      try {
        await global.activeSandboxProvider.terminate();
      } catch (e) {
        console.error('Failed to terminate legacy global sandbox:', e);
      }
      global.activeSandboxProvider = null;
    }
    
    // Reset file tracking for the new session
    if (global.existingFiles) {
      global.existingFiles.clear();
    } else {
      global.existingFiles = new Set<string>();
    }

    // 1. Provision the sandbox using the Factory
    // This automatically selects the best available provider (E2B or Vercel)
    const provider = SandboxFactory.create();
    const sandboxInfo = await provider.createSandbox();
    
    console.log(`[create-ai-sandbox-v2] Provisioned ${sandboxInfo.provider} sandbox: ${sandboxInfo.sandboxId}`);
    
    // 2. Setup the engineering environment (Vite/React)
    console.log('[create-ai-sandbox-v2] Bootstrapping Vite React application...');
    await provider.setupViteApp();
    
    // 3. Register with the lifecycle manager
    sandboxManager.registerSandbox(sandboxInfo.sandboxId, provider);
    
    // 4. Update global state for cross-component accessibility
    global.activeSandboxProvider = provider;
    global.sandboxData = {
      sandboxId: sandboxInfo.sandboxId,
      url: sandboxInfo.url
    };
    
    // 5. Initialize the high-level SandboxState
    global.sandboxState = {
      fileCache: {
        files: {},
        lastSync: Date.now(),
        sandboxId: sandboxInfo.sandboxId
      },
      sandbox: provider as any,
      sandboxData: {
        sandboxId: sandboxInfo.sandboxId,
        url: sandboxInfo.url
      }
    };
    
    console.log('[create-ai-sandbox-v2] Environment established at:', sandboxInfo.url);
    
    return NextResponse.json({
      success: true,
      sandboxId: sandboxInfo.sandboxId,
      url: sandboxInfo.url,
      provider: sandboxInfo.provider,
      message: 'Engineering sandbox initialized and Vite app ready'
    });

  } catch (error) {
    console.error('[create-ai-sandbox-v2] Critical failure during provisioning:', error);
    
    // Emergency cleanup to avoid orphan sandboxes
    await sandboxManager.terminateAll();
    if (global.activeSandboxProvider) {
      try {
        await global.activeSandboxProvider.terminate();
      } catch (e) {
        console.error('Failed to terminate sandbox on error:', e);
      }
      global.activeSandboxProvider = null;
    }
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to establish engineering environment',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
