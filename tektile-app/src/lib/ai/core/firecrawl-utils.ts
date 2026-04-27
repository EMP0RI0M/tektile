/**
 * Firecrawl Utilities for AI Scraping
 */

export interface ScrapedContent {
    success: boolean;
    data?: any;
    error?: string;
}

/**
 * Scrapes a website using Firecrawl and returns the clean content.
 */
export async function scrapeWithFirecrawl(url: string): Promise<ScrapedContent> {
    const apiKey = process.env.FIRECRAWL_API_KEY;
    
    if (!apiKey) {
        return { success: false, error: "Firecrawl API key not found." };
    }

    try {
        console.log(`[Firecrawl] Scraping ${url}...`);
        
        const response = await fetch("https://api.firecrawl.dev/v1/scrape", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                url,
                formats: ["markdown", "html"],
                onlyMainContent: true
            })
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || `Firecrawl error: ${response.status}`);
        }

        return { 
            success: true, 
            data: data.data || data 
        };
        
    } catch (error: any) {
        console.error("[Firecrawl] Error scraping website:", error);
        return { success: false, error: error.message };
    }
}
