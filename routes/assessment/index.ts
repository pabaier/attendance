import express, { NextFunction, Request, Response } from 'express';
import NodeCache from 'node-cache';
import questions  from './1';
import { DbClient } from '../../db/dbClient';
import { authCheckMiddleware } from '../../middleware/auth';

export default function (myCache: NodeCache, dbClient: DbClient) {
    const router = express.Router();

    router.use(authCheckMiddleware);

    router.get('/:assessmentId/:questionId', async (req: Request, res: Response) => {
        const userId: number = req.session.user?.id as number;
        var questionId = req.params.questionId
        var assessmentId = req.params.assessmentId

        var q: any = {...questions};
        var question = q[questionId];
        const vars: any[] = question.vars()
        var text = question.text;
        vars.forEach((v, i) => {
            text = text.replaceAll(`{${i + 1}}`, v.toString())
        });
        const ans = question.ans(vars); 
        res.render('test/index', { vars, text, ans });
    });

    router.get('/:assessmentId', async (req: Request, res: Response) => {
        const userId: number = req.session.user?.id as number;
        var questionKey = req.params.questionKey
        var assessmentId = req.params.assessmentId

        var q: any = {...questions};
        var question = q[key];
        const vars: any[] = question.vars()
        var text = question.text;
        vars.forEach((v, i) => {
            text = text.replaceAll(`{${i + 1}}`, v.toString())
        });
        const ans = question.ans(vars); 
        res.render('test/index', { vars, text, ans });
    });

    return router;
}