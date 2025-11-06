import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { z } from 'zod';
const app = new Hono();
const aiSummarySchema = z.object({
    content: z.string().min(1, 'Content is required'),
});
const aiImproveSchema = z.object({
    content: z.string().min(1, 'Content is required'),
});
const aiTagsSchema = z.object({
    content: z.string().min(1, 'Content is required'),
    title: z.string().optional(),
});
const aiTitleSchema = z.object({
    content: z.string().min(1, 'Content is required'),
});
// Enhanced OpenAI integration function
async function callOpenAI(prompt, maxTokens = 500) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey || apiKey === 'sk-your-actual-openai-api-key-here') {
        throw new Error('OpenAI API key not configured');
    }
    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: [{ role: 'user', content: prompt }],
                max_tokens: maxTokens,
                temperature: 0.7,
            }),
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`OpenAI API error: ${response.status} ${response.statusText} - ${errorData.error?.message || 'Unknown error'}`);
        }
        const data = await response.json();
        return data.choices[0]?.message?.content?.trim();
    }
    catch (error) {
        console.error('OpenAI API call failed:', error);
        throw error;
    }
}
// AI Summary endpoint with OpenAI
app.post('/summarize', authMiddleware, validate(aiSummarySchema), async (c) => {
    const { content } = c.get('validatedBody');
    try {
        const prompt = `Please provide a concise summary of the following text. Focus on the main points and key ideas. Keep it under 100 words:\n\n${content}`;
        const summary = await callOpenAI(prompt, 150);
        return c.json({
            summary,
            source: 'openai'
        });
    }
    catch (error) {
        console.error('AI Summary error:', error);
        // Enhanced fallback summary
        const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
        const importantSentences = sentences.filter(sentence => sentence.length > 20 &&
            !sentence.toLowerCase().includes('thank you') &&
            !sentence.toLowerCase().includes('please'));
        const summary = importantSentences.length > 0
            ? importantSentences.slice(0, Math.min(2, importantSentences.length)).join('. ') + '.'
            : sentences.slice(0, 2).join('. ') + (sentences.length > 2 ? '...' : '');
        return c.json({
            summary,
            source: 'fallback',
            note: 'Using fallback summary due to AI service issue'
        });
    }
});
// AI Improve endpoint with OpenAI
app.post('/improve', authMiddleware, validate(aiImproveSchema), async (c) => {
    const { content } = c.get('validatedBody');
    try {
        const prompt = `Please improve the following text by correcting grammar, enhancing clarity, and making it more engaging while preserving the original meaning. Return only the improved text without any additional comments:\n\n${content}`;
        const improvedContent = await callOpenAI(prompt);
        return c.json({
            improvedContent,
            source: 'openai'
        });
    }
    catch (error) {
        console.error('AI Improve error:', error);
        // Enhanced fallback improvement
        const improvedContent = content
            .split(/(?<=[.!?])\s+/)
            .map(sentence => {
            const trimmed = sentence.trim();
            if (trimmed.length === 0)
                return '';
            return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
        })
            .filter(sentence => sentence.length > 0)
            .join(' ');
        return c.json({
            improvedContent,
            source: 'fallback',
            note: 'Using fallback improvement due to AI service issue'
        });
    }
});
// AI Tags endpoint with OpenAI
app.post('/generate-tags', authMiddleware, validate(aiTagsSchema), async (c) => {
    const { content, title } = c.get('validatedBody');
    try {
        const prompt = `Generate 3-5 relevant tags for the following content. Return only a JSON array of tags without any additional text:\n\nTitle: ${title}\nContent: ${content}\n\nReturn format: ["tag1", "tag2", "tag3"]`;
        const tagsResponse = await callOpenAI(prompt, 100);
        // Parse the response to extract JSON array
        let tags = [];
        try {
            const jsonMatch = tagsResponse.match(/\[.*\]/);
            if (jsonMatch) {
                tags = JSON.parse(jsonMatch[0]);
            }
            else {
                // Fallback: split by commas and clean up
                tags = tagsResponse.split(',').map((tag) => tag.trim().replace(/["'\[\]]/g, ''));
            }
        }
        catch {
            // If parsing fails, use fallback method
            tags = generateFallbackTags(content, title);
        }
        // Clean and filter tags
        tags = tags
            .filter(tag => tag.length > 0 && tag.length <= 20)
            .slice(0, 5);
        return c.json({
            tags,
            source: 'openai'
        });
    }
    catch (error) {
        console.error('AI Tags error:', error);
        // Fallback to enhanced tag generation
        const tags = generateFallbackTags(content, title);
        return c.json({
            tags,
            source: 'fallback',
            note: 'Using fallback tags due to AI service issue'
        });
    }
});
// Enhanced helper function for fallback tag generation
function generateFallbackTags(content, title) {
    const allText = (title ? title + ' ' : '') + content;
    const words = allText.toLowerCase().split(/\s+/);
    const commonWords = new Set([
        'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
        'of', 'with', 'by', 'is', 'are', 'was', 'were', 'this', 'that', 'these',
        'those', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could'
    ]);
    const wordFreq = {};
    words.forEach(word => {
        const cleanWord = word.replace(/[^a-z0-9]/g, '');
        if (cleanWord.length > 3 && !commonWords.has(cleanWord)) {
            wordFreq[cleanWord] = (wordFreq[cleanWord] || 0) + 1;
        }
    });
    return Object.entries(wordFreq)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([word]) => word.charAt(0).toUpperCase() + word.slice(1));
}
// AI Title endpoint with OpenAI
app.post('/generate-title', authMiddleware, validate(aiTitleSchema), async (c) => {
    const { content } = c.get('validatedBody');
    try {
        const prompt = `Generate a concise and engaging title (max 6-8 words) for the following content. Return only the title without any additional text:\n\n${content}`;
        const title = await callOpenAI(prompt, 50);
        // Clean up the title
        const cleanTitle = title
            .replace(/["']/g, '')
            .replace(/^Title:\s*/i, '')
            .trim();
        return c.json({
            title: cleanTitle,
            source: 'openai'
        });
    }
    catch (error) {
        console.error('AI Title error:', error);
        // Enhanced fallback title generation
        const firstSentence = content.split(/[.!?]+/)[0].trim();
        let title = firstSentence.length > 60
            ? firstSentence.substring(0, 57).trim() + '...'
            : firstSentence;
        // Ensure title is not empty
        if (!title || title.length < 3) {
            title = 'New Note';
        }
        return c.json({
            title,
            source: 'fallback',
            note: 'Using fallback title due to AI service issue'
        });
    }
});
// Health check endpoint for AI service
app.get('/health', authMiddleware, async (c) => {
    try {
        // Test OpenAI connection with a simple prompt
        const testPrompt = 'Respond with just "OK" if you can read this.';
        await callOpenAI(testPrompt, 10);
        return c.json({
            status: 'healthy',
            openai: 'connected'
        });
    }
    catch (error) {
        return c.json({
            status: 'degraded',
            openai: 'disconnected',
            message: 'OpenAI service unavailable, using fallback methods'
        }, 503);
    }
});
export default app;
