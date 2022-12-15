import express, { Request, Response } from 'express';
import NodeCache from 'node-cache';
import { authCheckMiddleware } from '../middleware/auth';
import { DbClient } from '../db/dbClient';

export default function (myCache: NodeCache, dbClient: DbClient) {
    const router = express.Router();

    router.use(authCheckMiddleware);

    router.get('/', async (req: Request, res: Response) => {
        res.render('settings/index.ejs')
    });

    return router;
}