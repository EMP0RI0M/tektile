"use client";

import { useEffect, useRef } from 'react';
import 'xterm/css/xterm.css';

// We'll import these dynamically to avoid SSR errors ("self is not defined")
let Terminal: any;
let FitAddon: any;

interface TerminalPreviewProps {
  executionLogStream: string; 
}

export function TerminalPreview({ executionLogStream }: TerminalPreviewProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermInstance = useRef<any>(null);

  useEffect(() => {
    let terminal: any;
    let fitAddon: any;
    let resizeObserver: ResizeObserver;

    const initTerminal = async () => {
      if (!terminalRef.current) return;

      try {
        const [xtermModule, fitModule] = await Promise.all([
          import('xterm'),
          import('@xterm/addon-fit')
        ]);

        if (!terminalRef.current) return;

        terminal = new xtermModule.Terminal({
          theme: {
            background: '#09090b',
            foreground: '#fafafa',
            cursor: '#fafafa',
            selectionBackground: '#3b82f6',
          },
          fontFamily: 'Menlo, Monaco, "Courier New", monospace',
          fontSize: 13,
          cursorBlink: true,
          disableStdin: true,
          allowProposedApi: true,
        });

        fitAddon = new fitModule.FitAddon();
        terminal.loadAddon(fitAddon);
        terminal.open(terminalRef.current);
        
        xtermInstance.current = terminal;

        // Initial fit with a small delay
        requestAnimationFrame(() => {
          if (terminal?.element && terminalRef.current) {
            try {
              fitAddon.fit();
            } catch (e) {
              console.warn("Terminal fit failed during init", e);
            }
          }
        });

        resizeObserver = new ResizeObserver(() => {
          if (terminal?.element && terminalRef.current) {
            const { width, height } = terminalRef.current.getBoundingClientRect();
            if (width > 0 && height > 0) {
              try {
                fitAddon.fit();
              } catch (e) {
                // Ignore fit errors during quick transitions
              }
            }
          }
        });
        resizeObserver.observe(terminalRef.current);

        terminal.writeln('\x1b[35m[FORGE AI]\x1b[0m \x1b[32mSecure Sandbox Terminal Initialized\x1b[0m');
        terminal.writeln('\x1b[90mWaiting for execution logs...\x1b[0m');
        terminal.writeln('');
      } catch (err) {
        console.error("Failed to initialize terminal:", err);
      }
    };

    initTerminal();

    return () => {
      if (resizeObserver) resizeObserver.disconnect();
      if (terminal) {
        terminal.dispose();
        xtermInstance.current = null;
      }
    };
  }, []);

  // 4. Reactively write backend E2B output to the xterm UI
  useEffect(() => {
    if (xtermInstance.current && executionLogStream) {
      // Write the incoming stream payload to the terminal
      // We use writeln to ensure new lines are handled correctly from the stream
      xtermInstance.current.write(executionLogStream);
    }
  }, [executionLogStream]);

  return (
    <div className="w-full h-full bg-[#09090b] relative overflow-hidden flex flex-col">
      <div className="h-8 px-4 flex items-center justify-between border-b border-white/5 bg-black/20">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">E2B Sandbox Live Logs</span>
        </div>
        <span className="text-[9px] font-mono text-white/20">e2b_session_active</span>
      </div>
      <div className="flex-1 p-2 overflow-hidden">
        <div ref={terminalRef} className="w-full h-full" />
      </div>
    </div>
  );
}
