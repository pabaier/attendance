import express, { NextFunction, Request, Response } from 'express';
import NodeCache from 'node-cache';
import { authCheckMiddleware } from '../middleware/auth';
import { DbClient } from '../db/dbClient';
import { Alert, Course } from '../models';
import { getUserCourseIds, signIn } from './helpers';

export default function (myCache: NodeCache, dbClient: DbClient) {
    const router = express.Router();

    router.use(authCheckMiddleware);

    router.get('/attendance', async (req: Request, res: Response, next: NextFunction) => {
        const userGroups: string[] = await dbClient.getGroups(req.session.user?.id as number);
        const courseIds: number[] = getUserCourseIds(userGroups);
        const userId = req.session.user?.id as number

        var data: {'attendance':number, 'days':number, 'course': Course}[] = [];
        var tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1)

        for (const id of courseIds) {
            const course: Course = await dbClient.getCourse(id);
            const totalDays = await dbClient.getTotalCourseDays(id, tomorrow);
            const totalSignIns = await dbClient.getTotalUserSignIns(userId, id);
            data.push({'attendance': totalSignIns, 'days': totalDays, course});
        }
        res.render('user/attendance', { data })
        next();
    });

    router.post('/attendance', async (req: Request, res: Response) => {
        const result = parseInt(req.body.code) == myCache.get('code') as number
        const userId = req.session.user?.id as number
        const courseId = parseInt(req.body.courseId);
        var success = false;

        var alert: Alert[] = [];
        if (result) {
            var signInResult = await signIn(dbClient, userId, courseId);
            if (signInResult.alreadySignedIn) {
                alert.push({type: 'warning', message: 'already signed in today'})
            } else if (signInResult.success) {
                alert.push({type: 'success', message: 'success'})
                success = true;
            } else {
                alert.push({type: 'danger', message: 'try again'})
            }
        }
        else {
            alert.push({type: 'danger', message: 'wrong code. try again'})
        }
        res.json({ alert,  success })
    });

    router.use((req: Request, res: Response) => {
    })
    return router;
}