"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = void 0;
const factory_1 = require("hono/factory");
const zod_1 = require("zod");
// Create a generic context variable key
const VALIDATED_BODY_KEY = 'validatedBody';
const validate = (schema) => {
    return (0, factory_1.createMiddleware)(async (c, next) => {
        try {
            const body = await c.req.json();
            const validatedData = schema.parse(body);
            c.set(VALIDATED_BODY_KEY, validatedData);
            await next();
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                return c.json({
                    error: 'Validation failed',
                    details: error
                }, 400);
            }
            throw error;
        }
    });
};
exports.validate = validate;
