import express, { NextFunction, Request, Response } from 'express';
import NodeCache from 'node-cache';
import questions  from './1';
import { DbClient } from '../../db/dbClient';
import { authCheckMiddleware } from '../../middleware/auth';
import { AssessmentQuestion, AssessmentSettings, Question } from '../../models';
import { renderFile } from '../../views/helper';

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
        res.render('assessment/question', { vars, text, ans });
    });

    router.get('/:assessmentId', async (req: Request, res: Response) => {
        var assessmentId = parseInt(req.params.assessmentId)
        const userId: number = req.session.user?.id as number;
        const userGroups: number[] = req.session.user?.groups as number[]

        const assessments: (AssessmentSettings & {name: string, groupName: string})[] = await dbClient.getAssessmentSettings(assessmentId)
        const now = new Date();
        // filter assessments by 1. time window (start <= now <= end) 2. groupId (make sure user is in group)
        const filteredAssessments = assessments.filter(assessment => {
            var st = assessment.startTime ?? now;
            var et = assessment.endTime ?? now;
            return st <= now && et >= now
        }).filter(assessment => userGroups.includes(assessment.groupId))
        
        // if user has multiple tests open for multiple groups, choose the one that is open the longest 
        // (biggest diff between start and end time)
        const assessment: (AssessmentSettings & {groupName: string}) = filteredAssessments.reduce((acc: any, current: any) => {
            var accDiff = acc ? acc.endTime - acc.startTime : null;
            var currDiff = current.endTime - current.startTime;
            return accDiff ? (currDiff > accDiff ? current : acc) : current;
        }, null)

        if (!assessment) {
            res.render('assessment/unauthorized', {});
            return
        }

        const questions: (AssessmentQuestion & Question)[] = await dbClient.getAssessmentQuestions(assessment.assessmentId);
        res.render('assessment/authorized', { assessment, questions });
    });

    return router;
}