import JSZip from "jszip";

/**
 * ZIP SERVICE (JSZip based)
 * 
 * Handles the bidirectional transformation between our internal
 * CodeManifest (JSON) and portable .zip artifacts.
 */
export class ZipService {
    /**
     * Bundles project files into a ZIP blob.
     * @param files - Record of paths and contents
     */
    static async bundle(files: Record<string, string>): Promise<Blob> {
        const zip = new JSZip();

        // Recursively add files to the zip
        for (const [path, maybeContent] of Object.entries(files)) {
            // Remove leading slashes if present
            const normalizedPath = path.startsWith("/") ? path.slice(1) : path;
            
            // Normalize content to string (handles legacy {content} or {code} objects)
            const content = typeof maybeContent === 'string' 
                ? maybeContent 
                : (maybeContent as any)?.code || (maybeContent as any)?.content || "";
                
            zip.file(normalizedPath, String(content));
        }

        // Generate the blob
        const blob = await zip.generateAsync({
            type: "blob"
        });

        return blob;
    }

    /**
     * Extracts a ZIP blob back into a manifest.
     * @param blob - The zip file blob
     */
    static async extract(blob: Blob): Promise<Record<string, string>> {
        const zip = await JSZip.loadAsync(blob);
        const files: Record<string, string> = {};

        // Iterate through each file in the zip
        const fileNames = Object.keys(zip.files);
        for (const name of fileNames) {
            const file = zip.files[name];
            if (!file.dir) {
                const content = await file.async("string");
                files[name] = content;
            }
        }

        return files;
    }
}
