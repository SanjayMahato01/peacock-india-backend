import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { logger } from 'hono/logger';
import { cors } from 'hono/cors';
import { showRoutes } from 'hono/dev';
import 'dotenv/config';
import authRoutes from './routes/auth.js';
import healthRoutes from './routes/health.js';
import aiRoutes from './routes/ai.js';
import notesRoutes from './routes/notes';
const app = new Hono();
// Middleware
console.log(process.env.DATABASE_URL);
app.use('*', logger());
app.use('/*', cors({
    origin: process.env.FRONTEND_URL || 'https://peacock-india-frontend.vercel.app',
    credentials: true,
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    exposeHeaders: ['Set-Cookie'],
    maxAge: 600,
}));
// Base route
app.get('/', (c) => c.text('🚀 AI Notes API is running!'));
// Route groups
app.route('/api/auth', authRoutes);
app.route('/api/health', healthRoutes);
app.route('/api/notes', notesRoutes);
app.route('/api/ai', aiRoutes);
// 404 handler
app.notFound((c) => {
    return c.json({ error: 'Route not found' }, 404);
});
// Error handler
app.onError((err, c) => {
    console.error('Server error:', err);
    return c.json({ error: 'Internal server error' }, 500);
});
// Show routes in development
if (process.env.NODE_ENV === 'development') {
    showRoutes(app);
}
const rawPort = process.env.PORT;
const port = rawPort && !isNaN(Number(rawPort)) ? Number(rawPort) : 3001;
console.log(`🚀 Server is running on http://localhost:${port}`);
serve({
    fetch: app.fetch,
    port,
});
