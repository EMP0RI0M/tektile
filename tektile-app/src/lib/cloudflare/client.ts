/**
 * Cloudflare Wrangler API Client (Edge Compatible)
 * 
 * This client provides a thin wrapper over the Cloudflare V4 API to handle
 * programmatic Worker deployments and custom subdomain bindings.
 */

export interface CloudflareConfig {
    accountId: string;
    apiToken: string;
    zoneId?: string; // Required for custom hostnames
}

export interface DeploymentMetadata {
    main_module: string;
    compatibility_date: string;
    compatibility_flags?: string[];
}

export class CloudflareClient {
    private config: CloudflareConfig;

    constructor(config: CloudflareConfig) {
        this.config = config;
    }

    /**
     * Uploads the Worker script to Cloudflare.
     * Uses the standard multipart/form-data upload method.
     */
    async uploadWorker(scriptName: string, content: string, metadata: DeploymentMetadata) {
        const url = `https://api.cloudflare.com/client/v4/accounts/${this.config.accountId}/workers/scripts/${scriptName}`;
        
        const formData = new FormData();
        
        // Metadata is required to specify the entrypoint
        formData.append("metadata", JSON.stringify(metadata));
        
        // The script itself. The key must match the main_module in metadata.
        const blob = new Blob([content], { type: "application/javascript+module" });
        formData.append(metadata.main_module, blob, metadata.main_module);

        const response = await fetch(url, {
            method: "PUT",
            headers: {
                "Authorization": `Bearer ${this.config.apiToken}`,
            },
            body: formData
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`Cloudflare Upload Failed: ${JSON.stringify(error)}`);
        }

        return await response.json();
    }

    /**
     * Binds a custom hostname to a specific worker.
     * Requires the project slug and the worker name.
     */
    async bindCustomHostname(hostname: string, workerName: string) {
        if (!this.config.zoneId) throw new Error("Zone ID is required for custom hostnames");

        const url = `https://api.cloudflare.com/client/v4/zones/${this.config.zoneId}/custom_hostnames`;
        
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${this.config.apiToken}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                hostname,
                ssl: {
                    method: "txt",
                    type: "dv"
                },
                // Custom hostname metadata can include worker routing if configured at the zone level
            })
        });

        if (!response.ok) {
            const error = await response.json();
            // 1001 means hostname already exists, which we can handle gracefully
            if (error.errors?.[0]?.code === 1001) {
                console.warn("[Cloudflare] Hostname already exists:", hostname);
                return { success: true, alreadyExists: true };
            }
            throw new Error(`Cloudflare Hostname Binding Failed: ${JSON.stringify(error)}`);
        }

        return await response.json();
    }

    /**
     * Creates a Deployment for the script.
     * This makes the uploaded version 'active' on the edge.
     */
    async deployWorker(scriptName: string) {
        const url = `https://api.cloudflare.com/client/v4/accounts/${this.config.accountId}/workers/scripts/${scriptName}/deployments`;
        
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${this.config.apiToken}`,
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`Cloudflare Deployment Failed: ${JSON.stringify(error)}`);
        }

        return await response.json();
    }
}
