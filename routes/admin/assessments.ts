import express, { Request, Response } from 'express';
import { DbClient } from '../../db/dbClient';
import { Assessment, AssessmentQuestion, AssessmentSettings, Post, PostGroup } from '../../models';
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

        var assessmentSettings: (AssessmentSettings & { groupName: string} )[] = await dbClient.getAssessmentSettings(assessmentId);
        var settings = assessmentSettings.map(as => {
            return {
                ...as,
                startTime: as.startTime ? makeUTCDateString(as.startTime) : undefined,
                endTime: as.endTime ? makeUTCDateString(as.endTime) : undefined,
            }
        })
        const groups = await dbClient.getGroupsNotPartOfAssessment(assessmentId)
        const groupsDropdown = renderFile('./views/admin/partials/group-select-dropdown.ejs', { groups, selected: 0, id: 0 });

        res.render('admin/assessments/assessment', { assessment, testQuestions, questions, settings, groupsDropdown });
    });

    router.put('/:assessmentId', async (req: Request, res: Response) => {
        var assessmentId = parseInt(req.params.assessmentId)
        var name = req.body.name;
        const success = await dbClient.updateAssessment({ id: assessmentId, name });
        success ? res.status(200).send({message: `Assessment ${assessmentId} updated`}) : res.status(500).send({message: 'error'});
    });

    router.post('/:assessmentId/settings', async (req: Request, res: Response) => {
        var assessmentId = parseInt(req.params.assessmentId)
        var groupId = parseInt(req.body.groupId);
        var startTime = req.body.start ? new Date(req.body.start) : undefined;
        var endTime = req.body.end ? new Date(req.body.end) : undefined;

        const success = await dbClient.createAssessmentSettings({ assessmentId, groupId, startTime, endTime })
        success ? res.status(200).send({message: `Assessment Setting Created`}) : res.status(500).send({message: 'error'});
    });

    router.delete('/:assessmentId/settings', async (req: Request, res: Response) => {
        var assessmentId = parseInt(req.params.assessmentId)
        var groupId = parseInt(req.body.groupId);

        const success = await dbClient.deleteAssessmentSettings(assessmentId, groupId)
        success ? res.status(200).send({message: `Assessment Deleted`}) : res.status(500).send({message: 'error'});
    });

    router.put('/:assessmentId/settings', async (req: Request, res: Response) => {
        var assessmentId = parseInt(req.params.assessmentId)
        var groupId = parseInt(req.body.groupId);
        var startTime = req.body.start ? new Date(req.body.start) : undefined;
        var endTime = req.body.end ? new Date(req.body.end) : undefined;

        const success = await dbClient.updateAssessmentSettings({ assessmentId, groupId, startTime, endTime })
        success ? res.status(200).send({message: `Assessment Settings Updated`}) : res.status(500).send({message: 'error'});
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