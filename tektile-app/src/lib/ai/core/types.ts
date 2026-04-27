export type EditType = 'UPDATE_COMPONENT' | 'ADD_FEATURE' | 'FIX_ISSUE' | 'UPDATE_STYLE' | 'REFACTOR' | 'FULL_REBUILD' | 'ADD_DEPENDENCY';

export interface ImportInfo {
    source: string;
    imports: string[];
    isLocal: boolean;
    defaultImport?: string;
}

export interface ComponentInfo {
    name: string;
    hooks: string[];
    hasState: boolean;
    childComponents: string[];
}

export interface FileInfo {
    content: string;
    type: 'component' | 'page' | 'layout' | 'hook' | 'context' | 'style' | 'config' | 'utility' | string;
    lastModified: number;
    componentInfo?: ComponentInfo;
    imports?: ImportInfo[];
    exports?: string[];
}

export interface FileManifest {
    files: Record<string, FileInfo>;
    entryPoint: string;
    styleFiles: string[];
    routes: string[];
    componentTree: Record<string, any>;
}

export interface EditIntent {
    type: EditType;
    targetFiles: string[];
    confidence: number;
    description: string;
    suggestedContext: string[];
    searchPlan?: SearchPlan;
}

export interface SearchPlan {
    editType: EditType;
    reasoning: string;
    searchTerms: string[];
    regexPatterns?: string[];
    fileTypesToSearch: string[];
    expectedMatches: number;
    fallbackSearch?: {
        terms: string[];
        patterns?: string[];
    };
}

export interface ConversationMessage {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: number;
    metadata?: {
        sandboxId?: string;
        editedFiles?: string[];
    };
}

export interface ConversationEdit {
    timestamp: number;
    userRequest: string;
    editType: string;
    targetFiles: string[];
    confidence: number;
    outcome: 'success' | 'failure';
}

export interface ConversationState {
    conversationId: string;
    startedAt: number;
    lastUpdated: number;
    context: {
        messages: ConversationMessage[];
        edits: ConversationEdit[];
        projectEvolution: {
            majorChanges: string[];
        };
        userPreferences: Record<string, any>;
    };
}

export interface SandboxState {
    fileCache?: {
        manifest: FileManifest;
    };
}

export interface FileManifestSimple {
    files: Record<string, string>;
    entryPoint?: string;
    styleFiles?: string[];
    routes?: string[];
    componentTree?: Record<string, any>;
}
