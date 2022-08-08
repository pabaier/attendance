import express, { Request, Response } from 'express';
import NodeCache from 'node-cache';
import { DbClient } from '../../db/dbClient';
import { authCheckMiddleware, rollCheckMiddleware } from '../../middleware/auth';
import courses from './courses';
import users from './users';
import dates from './dates';

export default function (myCache: NodeCache, dbClient: DbClient) {
    const router = express.Router()

    const codeRefreshRate: number = parseInt(process.env.CODE_REFRESH_RATE || '2');

    router.use(authCheckMiddleware, rollCheckMiddleware(['admin']))

    router.use('/dates', dates(dbClient));

    router.use('/courses', courses(dbClient));

    router.use('/users', users(dbClient));

    router.get('/', (req: Request, res: Response) => {
        res.render('admin/index', { user: req.session.user })
    });

    router.get('/code/', (req: Request, res: Response) => {
        res.render('admin/code', { user: req.session.user })
    });

    router.get('/code/update', (req: Request, res: Response) => {
        var minutes: number = 0;
        if (myCache.has('time')) {
            minutes  = myCache.take('time') as number;
        }
        else {
            minutes = new Date().getMinutes();
            myCache.set('time', minutes, 59)
        }
        
        if (minutes < 29 || minutes > 35) {
            res.json({ code: null })
            return
        }
        else {
            const value: number = myCache.has('code') ? myCache.take('code') as number : 0;
            const oldNumber: number = value % 10;
            var newNumber: number = Math.floor(Math.random() * 9) + 1;
            while (newNumber == oldNumber) {
                newNumber = Math.floor(Math.random() * 9) + 1;
            }
            myCache.set('code', (value * 10 + newNumber) % 100000, codeRefreshRate / 1000 + 0.5);
            res.json({ code: newNumber })
        }
    });

    return router;
}