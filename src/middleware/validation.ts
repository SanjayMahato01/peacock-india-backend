import { createMiddleware } from 'hono/factory'
import { z, ZodSchema } from 'zod'

// Create a generic context variable key
const VALIDATED_BODY_KEY = 'validatedBody'

export const validate = <T extends ZodSchema>(schema: T) => {
  return createMiddleware<{
    Variables: {
      [VALIDATED_BODY_KEY]: z.infer<T>
    }
  }>(async (c, next) => {
    try {
      const body = await c.req.json()
      const validatedData = schema.parse(body)
      c.set(VALIDATED_BODY_KEY, validatedData)
      await next()
    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.json({ 
          error: 'Validation failed', 
          details: error
        }, 400)
      }
      throw error
    }
  })
}

// Helper type to extract validated body type
export type ValidatedBody<T extends ZodSchema> = z.infer<T>