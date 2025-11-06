import { createMiddleware } from 'hono/factory';
import { verify } from 'hono/jwt';
import { getCookie } from 'hono/cookie';
export const authMiddleware = createMiddleware(async (c, next) => {
    // Try to get token from Authorization header first
    let token = c.req.header('Authorization')?.replace('Bearer ', '');
    // If no token in header, try to get from cookie
    if (!token) {
        token = getCookie(c, 'auth_token');
    }
    if (!token) {
        return c.json({ error: 'Unauthorized' }, 401);
    }
    try {
        const payload = await verify(token, process.env.JWT_SECRET);
        c.set('jwtPayload', payload);
        await next();
    }
    catch (error) {
        console.error('Auth middleware error:', error);
        return c.json({ error: 'Invalid token' }, 401);
    }
});
