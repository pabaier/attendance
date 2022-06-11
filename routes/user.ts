import express, { Request, Response } from 'express';
import NodeCache from 'node-cache';
import { authCheckMiddleware } from '../middleware/auth';
import { DbClient } from '../db/dbClient';
import { Alert } from '../models';

export default function (myCache: NodeCache, dbClient: DbClient) {
    const router = express.Router();

    router.use(authCheckMiddleware);

    router.get('/dashboard', (req: Request, res: Response) => {
        res.render('user/dashboard', { user: req.session.user })
    });

    router.get('/attendance', (req: Request, res: Response) => {
        res.render('user/attendance', { user: req.session.user })
    });

    router.post('/attendance', (req: Request, res: Response) => {
        const result = parseInt(req.body.code) == myCache.get('code') as number
        var alert: Alert[] = [];
        if (result) {
            dbClient.signIn(req.session.user?.id as number)
            alert.push({type: 'success', message: 'success'})
        }
        else {
            alert.push({type: 'danger', message: 'try again'})
        }
        res.json({ alert })
    });
    return router;
}