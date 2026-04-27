export interface ParsedResponse {
    explanation: string;
    template: string;
    files: Array<{ path: string; content: string }>;
    packages: string[];
    commands: string[];
    structure: string | null;
}

/**
 * Robust XML parser for AI responses
 */
// Function to extract packages from import statements (Ported from Tektile Architecture)
function extractPackagesFromCode(content: string): string[] {
    const packages: string[] = [];
    const importRegex = /import\s+(?:(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)(?:\s*,\s*(?:\{[^}]*\}|\*\s+as\s+\w+|\w+))*\s+from\s+)?['"]([^'"]+)['"]/g;
    const requireRegex = /require\s*\(['"]([^'"]+)['"]\)/g;
    
    let match;
    while ((match = importRegex.exec(content)) !== null) {
        const importPath = match[1];
        if (!importPath.startsWith('.') && !importPath.startsWith('/') && 
            importPath !== 'react' && importPath !== 'react-dom' && 
            !importPath.startsWith('@/')) {
            const packageName = importPath.startsWith('@') 
                ? importPath.split('/').slice(0, 2).join('/') 
                : importPath.split('/')[0];
            if (!packages.includes(packageName)) {
                packages.push(packageName);
            }
        }
    }

    while ((match = requireRegex.exec(content)) !== null) {
        const importPath = match[1];
        if (!importPath.startsWith('.') && !importPath.startsWith('/') && 
            !importPath.startsWith('@/')) {
            const packageName = importPath.startsWith('@') 
                ? importPath.split('/').slice(0, 2).join('/') 
                : importPath.split('/')[0];
            if (!packages.includes(packageName)) {
                packages.push(packageName);
            }
        }
    }
    return packages;
}

/**
 * Robust XML parser for AI responses with automatic dependency extraction
 */
export function parseAIResponse(response: string): ParsedResponse {
    const sections = {
        files: [] as Array<{ path: string; content: string }>,
        commands: [] as string[],
        packages: [] as string[],
        structure: null as string | null,
        explanation: '',
        template: ''
    };

    const fileMap = new Map<string, { content: string; isComplete: boolean }>();

    // 1. <file> tags
    const fileRegex = /<file path="([^"]+)">([\s\S]*?)(?:<\/file>|$)/g;
    let match;
    while ((match = fileRegex.exec(response)) !== null) {
        const filePath = match[1];
        const content = match[2].trim();
        const hasClosingTag = response.substring(match.index, match.index + match[0].length).includes('</file>');

        const existing = fileMap.get(filePath);
        let shouldReplace = !existing || (!existing.isComplete && hasClosingTag) || (existing.isComplete && hasClosingTag && content.length > existing.content.length);

        if (shouldReplace) {
             // Basic validation: skip clearly broken snippets unless it's a first match
            if (content.includes('...') && !content.includes('...props') && !content.includes('...rest') && existing) {
                // Keep existing
            } else {
                fileMap.set(filePath, { content, isComplete: hasClosingTag });
            }
        }
    }

    // 2. Markdown file blocks (backwards compatibility)
    const markdownFileRegex = /```(?:file )?path="([^"]+)"\n([\s\S]*?)```/g;
    while ((match = markdownFileRegex.exec(response)) !== null) {
        const filePath = match[1];
        const content = match[2].trim();
        if (!fileMap.has(filePath)) {
            fileMap.set(filePath, { content, isComplete: true });
        }
    }

    // Convert map to array and extract packages from code
    for (const [path, { content }] of fileMap.entries()) {
        sections.files.push({ path, content });
        
        // AUTO-HEAL DEPENDENCIES: Extract from imports
        const filePackages = extractPackagesFromCode(content);
        for (const pkg of filePackages) {
            if (!sections.packages.includes(pkg)) {
                sections.packages.push(pkg);
            }
        }
    }

    // 3. Command and Explicit Package tags
    const cmdRegex = /<command>(.*?)<\/command>/g;
    while ((match = cmdRegex.exec(response)) !== null) {
        sections.commands.push(match[1].trim());
    }

    const pkgRegex = /<package>(.*?)<\/package>/g;
    while ((match = pkgRegex.exec(response)) !== null) {
        if (!sections.packages.includes(match[1].trim())) {
            sections.packages.push(match[1].trim());
        }
    }

    const packagesRegex = /<packages>([\s\S]*?)<\/packages>/;
    const packagesMatch = response.match(packagesRegex);
    if (packagesMatch) {
        const packagesContent = packagesMatch[1].trim();
        const packagesList = packagesContent.split(/[\n,]+/)
            .map(pkg => pkg.trim())
            .filter(pkg => pkg.length > 0);
        
        packagesList.forEach(pkg => {
            if (!sections.packages.includes(pkg)) sections.packages.push(pkg);
        });
    }

    // Other tags
    const tagsMap: Record<string, keyof ParsedResponse> = {
        'explanation': 'explanation',
        'template': 'template',
        'structure': 'structure'
    };

    for (const [tag, key] of Object.entries(tagsMap)) {
        const regex = new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`);
        const result = response.match(regex);
        if (result) {
            (sections as any)[key] = result[1].trim();
        }
    }

    return sections;
}
