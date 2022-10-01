import express, { NextFunction, Request, Response } from 'express';
import NodeCache from 'node-cache';
import { authCheckMiddleware, rollCheckMiddleware } from '../middleware/auth';
import { DbClient } from '../db/dbClient';
import { Test, TestUserData, UserQuestionGrade } from '../models';
import { renderFile } from '../views/helper';

export default function (myCache: NodeCache, dbClient: DbClient) {
    const router = express.Router();

    router.use(authCheckMiddleware, rollCheckMiddleware(['admin', 'assistant']));

    router.get('/', async (req: Request, res: Response) => {
        const tests: Test[] = await dbClient.getTests()
        res.render('grading/index.ejs', { tests })
    });

    router.post('/', async (req: Request, res: Response) => {
        const userId = parseInt(req.body.userId);
        const questionId = parseInt(req.body.questionId);
        const grade = req.body.grade ? parseFloat(req.body.grade) : undefined;
        const result: boolean = await dbClient.setUserQuestionGrade({userId, questionId, grade})
        res.send('OK')
    });

    router.get('/questions', async (req: Request, res: Response) => {
        const groupId = parseInt(req.query.groupId as string)
        const testDate = new Date(req.query.date as string)
        const testUserData: TestUserData[] = await dbClient.getTestUserData(groupId, testDate);
        const data = renderFile('./views/grading/partials/test.ejs', { testUserData });
        res.send(data)
    });

    router.post('/calculate', async (req: Request, res: Response) => {
        const groupId = parseInt(req.body.groupId as string)
        const testDate = new Date(req.body.date as string)
        const testUserData: TestUserData[] = await dbClient.getTestUserData(groupId, testDate);
        var results: {[key: number]: Array<TestUserData>} = {}
        var userDataByUser = testUserData.reduce((prev, curr) => {
            if(!prev[curr.userId]) prev[curr.userId] = [];
            prev[curr.userId].push(curr);
            return prev;
        }, results)

        for (const [userId, gradeList] of Object.entries(userDataByUser)) {
            var finalGrade = 0
            gradeList.forEach((userData: TestUserData) => {
                finalGrade += userData.grade * userData.questionWeight / 100;
            })
            dbClient.setUserTestGrade(finalGrade, parseInt(userId), testDate);
        }
        res.send('ok')
    });

    return router;
}