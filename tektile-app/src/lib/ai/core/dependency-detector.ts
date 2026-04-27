/**
 * Dependency Detector
 * Surgically extracts npm package requirements from generated code.
 */

export function detectDependencies(files: Record<string, string>): string[] {
    const dependencies = new Set<string>();
    
    // Improved regex to handle various import styles
    // 1. Standard: import { x } from 'pkg'
    // 2. Default: import x from 'pkg'
    // 3. Side-effect: import 'pkg'
    // 4. Require: const x = require('pkg')
    // 5. Dynamic: import('pkg')
    const importRegex = /import\s+(?:(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)\s*,?\s*)*(?:from\s+)?['"]([^'"]+)['"]/g;
    const requireRegex = /require\s*\(['"]([^'"]+)['"]\)/g;
    const dynamicImportRegex = /import\s*\(['"]([^'"]+)['"]\)/g;

    const builtins = new Set([
        'fs', 'path', 'http', 'https', 'crypto', 'stream', 'util', 'os', 'url', 
        'querystring', 'child_process', 'worker_threads', 'events', 'zlib'
    ]);

    for (const content of Object.values(files)) {
        if (!content) continue;

        let match;
        const addPackage = (imp: string) => {
            // Skip relative/absolute/built-in
            if (imp.startsWith('.') || imp.startsWith('/') || builtins.has(imp)) return;
            
            let pkgName = "";
            if (imp.startsWith('@')) {
                const parts = imp.split('/');
                pkgName = parts.slice(0, 2).join('/');
            } else {
                pkgName = imp.split('/')[0];
            }
            
            // Cleanup
            pkgName = pkgName.trim().replace(/^@\//, ''); 
            
            if (pkgName && pkgName !== 'react' && pkgName !== 'react-dom') {
                dependencies.add(pkgName);
            }
        };

        while ((match = importRegex.exec(content)) !== null) addPackage(match[1]);
        while ((match = requireRegex.exec(content)) !== null) addPackage(match[1]);
        while ((match = dynamicImportRegex.exec(content)) !== null) addPackage(match[1]);
    }

    return Array.from(dependencies);
}
