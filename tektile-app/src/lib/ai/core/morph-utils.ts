/**
 * Morph Utilities for Intelligent Diffs
 * Based on Tektile's morph-tool logic for surgical file edits.
 */

export interface MorphEdit {
    targetFile: string;
    instructions: string;
    codeEdit: string;
}

/**
 * Applies a sparse code edit to an existing file content.
 * The edit uses // ... existing code ... or similar to indicate unchanged sections.
 */
export async function applyMorphEdit(
    originalContent: string,
    edit: MorphEdit,
    fallbackModel: string = 'openai/gpt-4o-mini'
): Promise<string> {
    const morphApiKey = process.env.MORPH_API_KEY;
    const openRouterApiKey = process.env.OPENROUTER_API_KEY;
    
    // Choose endpoint and model based on available keys
    const baseUrl = morphApiKey ? "https://api.morphllm.com/v1" : "https://openrouter.ai/api/v1";
    const apiKey = morphApiKey || openRouterApiKey;
    const model = morphApiKey ? "morph-v3-fast" : (fallbackModel.includes('openrouter:') ? fallbackModel.replace('openrouter:', '') : fallbackModel);

    if (!apiKey) {
        console.warn("[Morph] NO API KEY - falling back to basic merge (risky)");
        return originalContent;
    }

    try {
        console.log(`[Morph] Merging ${edit.targetFile} via ${model}...`);
        
        const response = await fetch(`${baseUrl}/chat/completions`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model,
                messages: [
                    {
                        role: "system",
                        content: `You are a code merging engine. Apply the provided sparse update to the original code. 
                        The update uses "// ... existing code ..." to represent unchanged parts.
                        Output ONLY the full, complete resultant code. No explanations or markdown blocks.`
                    },
                    {
                        role: "user",
                        content: `<instruction>${edit.instructions}</instruction>\n<original>\n${originalContent}\n</original>\n<update>\n${edit.codeEdit}\n</update>`
                    }
                ],
                temperature: 0.1
            })
        });

        const data = await response.json();
        const mergedCode = data.choices?.[0]?.message?.content;

        if (!mergedCode) {
            console.error("[Morph] API response error:", data);
            throw new Error("Morph apply failed: No content returned");
        }

        // Clean any code blocks returned and trim
        return mergedCode.replace(/^```[a-z]*\n/i, '').replace(/\n```$/i, '').trim();
        
    } catch (error) {
        console.error("[Morph] Error applying edit:", error);
        return originalContent; // Safety fallback
    }
}
