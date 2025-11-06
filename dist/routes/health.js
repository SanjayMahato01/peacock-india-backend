"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hono_1 = require("hono");
const app = new hono_1.Hono();
app.get('/', (c) => {
    return c.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        service: 'AI Notes API'
    });
});
exports.default = app;
