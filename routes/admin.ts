import express, { Request, Response } from 'express';
import NodeCache from 'node-cache';
import { DbClient } from '../db/dbClient';
import { authCheckMiddleware, rollCheckMiddleware } from '../middleware/auth';
var ejs = require('ejs');

export default function (myCache: NodeCache, dbClient: DbClient) {
    const router = express.Router()

    const codeRefreshRate: number = parseInt(process.env.CODE_REFRESH_RATE || '2');

    router.use(authCheckMiddleware, rollCheckMiddleware(['admin']))

    router.get('/', (req: Request, res: Response) => {
        res.render('admin/index', { user: req.session.user })
    });

    router.get('/code/', (req: Request, res: Response) => {
        res.render('admin/code', { user: req.session.user })
    });

    router.get('/code/update', (req: Request, res: Response) => {
        const value: number = myCache.has('code') ? myCache.take('code') as number : 0;
        const oldNumber: number = value % 10;
        var newNumber: number = Math.floor(Math.random() * 9) + 1;
        while (newNumber == oldNumber) {
            newNumber = Math.floor(Math.random() * 9) + 1;
        }
        myCache.set('code', (value * 10 + newNumber) % 100000, codeRefreshRate / 1000 + 500);
        res.json({ code: newNumber })
    });

    router.get('/users', async (req: Request, res: Response) => {
        const group = req.query.group ? req.query.group as string : '';
        const users = await dbClient.getUsers(group);
        const usersBig = users?.map(user => {
            var htmlResult = ''
            ejs.renderFile('./views/admin/partials/user-section.ejs', {user}, function (err: any, html: any) {
                htmlResult = html;
            })
            return {
                ...user,
                html: htmlResult,
            }
        })
        res.render('admin/users', { user: req.session.user, users: JSON.stringify(usersBig) });
    });

    router.post('/user/:userId/signin', (req: Request, res: Response) => {
        const out = dbClient.signIn(parseInt(req.params.userId))
        res.send(out)
    })

    return router;
}