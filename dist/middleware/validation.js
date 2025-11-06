import { createMiddleware } from 'hono/factory';
import { z } from 'zod';
// Create a generic context variable key
const VALIDATED_BODY_KEY = 'validatedBody';
export const validate = (schema) => {
    return createMiddleware(async (c, next) => {
        try {
            const body = await c.req.json();
            const validatedData = schema.parse(body);
            c.set(VALIDATED_BODY_KEY, validatedData);
            await next();
        }
        catch (error) {
            if (error instanceof z.ZodError) {
                return c.json({
                    error: 'Validation failed',
                    details: error
                }, 400);
            }
            throw error;
        }
    });
};
