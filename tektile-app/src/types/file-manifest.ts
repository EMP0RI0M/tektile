export enum EditType {
  UPDATE_COMPONENT = 'UPDATE_COMPONENT',
  ADD_FEATURE = 'ADD_FEATURE',
  FIX_ISSUE = 'FIX_ISSUE',
  UPDATE_STYLE = 'UPDATE_STYLE',
  REFACTOR = 'REFACTOR',
  FULL_REBUILD = 'FULL_REBUILD',
  ADD_DEPENDENCY = 'ADD_DEPENDENCY',
}

export interface ImportInfo {
  source: string;
  imports: string[];
  defaultImport?: string;
  isLocal: boolean;
}

export interface ComponentInfo {
  name: string;
  hooks: string[];
  hasState: boolean;
  childComponents: string[];
}

export interface FileInfo {
  path: string;
  content: string;
  type: 'component' | 'page' | 'layout' | 'style' | 'hook' | 'context' | 'config' | 'utility';
  imports?: ImportInfo[];
  exports?: string[];
  componentInfo?: ComponentInfo;
  lastModified: number;
}

export interface FileManifest {
  projectId: string;
  entryPoint: string;
  files: Record<string, FileInfo>;
  styleFiles: string[];
  routes: Array<{ path: string; component: string }>;
  componentTree: Record<string, {
    file: string;
    imports: string[];
    importedBy: string[];
    type: 'page' | 'layout' | 'component';
  }>;
}

export interface EditIntent {
  type: EditType;
  targetFiles: string[];
  confidence: number;
  description: string;
  suggestedContext: string[];
}

export interface IntentPattern {
  patterns: RegExp[];
  type: EditType;
  fileResolver: (prompt: string, manifest: FileManifest) => string[];
}
