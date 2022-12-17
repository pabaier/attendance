import express, { Request, Response } from 'express';
import NodeCache from 'node-cache';
import { authCheckMiddleware } from '../middleware/auth';
import { DbClient } from '../db/dbClient';
import User from '../models/User';

export default function (myCache: NodeCache, dbClient: DbClient) {
    const router = express.Router();

    router.use(authCheckMiddleware);

    router.get('/', async (req: Request, res: Response) => {
        const user: User = req.session.user as User;
        res.render('settings/index.ejs', { user })
    });

    return router;
}