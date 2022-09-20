import express, { NextFunction, Request, Response } from 'express';
import NodeCache from 'node-cache';
import { authCheckMiddleware, rollCheckMiddleware } from '../middleware/auth';
import { DbClient } from '../db/dbClient';
import { Test, TestUserData } from '../models';
import { renderFile } from '../views/helper';

export default function (myCache: NodeCache, dbClient: DbClient) {
    const router = express.Router();

    router.use(authCheckMiddleware, rollCheckMiddleware(['admin', 'assistant']));

    router.get('/', async (req: Request, res: Response) => {
        const tests: Test[] = await dbClient.getTests()
        res.render('grading/index.ejs', { tests })
    });

    router.get('/questions', async (req: Request, res: Response) => {
        const groupId = parseInt(req.query.groupId as string)
        const testDate = new Date(req.query.date as string)
        const testUserData: TestUserData[] = await dbClient.getTestUserData(groupId, testDate);
        const data = renderFile('./views/grading/partials/test.ejs', { testUserData });
        res.send(data)
    });

    return router;
}