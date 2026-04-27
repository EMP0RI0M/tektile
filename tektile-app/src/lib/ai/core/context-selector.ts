import { FileManifest, FileManifestSimple } from './types';
import { analyzeEditIntent } from './edit-intent-analyzer';

export interface FileContext {
    primaryFiles: string[];
    contextFiles: string[];
    systemPrompt: string;
    editIntent: any;
}

/**
 * Identify relevant files for editing based on user prompt
 */
export function selectFilesForEdit(
    prompt: string,
    manifest: FileManifest
): FileContext {
    const editIntent = analyzeEditIntent(prompt, manifest);
    
    return {
        primaryFiles: editIntent.targetFiles,
        contextFiles: Object.keys(manifest.files).filter(p => !editIntent.targetFiles.includes(p)),
        systemPrompt: 'You are updating the following files: ' + editIntent.targetFiles.join(', '),
        editIntent
    };
}

/**
 * Fetch file contents for identified context files
 */
export async function getFileContents(
    paths: string[],
    manifest: FileManifestSimple
): Promise<Record<string, string>> {
    const results: Record<string, string> = {};
    for (const path of paths) {
        if (manifest.files[path]) {
            results[path] = manifest.files[path];
        }
    }
    return results;
}

/**
 * Format context for AI system prompt (simplified)
 */
export function formatFilesForAI(
    primaryFiles: Record<string, string>,
    contextFiles: Record<string, string>
): string {
    let result = '## PRIMARY FILES TO MODIFY\n\n';
    
    for (const [path, content] of Object.entries(primaryFiles)) {
        result += '### ' + path + '\n';
        result += '```\n' + content + '\n```\n\n';
    }
    
    result += '## CONTEXT FILES\n\n';
    for (const [path, content] of Object.entries(contextFiles)) {
        result += '### ' + path + '\n';
        result += '```\n' + content + '\n```\n\n';
    }
    
    return result;
}
