import express, { Request, Response } from 'express';
import NodeCache from 'node-cache';
import { authCheckMiddleware } from '../middleware/auth';
import { DbClient } from '../db/dbClient';
import { Alert } from '../models';

export default function (myCache: NodeCache, dbClient: DbClient) {
    const router = express.Router();

    router.use(authCheckMiddleware);

    router.get('/attendance', (req: Request, res: Response) => {
        res.render('user/attendance', { user: req.session.user })
    });

    router.post('/attendance', async (req: Request, res: Response) => {
        const result = parseInt(req.body.code) == myCache.get('code') as number
        const signedIn = await dbClient.getLatestSignIn(req.session.user?.id as number)
        var alert: Alert[] = [];
        if (result && signedIn) {
            dbClient.signIn(req.session.user?.id as number)
            alert.push({type: 'success', message: 'success'})
        }
        else if (!result) {
            alert.push({type: 'danger', message: 'try again'})
        }
        else if (!signedIn) {
            alert.push({type: 'warning', message: 'already signed in today'})
        }
        else {
            alert.push({type: 'danger', message: 'try again'})
        }
        res.json({ alert })
    });
    return router;
}