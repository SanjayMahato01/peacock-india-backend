"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = void 0;
const factory_1 = require("hono/factory");
const jwt_1 = require("hono/jwt");
const cookie_1 = require("hono/cookie");
exports.authMiddleware = (0, factory_1.createMiddleware)(async (c, next) => {
    // Try to get token from Authorization header first
    let token = c.req.header('Authorization')?.replace('Bearer ', '');
    // If no token in header, try to get from cookie
    if (!token) {
        token = (0, cookie_1.getCookie)(c, 'auth_token');
    }
    if (!token) {
        return c.json({ error: 'Unauthorized' }, 401);
    }
    try {
        const payload = await (0, jwt_1.verify)(token, process.env.JWT_SECRET);
        c.set('jwtPayload', payload);
        await next();
    }
    catch (error) {
        console.error('Auth middleware error:', error);
        return c.json({ error: 'Invalid token' }, 401);
    }
});
