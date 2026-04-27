import { createClient } from "@/lib/supabase/client";

/**
 * STORAGE SERVICE (Supabase/R2)
 * 
 * Manages the persistence of project artifacts in the R2-backed 
 * Supabase Storage buckets.
 */
export class StorageService {
    private static BUCKET_NAME = "projects";

    /**
     * Uploads a project ZIP snapshot.
     * @param projectId - The target project ID
     * @param blob - The ZIP file blob
     */
    static async uploadSnapshot(projectId: string, blob: Blob): Promise<string> {
        const supabase = createClient();
        const timestamp = new Date().getTime();
        const filePath = `${projectId}/${timestamp}.zip`;

        const { data, error } = await supabase.storage
            .from(this.BUCKET_NAME)
            .upload(filePath, blob, {
                contentType: "application/zip",
                upsert: true
            });

        if (error) {
            console.error("[StorageService] Upload Failed:", error);
            throw new Error(`Cloud Persistence Failed: ${error.message}`);
        }

        return data.path;
    }

    /**
     * Gets a temporary download URL for a snapshot.
     */
    static async getDownloadUrl(path: string): Promise<string> {
        const supabase = createClient();
        const { data, error } = await supabase.storage
            .from(this.BUCKET_NAME)
            .createSignedUrl(path, 3600); // 1 hour validity

        if (error) throw new Error(`Snapshot Access Failed: ${error.message}`);
        return data.signedUrl;
    }

    /**
     * Deletes all snapshots for a project.
     */
    static async purgeProject(projectId: string): Promise<void> {
        const supabase = createClient();
        
        // List all files in the project folder
        const { data: files } = await supabase.storage
            .from(this.BUCKET_NAME)
            .list(projectId);

        if (files && files.length > 0) {
            const pathsToClear = files.map(f => `${projectId}/${f.name}`);
            await supabase.storage.from(this.BUCKET_NAME).remove(pathsToClear);
        }
    }
}
