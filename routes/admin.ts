import express, { Request, Response } from 'express';
import NodeCache from 'node-cache';
import { DbClient } from '../db/dbClient';
import { authCheckMiddleware, rollCheckMiddleware } from '../middleware/auth';

export default function (myCache: NodeCache, dbClient: DbClient) {
    const router = express.Router()

    const codeRefreshRate: number = parseInt(process.env.CODE_REFRESH_RATE || '2');

    router.use(authCheckMiddleware, rollCheckMiddleware(['admin']))

    router.get('/', (req: Request, res: Response) => {
        res.render('admin', { user: req.session.user })
    });

    router.get('/code/', (req: Request, res: Response) => {
        res.render('code', { user: req.session.user })
    });

    router.get('/code/update', (req: Request, res: Response) => {
        const newNumber: number = Math.floor(Math.random() * 9) + 1;
        const value: number = myCache.has('code') ? myCache.take('code') as number : 0;
        myCache.set('code', (value * 10 + newNumber) % 100000, codeRefreshRate / 1000 + 500);
        res.json({ code: newNumber })
    });

    router.get('/users', async (req: Request, res: Response) => {
        const users = await dbClient.getUsers();
        res.render('users', { user: req.session.user });
    });

    return router;
}