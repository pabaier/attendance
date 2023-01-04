import express, { Request, Response } from 'express';
import { DbClient } from '../../db/dbClient';
import { Assessment, AssessmentQuestion, Post, PostGroup } from '../../models';
import { renderFile } from '../../views/helper';
import { makeUTCDateString } from '../helpers';

export default function (dbClient: DbClient) {

    const router = express.Router()

    router.get('/', async (req: Request, res: Response) => {
        const assessments = await dbClient.getAssessments();
        res.render('admin/assessments/assessments', { assessments });
    });

    
    router.post('/', async (req: Request, res: Response) => {
        var name = req.body.name;
        const success = await dbClient.createAssessment({ name });
        success ? res.status(200).send({message: 'success!'}) : res.status(500).send({message: 'error'});
    });

    router.get('/:assessmentId', async (req: Request, res: Response) => {
        var assessmentId = parseInt(req.params.assessmentId)
        const assessment: Assessment = (await dbClient.getAssessments(assessmentId))[0];
        const testQuestions: AssessmentQuestion[] = await dbClient.getAssessmentQuestions(assessmentId);
        const allQuestions: {id: number}[] = await dbClient.getQuestions();
        const questions = allQuestions.map(q => {
            return { id: q.id, selected: testQuestions.some(x => x.questionId == q.id) }
        })

        // get assessment settings
        var assessmentSettings = await dbClient.getAssessmentSettings(assessmentId);

        // get all questions then add multiselect to add questions to assessment
        // assign assessment to different groups

        res.render('admin/assessments/assessment', { assessment, testQuestions, questions, settings: assessmentSettings });
    });

    router.put('/:assessmentId', async (req: Request, res: Response) => {
        var assessmentId = parseInt(req.params.assessmentId)
        var name = req.body.name;
        const success = await dbClient.updateAssessment({ id: assessmentId, name });
        success ? res.status(200).send({message: `Assessment ${assessmentId} updated`}) : res.status(500).send({message: 'error'});
    });

    router.put('/:assessmentId/question', async (req: Request, res: Response) => {
        var assessmentId = parseInt(req.params.assessmentId)
        var questionId = parseInt(req.body.questionId);
        var attempts = req.body.attempts ? parseInt(req.body.attempts) : undefined;
        const success = await dbClient.updateAssessmentQuestion({assessmentId, questionId, attempts});
        success ? res.status(200).send({message: `Assessment ${assessmentId} updated`}) : res.status(500).send({message: 'error'});
    });

    router.put('/:assessmentId/questions', async (req: Request, res: Response) => {
        var assessmentId = parseInt(req.params.assessmentId)
        var questionIds = req.body.ids;
        var questions = questionIds.map((id: string) => parseInt(id))
        const success = await dbClient.setAssessmentQuestions(assessmentId, questions);
        success ? res.status(200).send({message: `Assessment ${assessmentId} updated`}) : res.status(500).send({message: 'error'});
    });
    
    router.get('/questions', async (req: Request, res: Response) => {
        const questions = await dbClient.getQuestions();
        res.render('admin/assessments/questions', { questions });
    });

    router.post('/questions', async (req: Request, res: Response) => {
        const success = await dbClient.createQuestion();
        success ? res.status(200).send({message: 'success!'}) : res.status(500).send({message: 'error'});
        
    });

    return router;
}