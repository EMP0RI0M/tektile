/**
 * Utility functions for getting API keys from request headers or body
 */

export function getAllApiKeysFromHeaders(req: Request) {
    return {
        groq: req.headers.get('x-groq-api-key'),
        anthropic: req.headers.get('x-anthropic-api-key'),
        gemini: req.headers.get('x-gemini-api-key'),
        openai: req.headers.get('x-openai-api-key'),
        openrouter: req.headers.get('x-openrouter-api-key'),
    };
}

export function getAllApiKeysFromBody(body: any) {
    if (!body || !body.apiKeys) return {};
    return body.apiKeys;
}
