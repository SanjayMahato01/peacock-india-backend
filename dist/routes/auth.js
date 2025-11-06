"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const hono_1 = require("hono");
const jwt_1 = require("hono/jwt");
const cookie_1 = require("hono/cookie");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma_1 = require("../lib/prisma");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const schemas_1 = require("../validation/schemas");
const app = new hono_1.Hono();
// Cookie configuration - Works for both dev and production
const getCookieOptions = (maxAge = 86400) => {
    const isProduction = process.env.NODE_ENV === 'production';
    return {
        httpOnly: true,
        secure: isProduction, // true in production, false in dev
        sameSite: isProduction ? 'none' : 'lax',
        maxAge,
        path: '/',
    };
};
// Signup route
app.post('/signup', (0, validation_1.validate)(schemas_1.signupSchema), async (c) => {
    try {
        const validatedData = c.get('validatedBody');
        // Check if user already exists
        const existingUser = await prisma_1.prisma.user.findUnique({
            where: { email: validatedData.email }
        });
        if (existingUser) {
            return c.json({
                error: 'User with this email already exists',
                details: [{ message: 'Email already registered' }]
            }, 400);
        }
        // Hash password
        const hashedPassword = await bcryptjs_1.default.hash(validatedData.password, 12);
        // Create user
        const user = await prisma_1.prisma.user.create({
            data: {
                name: validatedData.name,
                email: validatedData.email,
                password: hashedPassword,
            }
        });
        // Generate JWT token
        const token = await (0, jwt_1.sign)({ userId: user.id, email: user.email }, process.env.JWT_SECRET);
        // Set cookie with proper configuration
        (0, cookie_1.setCookie)(c, 'auth_token', token, getCookieOptions());
        return c.json({
            message: 'User created successfully',
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            },
            token
        });
    }
    catch (error) {
        console.error('Signup error:', error);
        return c.json({
            error: 'Internal server error',
            details: [{ message: 'Something went wrong' }]
        }, 500);
    }
});
// Login route
app.post('/login', (0, validation_1.validate)(schemas_1.loginSchema), async (c) => {
    try {
        const validatedData = c.get('validatedBody');
        // Find user
        const user = await prisma_1.prisma.user.findUnique({
            where: { email: validatedData.email }
        });
        if (!user) {
            return c.json({
                error: 'Invalid email or password',
                details: [{ message: 'Invalid credentials' }]
            }, 401);
        }
        // Verify password
        const isValidPassword = await bcryptjs_1.default.compare(validatedData.password, user.password);
        if (!isValidPassword) {
            return c.json({
                error: 'Invalid email or password',
                details: [{ message: 'Invalid credentials' }]
            }, 401);
        }
        // Generate JWT token
        const token = await (0, jwt_1.sign)({ userId: user.id, email: user.email }, process.env.JWT_SECRET);
        // Set cookie with proper configuration
        (0, cookie_1.setCookie)(c, 'auth_token', token, getCookieOptions());
        return c.json({
            message: 'Login successful',
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            },
            token
        });
    }
    catch (error) {
        console.error('Login error:', error);
        return c.json({
            error: 'Internal server error',
            details: [{ message: 'Something went wrong' }]
        }, 500);
    }
});
// Logout route
app.post('/logout', (c) => {
    (0, cookie_1.setCookie)(c, 'auth_token', '', getCookieOptions(0)); // maxAge: 0
    return c.json({ message: 'Logged out successfully' });
});
// Get current user
app.get('/me', auth_1.authMiddleware, async (c) => {
    const payload = c.get('jwtPayload');
    const user = await prisma_1.prisma.user.findUnique({
        where: { id: payload.userId },
        select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
        },
    });
    if (!user) {
        return c.json({ error: 'User not found' }, 404);
    }
    return c.json({ user });
});
exports.default = app;
