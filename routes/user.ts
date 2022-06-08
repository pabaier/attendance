import express, { Request, Response } from 'express';
import NodeCache from 'node-cache';
import { authCheckMiddleware } from '../middleware/auth';
import { DbClient } from '../db/dbClient';

export default function (myCache: NodeCache, dbClient: DbClient) {
    const router = express.Router();

    router.use(authCheckMiddleware);

    router.get('/dashboard', (req: Request, res: Response) => {
        res.render('dashboard', { user: req.session.user })
    });

    router.get('/attendance', (req: Request, res: Response) => {
        res.render('attendance', { user: req.session.user })
    });

    router.post('/attendance', (req: Request, res: Response) => {
        const result = parseInt(req.body.code) == myCache.get('code') as number
        if (result) {
            dbClient.signIn(req.session.user?.id as number)
        }
        res.json({ result: result })
    });
    return router;
}