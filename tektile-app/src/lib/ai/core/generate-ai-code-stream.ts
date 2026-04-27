import { createOpenAI } from '@ai-sdk/openai';
import { streamText, tool } from 'ai';
import { z } from 'zod';
import { selectFilesForEdit, getFileContents, formatFilesForAI } from './context-selector';
import { analyzeEditIntentAI } from './edit-intent-analyzer';
import { FileManifest, ConversationEdit } from './types';
import { ConversationState, ConversationMessage,    SandboxState, Task, Subtask } from './state-types';
import { applyMorphEdit } from './morph-utils';
import { scrapeWithFirecrawl } from './firecrawl-utils';

const defaultOpenRouter = createOpenAI({
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: 'https://openrouter.ai/api/v1',
});

/**
 * The main generator function adapted for Next.js Edge + Agentic tools (Tektile Inspired)
 */
export async function generateAiCodeStream({
    prompt,
    model = process.env.DEFAULT_AI_MODEL || 'openrouter:stepfun/step-3.5-flash:free',
    isEdit = false,
    mode = 'implementation',
    onStream,
}: {
    prompt: string;
    model?: string;
    isEdit?: boolean;
    mode?: AgentMode;
    onStream: (data: any) => Promise<void>;
}) {
    try {
        await onStream({ type: 'status', content: `🚀 Initializing ${mode} engine...` });

        // Initialize state if missing
        if (!global.conversationState) {
            global.conversationState = {
                conversationId: 'conv-' + Date.now(),
                startedAt: Date.now(),
                lastUpdated: Date.now(),
                context: {
                    messages: [],
                    edits: [],
                    projectEvolution: { majorChanges: [] },
                    userPreferences: {}
                }
            };
        }

        const userMessage: ConversationMessage = {
            id: 'msg-' + Date.now(),
            role: 'user',
            content: prompt,
            timestamp: Date.now()
        };
        global.conversationState.context.messages.push(userMessage);

        // --- DYNAMIC SYSTEM PROMPTS BASED ON MODE ---
        let basePrompt = `You are a master React developer specializing in "Vibe Coding" for rapid production-grade SaaS delivery.
Generate Vite apps using pure Tailwind CSS and modern web best practices.

🚨 CRITICAL RULES:
1. XML TAGS: Every file MUST be wrapped in <file path="name.jsx">content</file> tags.
2. NO TYPESCRIPT: Use plain JavaScript only (Next.js is NOT used for the generated app, use Vite patterns).
3. TAILWIND: Use standard Tailwind colors and utilities. Prefer modern SaaS aesthetics (glassmorphism, subtle gradients).
4. DIRECTIVES: Use "use client"; at the TOP of components that use React hooks.
5. ARCHITECTURE: Use a production-ready approach. For state, use standard React hooks (useState, useEffect, useContext).
6. ASSETS: Use Unsplash for images (e.g., https://images.unsplash.com/photo-...).
7. ICONS: Use Lucide React icons.
`;

        const modePrompts: Record<AgentMode, string> = {
            fast: `MODE: FAST. Be extremely brief. Skip long explanations. Focus only on the required code changes. Use the 'edit_file' tool whenever possible.`,
            planning: `MODE: PLANNING. DO NOT generate code yet. Focus entirely on architecting the solution. You MUST use the 'update_project_plan' tool to define a detailed multi-step execution strategy. Explain your reasoning for the chosen architecture.`,
            implementation: `MODE: IMPLEMENTATION. Standard operation. Start by updating the project plan, then generate the full, functional code. Ensure every component is high-quality and verified.`,
            walkthrough: `MODE: WALKTHROUGH. Generate the code, but also provide a detailed, educational explanation of HOW the code works. Use the <explanation> tag for this. Break down complex logic and explain the design patterns used.`,
            task: `MODE: TASK. Focus ONLY on the specific subtask requested. Do not refactor unrelated files. Be surgical and use the 'edit_file' tool.`
        };

        let systemPrompt = basePrompt + "\n" + modePrompts[mode] + `
        
🛠️ AGENTIC TASK:
1. If you need to scrape a website (e.g. to clone a design), call 'scrapeWebsite'.
2. IMMEDIATELY after receiving the scrape results, you MUST generate the full application code.
3. Every single file MUST be wrapped in <file path="name.jsx">tags.
4. Ensure the output is a functional Vite app.

Output structure:
<explanation>Short description of what was generated/updated</explanation>
<file path="src/App.jsx">...</file>
`;

        if (isEdit && global.sandboxState?.fileCache?.manifest) {
            await onStream({ type: 'status', content: '🔍 Analyzing codebase...' });
            const manifest = global.sandboxState.fileCache.manifest;
            const editIntent = await analyzeEditIntentAI(prompt, manifest, model);
            const context = selectFilesForEdit(prompt, manifest);
            
            const primaryContents = await getFileContents(context.primaryFiles, manifest as any);
            const contextContents = await getFileContents(context.contextFiles, manifest as any);
            const formatted = formatFilesForAI(primaryContents, contextContents);
            
            systemPrompt += `EDIT MODE: Fix the following runtime error by identifying and updating ONLY the affected components.
Be extremely concise. Identify the missing variable, import, or syntax error and output the fixed file(s).
\n\n` + formatted;
        }

        let aggregatedFullOutput = "";
        
        async function emitStream(data: any) {
            if (data.type === 'stream' && data.text) {
                aggregatedFullOutput += data.text;
            }
            await onStream(data);
        }

        console.log('[generate-ai-code-stream] Calling LLM...');

        const result = await streamText({
            model: defaultOpenRouter(model.replace('openrouter:', '')),
            system: systemPrompt,
            messages: [{ role: 'user', content: prompt }],
            maxSteps: 10,
            tools: {
                update_project_plan: tool({
                    description: 'Updates the visual execution plan for the user. Call this at the start of every response.',
                    parameters: z.object({
                        tasks: z.array(z.object({
                            id: z.string(),
                            title: z.string(),
                            description: z.string(),
                            status: z.enum(['pending', 'in-progress', 'completed', 'need-help', 'failed']),
                            priority: z.enum(['high', 'medium', 'low']),
                            level: z.number().default(0),
                            dependencies: z.array(z.string()).default([]),
                            subtasks: z.array(z.object({
                                id: z.string(),
                                title: z.string(),
                                description: z.string(),
                                status: z.string(),
                                priority: z.string()
                            })).default([])
                        }))
                    }),
                    execute: async ({ tasks }: { tasks: any[] }) => {
                        await emitStream({ type: 'plan', content: tasks });
                        return { status: 'success', message: 'User plan updated.' };
                    }
                }),
                edit_file: tool({
                    description: 'Surgically edits a specific file using sparse diffs. Use this for small updates (like CSS/Tailwind tweaks) to minimize token usage.',
                    parameters: z.object({
                        target_file: z.string(),
                        instructions: z.string(),
                        code_edit: z.string()
                    }),
                    execute: async (args: { target_file: string; instructions: string; code_edit: string }) => {
                        await emitStream({ type: 'status', content: '⚒️ Morphing ' + args.target_file + '...' });
                        const original = global.sandboxState?.fileCache?.files?.[args.target_file]?.content || "";
                        if (!original) return { status: 'error', message: 'File not found locally. Fallback to full file generation.' };
                        const mergedContent = await applyMorphEdit(original, {
                            targetFile: args.target_file,
                            instructions: args.instructions,
                            codeEdit: args.code_edit
                        }, model);
                        await emitStream({
                            type: 'stream',
                            text: `<file path="${args.target_file}">\n${mergedContent}\n</file>\n\n`,
                            raw: false
                        });
                        return { status: 'success', file: args.target_file };
                    }
                }),
                scrapeWebsite: tool({
                    description: 'Clones the structure and content of an existing website using Firecrawl.',
                    parameters: z.object({
                        url: z.string().url().describe('The URL of the website to scrape and clone.'),
                    }),
                    execute: async ({ url }: { url: string }) => {
                        await emitStream({ type: 'status', content: '🕷️ Scraping website: ' + url + ' via Firecrawl...' });
                        const result = await scrapeWithFirecrawl(url);
                        if (!result.success) return { status: 'error', message: result.error };
                        await emitStream({ type: 'status', content: '✨ Context extracted from ' + url });
                        return { 
                            status: 'success', 
                            content: result.data.markdown || result.data.content || "Site content extracted."
                        };
                    },
                }),
            },
            onFinish: async (event) => {
                console.log('[generate-ai-code-stream] Generation finished.', event.usage);
                
                // --- MANIFEST PERSISTENCE ---
                if (global.sandboxState?.fileCache) {
                    const files: Record<string, { content: string; lastModified: number }> = {};
                    const regex = /<file path="([^"]+)">([\s\S]*?)<\/file>/g;
                    let match;
                    // Use the final aggregated text for manifest updates
                    while ((match = regex.exec(aggregatedFullOutput)) !== null) {
                        files[match[1]] = {
                            content: match[2],
                            lastModified: Date.now()
                        };
                    }
                    
                    if (Object.keys(files).length > 0) {
                        console.log(`[generate-ai-code-stream] committing ${Object.keys(files).length} files to manifest context.`);
                        global.sandboxState.fileCache.files = {
                            ...global.sandboxState.fileCache.files,
                            ...files
                        };
                        global.sandboxState.fileCache.manifest = {
                            ...global.sandboxState.fileCache.manifest,
                            files: { ...global.sandboxState.fileCache.manifest?.files, ...files }
                        };
                    }
                }
            },
        } as any);

        await emitStream({ type: 'thinking', content: 'AI is generating code...' });

        for await (const textPart of result.textStream) {
            await emitStream({
                type: 'stream',
                text: textPart,
                raw: true
            });
        }

        await onStream({
            type: 'complete',
            content: aggregatedFullOutput
        });

        // Log edit record
        if (isEdit && global.conversationState) {
            global.conversationState.context.edits.push({
                timestamp: Date.now(),
                userRequest: prompt,
                editType: 'UPDATE_COMPONENT',
                targetFiles: [],
                confidence: 1.0,
                outcome: 'success'
            });
            global.conversationState.lastUpdated = Date.now();
        }

    } catch (error: any) {
        console.error('[generate-ai-code-stream] Generation error:', error);
        await onStream({
            type: 'error',
            error: error.message || 'Workflow execution failed.'
        });
    }
}
