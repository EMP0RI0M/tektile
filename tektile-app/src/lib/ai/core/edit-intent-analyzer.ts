import { FileManifest, EditType, EditIntent, FileInfo, SearchPlan } from './types';
import { generateObject, type LanguageModel } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { z } from 'zod';

const defaultOpenRouter = createOpenAI({
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: 'https://openrouter.ai/api/v1',
});

const searchPlanSchema = z.object({
    editType: z.enum([
        'UPDATE_COMPONENT',
        'ADD_FEATURE',
        'FIX_ISSUE',
        'UPDATE_STYLE',
        'REFACTOR',
        'ADD_DEPENDENCY',
        'REMOVE_ELEMENT'
    ]),
    reasoning: z.string(),
    searchTerms: z.array(z.string()),
    regexPatterns: z.array(z.string()).optional(),
    fileTypesToSearch: z.array(z.string()).default(['.jsx', '.tsx', '.js', '.ts']),
    expectedMatches: z.number().default(1),
});

/**
 * AI-powered analysis of user prompts to determine edit intent and search strategy
 */
export async function analyzeEditIntentAI(
    prompt: string,
    manifest: FileManifest,
    model: string = 'openrouter:stepfun/step-3.5-flash:free'
): Promise<EditIntent> {
    try {
        const filePaths = Object.keys(manifest.files);
        const fileSummary = filePaths.slice(0, 50).join(', ');
        
        // --- NEW: Heuristic Path Extraction from Error Messages ---
        // Look for paths like /src/components/MainContent.jsx in the prompt
        const pathRegex = /(\/[a-zA-Z0-9._/-]+\.[a-zA-Z0-9]+)/g;
        const foundPaths = prompt.match(pathRegex) || [];
        const targetFiles = foundPaths.filter(p => filePaths.includes(p.startsWith('/') ? p.slice(1) : p) || filePaths.includes(p));

        const result = await generateObject({
            model: defaultOpenRouter(model.replace('openrouter:', '')),
            schema: searchPlanSchema,
            prompt: 'User Request: ' + prompt + '\nFiles available: ' + fileSummary + '\n\nCreate a search plan to identify the files that need to be edited to fulfill the user request.'
        });

        const plan = result.object as SearchPlan;

        return {
            type: plan.editType,
            targetFiles: targetFiles.length > 0 ? targetFiles.map(p => p.startsWith('/') ? p.slice(1) : p) : [manifest.entryPoint], 
            confidence: 1.0,
            description: plan.reasoning,
            suggestedContext: [],
            searchPlan: plan
        };
    } catch (error) {
        console.error('[analyzeEditIntentAI] Error:', error);
        return {
            type: 'UPDATE_COMPONENT',
            targetFiles: [manifest.entryPoint],
            confidence: 0.1,
            description: 'Failed to analyze intent, defaulting to entry point.',
            suggestedContext: []
        };
    }
}

/**
 * Heuristic-based analysis of user prompts (simplified)
 */
export function analyzeEditIntent(
    prompt: string,
    manifest: FileManifest
): EditIntent {
    return {
        type: 'UPDATE_COMPONENT',
        targetFiles: [manifest.entryPoint],
        confidence: 0.5,
        description: 'Heuristic analysis placeholder.',
        suggestedContext: []
    };
}
