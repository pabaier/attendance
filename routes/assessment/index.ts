import express, { NextFunction, Request, Response } from 'express';
import NodeCache from 'node-cache';
import questions  from './1';
import { DbClient } from '../../db/dbClient';
import { assessmentAccessMiddleware, authCheckMiddleware } from '../../middleware/auth';
import { AssessmentQuestion, AssessmentSettings, Question, User, UserAssessment, UserQuestion, UserSettings } from '../../models';
import { renderFile } from '../../views/helper';

export default function (myCache: NodeCache, dbClient: DbClient) {
    const router = express.Router();

    router.use(authCheckMiddleware);

    router.get('/', async (req: Request, res: Response) => {
        var assessmentId = parseInt(req.query.id as string);
        res.render('assessment/wrapper', { assessmentId })
    })

    router.get('/:assessmentId', async (req: Request, res: Response) => {
        const assessmentId = parseInt(req.params.assessmentId)
        const user = req.session.user as User;
        const userGroups: number[] = user.groups as number[]
        const userId: number = user.id as number

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
        const assessment: (AssessmentSettings & {name: string, groupName: string}) = filteredAssessments.reduce((acc: any, current: any) => {
            var accDiff = acc ? acc.endTime - acc.startTime : null;
            var currDiff = current.endTime - current.startTime;
            return accDiff ? (currDiff > accDiff ? current : acc) : current;
        }, null)

        // check if the assessment was submitted first
        var userAssessment: UserAssessment = await dbClient.getUserAssessment(userId, assessmentId);
        if (userAssessment && userAssessment.end) {
            var page = renderFile('./views/assessment/unauthorized.ejs', { title: 'Complete', message: `Assessment submitted ${userAssessment.end.toLocaleString()}`});
            res.status(403).send({ message: 'unauthorized', page });
            return
        }

        // then return unauthorized if no assessments are eligible based on user groups and time
        if (!assessment) {
            var page = renderFile('./views/assessment/unauthorized.ejs', {title: 'Unauthorized', message: 'access forbidden'});
            req.session.userSettings = {
                ...req.session.userSettings as UserSettings,
                assessment: {
                    id: undefined,
                    verified: false,
                    expires: undefined,
                }
            }
            res.status(403).send({ message: 'unauthorized', page });
            return
        }

        // assessment is active and user has access, so create the access record if it doesn't exist
        if (!userAssessment) {
            userAssessment = {userId, assessmentId, start: new Date() }
            await dbClient.createUserAssessment( userAssessment )
        }

        const questions: (AssessmentQuestion & Question)[] = await dbClient.getAssessmentQuestions(assessment.assessmentId);
        req.session.userSettings = {
            ...req.session.userSettings as UserSettings,
            assessment: {
                id: assessment.assessmentId,
                verified: true,
                expires: assessment.endTime,
            }
        }

        const end = req.session.userSettings?.assessment?.expires ?? undefined
        var page = renderFile('./views/assessment/authorized.ejs', { assessment, questions });
        res.status(200).send({ message: 'correct!', page, now, end });
    });

    router.post('/:assessmentId/submit', async (req: Request, res: Response) => {
        const userId: number = req.session.user?.id as number;
        const assessmentId = parseInt(req.params.assessmentId);

        const userAssessment = await dbClient.getUserAssessment(userId, assessmentId);

        if (!userAssessment) {
            res.status(400).send({ message: 'cannot submit assessment before starting it' });
            return;
        }

        var assessmentVerificationData = req.session.userSettings?.assessment;
        if (!assessmentVerificationData || 
            !(assessmentVerificationData.id == assessmentId) || 
            !assessmentVerificationData.verified
        ) {
            res.status(403).send({ message: 'forbidden' });
        }

        var outcome = await dbClient.updateUserAssessment( {
            ...userAssessment,
            end: new Date()
        })

        if (outcome) {
            res.status(200).send({message: 'submission received!' });
        } else {
            res.status(400).send({message: 'error saving submission' });
        }
    });

    router.get('/:assessmentId/:questionId', assessmentAccessMiddleware, async (req: Request, res: Response) => {
        const userId: number = req.session.user?.id as number;
        const questionId = parseInt(req.params.questionId);
        const assessmentId = parseInt(req.params.assessmentId);

        var userQuestion: UserQuestion;
        const assessmentQuestion: AssessmentQuestion & Question = (await dbClient.getAssessmentQuestions(assessmentId, questionId))[0];
        userQuestion = await dbClient.getUserQuestion(assessmentId, questionId, userId)

        var vars: any[];
        var ans: string;
        
        // question data loaded from file
        var allQuestionData: any = {...questions};
        var questionData = allQuestionData[`q${questionId}`];
        
        if (userQuestion) {
            vars = JSON.parse(userQuestion.variables);
            ans = userQuestion.questionAnswer
        } else {
            vars = questionData.vars()
            ans = questionData.ans(vars);
            userQuestion = {
                assessmentId,
                questionId,
                userId,
                variables: JSON.stringify(vars),
                questionAnswer: ans,
                attempts: 0,
            };
            await dbClient.createUserQuestion(userQuestion)
        }

        var text = questionData.text;
        vars.forEach((v: any, i: number) => {
            text = text.replaceAll(`{${i + 1}}`, v.toString())
        });

        var correct = ans == userQuestion.userAnswer;

        const now = new Date();
        const end = req.session.userSettings?.assessment?.expires ?? undefined

        var page = renderFile('./views/assessment/question.ejs', { vars, text, ans, correct, questionAttempts: assessmentQuestion.attempts, title: assessmentQuestion.title, userQuestion });
        res.status(200).send({message: 'correct!', page });
        // res.render('assessment/wrapper', { page, now, end })
    });

    router.post('/:assessmentId/:questionId/answer', assessmentAccessMiddleware, async (req: Request, res: Response) => {
        const userId: number = req.session.user?.id as number;
        const questionId = parseInt(req.params.questionId);
        const assessmentId = parseInt(req.params.assessmentId);
        const answer = req.body.answer;

        const userQuestion = await dbClient.getUserQuestion(assessmentId, questionId, userId)
        const assessmentQuestion: AssessmentQuestion & Question = (await dbClient.getAssessmentQuestions(assessmentId, questionId))[0];

        const userAttempts = userQuestion.attempts + 1;
        const allowedAttempts = assessmentQuestion.attempts;
        const goodAttemtps = allowedAttempts ? userAttempts <= allowedAttempts : true; // undefined attempts means unlimitted

        if (!goodAttemtps) {
            res.status(400).send({message: 'checks exceeded. you can no longer check your answer.', disable: true});
            return;
        }

        const newUserQuestion: UserQuestion = {
            ...userQuestion,
            userAnswer: answer,
            attempts: userAttempts
        };

        await dbClient.updateUserQuestion(newUserQuestion);

        const correct = answer === userQuestion.questionAnswer
        if (correct) {
            res.status(200).send({message: 'correct!', correct: true });
        } else {
            res.status(200).send({message: 'incorrect', correct: false });
        }
    });

    router.post('/:assessmentId/:questionId/code', assessmentAccessMiddleware, async (req: Request, res: Response) => {
        const userId: number = req.session.user?.id as number;
        const questionId = parseInt(req.params.questionId);
        const assessmentId = parseInt(req.params.assessmentId);
        const code = req.body.code;

        const userQuestion = await dbClient.getUserQuestion(assessmentId, questionId, userId)

        const newUserQuestion: UserQuestion = {
            ...userQuestion,
            code
        };

        var result = await dbClient.updateUserQuestion(newUserQuestion);

        result ? res.status(200).send({message: 'submission received' }) : 
                 res.status(500).send({message: 'error saving submission' });
    });

    return router;
}