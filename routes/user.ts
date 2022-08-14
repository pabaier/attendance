import express, { NextFunction, Request, Response } from 'express';
import NodeCache from 'node-cache';
import { authCheckMiddleware } from '../middleware/auth';
import { DbClient } from '../db/dbClient';
import { Alert, Course } from '../models';
import { getUserCourseIds } from './helpers';

export default function (myCache: NodeCache, dbClient: DbClient) {
    const router = express.Router();

    router.use(authCheckMiddleware);

    router.get('/attendance', async (req: Request, res: Response, next: NextFunction) => {
        const userGroups: string[] = await dbClient.getGroups(req.session.user?.id as number);
        const courseIds: number[] = getUserCourseIds(userGroups);
        const userId = req.session.user?.id as number

        var data: {'attendance':number, 'days':number, 'course': Course}[] = [];

        for (const id of courseIds) {
            const course: Course = await dbClient.getCourse(id);
            const totalDays = await dbClient.getTotalCourseDays(id, new Date());
            const totalSignIns = await dbClient.getTotalUserSignIns(userId, id);
            data.push({'attendance': totalSignIns, 'days': totalDays, course});
        }
        res.render('user/attendance', { user: req.session.user, data })
        next();
    });

    router.post('/attendance', async (req: Request, res: Response) => {
        const result = parseInt(req.body.code) == myCache.get('code') as number
        const userId = req.session.user?.id as number
        const courseId = parseInt(req.body.courseId);
        const signedIn = await dbClient.getTodaySignIn(userId, courseId)
        var success = false;

        var alert: Alert[] = [];
        if (result && !signedIn.length) {
            dbClient.signIn(req.session.user?.id as number, courseId)
            alert.push({type: 'success', message: 'success'})
            success = true;
        }
        else if (!result) {
            alert.push({type: 'danger', message: 'try again'})
        }
        else if (signedIn) {
            alert.push({type: 'warning', message: 'already signed in today'})
        }
        else {
            alert.push({type: 'danger', message: 'try again'})
        }
        res.json({ alert,  success })
    });

    router.use((req: Request, res: Response) => {
        console.log('OOOKKK!')
    })
    return router;
}