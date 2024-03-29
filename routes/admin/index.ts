import express, { Request, Response } from 'express';
import NodeCache from 'node-cache';
import { DbClient } from '../../db/dbClient';
import { authCheckMiddleware, rollCheckMiddleware } from '../../middleware/auth';
import courses from './courses';
import users from './users';
import posts from './posts';
import assignments from './assignments';
import announcements from './announcements';
import groups from './groups';
import assessments from './assessments';

export default function (myCache: NodeCache, dbClient: DbClient) {
    const router = express.Router()

    router.use(authCheckMiddleware, rollCheckMiddleware(['admin']))

    router.use('/posts', posts(dbClient));

    router.use('/courses', courses(dbClient));

    router.use('/users', users(dbClient));

    router.use('/assignments', assignments(dbClient));

    router.use('/announcements', announcements(dbClient));

    router.use('/assessments', assessments(dbClient));

    router.use('/groups', groups(dbClient));

    router.get('/', (req: Request, res: Response) => {
        res.render('admin/index')
    });

    router.get('/code/', async (req: Request, res: Response) => {
        const userId = req.session.user?.id as number

        const courses = await dbClient.getCourses()
        const globalSettings = await dbClient.getGlobalSettings(userId);

        res.render('admin/code', { 
            courses,
            codeRefreshRate: globalSettings.codeRefreshRate,
            codeTimeStart: globalSettings.codeTimeStart,
            codeTimeWindow: globalSettings.codeTimeWindow
        })
    });

    router.get('/code/update', (req: Request, res: Response) => {
        
        const value: number = myCache.has('code') ? myCache.take('code') as number : 0;
        const oldNumber: number = value % 10;
        var newNumber: number = Math.floor(Math.random() * 9) + 1;
        while (newNumber == oldNumber) {
            newNumber = Math.floor(Math.random() * 9) + 1;
        }
        const codeRefreshRate = parseInt(req.query.refresh as string)
        myCache.set('code', (value * 10 + newNumber) % 100000, codeRefreshRate / 1000 + 0.5);
        res.json({ code: newNumber })
    });

    return router;
}