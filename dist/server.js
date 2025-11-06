"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const hono_1 = require("hono");
const node_server_1 = require("@hono/node-server");
const logger_1 = require("hono/logger");
const cors_1 = require("hono/cors");
const dev_1 = require("hono/dev");
require("dotenv/config");
const auth_js_1 = __importDefault(require("./routes/auth.js"));
const health_js_1 = __importDefault(require("./routes/health.js"));
const ai_js_1 = __importDefault(require("./routes/ai.js"));
const notes_1 = __importDefault(require("./routes/notes"));
const app = new hono_1.Hono();
// Middleware
console.log(process.env.DATABASE_URL);
app.use('*', (0, logger_1.logger)());
app.use('/*', (0, cors_1.cors)({
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
app.route('/api/auth', auth_js_1.default);
app.route('/api/health', health_js_1.default);
app.route('/api/notes', notes_1.default);
app.route('/api/ai', ai_js_1.default);
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
    (0, dev_1.showRoutes)(app);
}
const rawPort = process.env.PORT;
const port = rawPort && !isNaN(Number(rawPort)) ? Number(rawPort) : 3001;
console.log(`🚀 Server is running on http://localhost:${port}`);
(0, node_server_1.serve)({
    fetch: app.fetch,
    port,
});
