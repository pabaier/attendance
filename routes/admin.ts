import express, { Request, Response } from 'express';
import NodeCache from 'node-cache';
import { authCheckMiddleware, rollCheckMiddleware } from '../middleware/auth';

export default function (myCache: NodeCache) {
    const router = express.Router()

    const codeRefreshRate: number = parseInt(process.env.CODE_REFRESH_RATE || '2');

    router.use(authCheckMiddleware, rollCheckMiddleware(['admin']))

    router.get('/', (req: Request, res: Response) => {
        res.render('admin', { userInfo: req.session.userInfo })
    });

    router.get('/code/', (req: Request, res: Response) => {
        res.render('code', { userInfo: req.session.userInfo })
    });

    router.get('/code/update', (req: Request, res: Response) => {
        const newNumber: number = Math.floor(Math.random() * 9) + 1;
        const value: number = myCache.has('code') ? myCache.take('code') as number : 0;
        myCache.set('code', (value * 10 + newNumber) % 100000, codeRefreshRate / 1000 + 500);
        res.json({ code: newNumber })
    });

    return router;
}