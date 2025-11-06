import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { prisma } from '../lib/prisma';
import { z } from 'zod';
const app = new Hono();
// Validation schemas
const createNoteSchema = z.object({
    title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
    content: z.string().min(1, 'Content is required'),
    tags: z.array(z.string()).default([]),
});
const updateNoteSchema = z.object({
    title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
    content: z.string().min(1, 'Content is required'),
    tags: z.array(z.string()).default([]),
});
// Get all notes for user
app.get('/', authMiddleware, async (c) => {
    try {
        const payload = c.get('jwtPayload');
        const notes = await prisma.note.findMany({
            where: { userId: payload.userId },
            orderBy: { updatedAt: 'desc' },
        });
        return c.json({ notes });
    }
    catch (error) {
        console.error('Get notes error:', error);
        return c.json({ error: 'Failed to fetch notes' }, 500);
    }
});
// Get single note
app.get('/:id', authMiddleware, async (c) => {
    try {
        const payload = c.get('jwtPayload');
        const noteId = c.req.param('id');
        const note = await prisma.note.findFirst({
            where: {
                id: noteId,
                userId: payload.userId
            },
        });
        if (!note) {
            return c.json({ error: 'Note not found' }, 404);
        }
        return c.json({ note });
    }
    catch (error) {
        console.error('Get note error:', error);
        return c.json({ error: 'Failed to fetch note' }, 500);
    }
});
// Create new note
app.post('/', authMiddleware, validate(createNoteSchema), async (c) => {
    try {
        const payload = c.get('jwtPayload');
        const validatedData = c.get('validatedBody');
        const note = await prisma.note.create({
            data: {
                title: validatedData.title,
                content: validatedData.content,
                tags: validatedData.tags,
                userId: payload.userId,
            },
        });
        return c.json({
            message: 'Note created successfully',
            note
        });
    }
    catch (error) {
        console.error('Create note error:', error);
        return c.json({ error: 'Failed to create note' }, 500);
    }
});
// Update note
app.put('/:id', authMiddleware, validate(updateNoteSchema), async (c) => {
    try {
        const payload = c.get('jwtPayload');
        const noteId = c.req.param('id');
        const validatedData = c.get('validatedBody');
        // Check if note exists and belongs to user
        const existingNote = await prisma.note.findFirst({
            where: {
                id: noteId,
                userId: payload.userId
            },
        });
        if (!existingNote) {
            return c.json({ error: 'Note not found' }, 404);
        }
        const note = await prisma.note.update({
            where: { id: noteId },
            data: {
                title: validatedData.title,
                content: validatedData.content,
                tags: validatedData.tags,
                updatedAt: new Date(),
            },
        });
        return c.json({
            message: 'Note updated successfully',
            note
        });
    }
    catch (error) {
        console.error('Update note error:', error);
        return c.json({ error: 'Failed to update note' }, 500);
    }
});
// Delete note
app.delete('/:id', authMiddleware, async (c) => {
    try {
        const payload = c.get('jwtPayload');
        const noteId = c.req.param('id');
        // Check if note exists and belongs to user
        const existingNote = await prisma.note.findFirst({
            where: {
                id: noteId,
                userId: payload.userId
            },
        });
        if (!existingNote) {
            return c.json({ error: 'Note not found' }, 404);
        }
        await prisma.note.delete({
            where: { id: noteId },
        });
        return c.json({ message: 'Note deleted successfully' });
    }
    catch (error) {
        console.error('Delete note error:', error);
        return c.json({ error: 'Failed to delete note' }, 500);
    }
});
export default app;
