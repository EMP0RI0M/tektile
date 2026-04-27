/**
 * Types for conversation and sandbox state management
 */

export interface ConversationMessage {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: number;
    metadata?: any;
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
            majorChanges: Array<{
                timestamp: number;
                description: string;
                filesAffected: string[];
            }>;
        };
        userPreferences: any;
    };
}

export interface Subtask {
    id: string;
    title: string;
    description: string;
    status: 'pending' | 'in-progress' | 'completed' | 'need-help' | 'failed';
    priority: 'high' | 'medium' | 'low';
    tools?: string[];
  }
  
export interface Task {
    id: string;
    title: string;
    description: string;
    status: 'pending' | 'in-progress' | 'completed' | 'need-help' | 'failed';
    priority: 'high' | 'medium' | 'low';
    level: number;
    dependencies: string[];
    subtasks: Subtask[];
}

export interface SandboxState {
    fileCache?: {
        files: Record<string, { content: string; lastModified: number }>;
        lastSync: number;
        sandboxId: string;
        manifest?: any;
    };
}
