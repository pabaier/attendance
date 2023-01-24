import express, { Request, Response } from 'express';
import { DbClient } from '../../db/dbClient';
import { Assessment, AssessmentQuestion, AssessmentSettings, Question } from '../../models';
import { renderFile } from '../../views/helper';
import { makeUTCDateString } from '../helpers';
import questions from '../../questionLibrary';

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


    router.get('/questions', async (req: Request, res: Response) => {
        const questions = await dbClient.getQuestions();
        res.render('admin/assessments/questions', { questions });
    });

    router.post('/questions', async (req: Request, res: Response) => {
        var title = req.body.title;
        var description = req.body.description;

        const questionId = await dbClient.createQuestion({ title, description });
        questionId ? res.status(200).send({message: 'success!'}) : res.status(500).send({message: 'error'});
        
    });

    router.put('/questions/:questionId', async (req: Request, res: Response) => {
        const questionId = parseInt(req.params.questionId);
        const title = req.body.title ?? undefined;
        const description = req.body.description ?? undefined;

        const success = await dbClient.updateQuestion({ id: questionId, title, description });
        success ? res.status(200).send({message: 'question updated successfully!'}) : res.status(500).send({message: 'error'});
    });

    router.delete('/questions/:questionId', async (req: Request, res: Response) => {
        var questionId = parseInt(req.params.questionId)

        const success = await dbClient.deleteQuestion(questionId);
        success ? res.status(200).send({message: `Question Deleted`}) : res.status(500).send({message: 'error'});
    });

    router.get('/preview/:questionId', async (req: Request, res: Response) => {
        var questionId = parseInt(req.params.questionId);
        var titleText = req.query.title || 'Preview';
        var title = `${questionId}-${titleText}`

        // question data loaded from file
        var allQuestionData: any = {...questions};
        var questionData = allQuestionData[`q${questionId}`];
        var vars = questionData.vars()
        var ans = questionData.ans(vars);
        var text = questionData.text;
        vars.forEach((v: any, i: number) => {
            text = text.replaceAll(`{${i + 1}}`, v.toString())
        });

        var userQuestion = {
            assessmentId: 0,
            questionId,
            userId: 0,
            variables: JSON.stringify(vars),
            questionAnswer: ans,
            attempts: 0,
        };

        var obj = {
            vars, 
            text, 
            ans, 
            correct: false, 
            questionAttempts: 0,
            title, 
            userQuestion
        }
        console.log(ans);
        res.render('assessment/question', obj);
        // res.render('admin/assessments/question-preview', { });
    })

    router.get('/:assessmentId', async (req: Request, res: Response) => {
        var assessmentId = parseInt(req.params.assessmentId)
        const assessment: Assessment = (await dbClient.getAssessments(assessmentId))[0];
        
        const testQuestions: (AssessmentQuestion & Question)[] = await dbClient.getAssessmentQuestions(assessmentId);
        const allQuestions: Question[] = await dbClient.getQuestions();
        const unusedQuestions = allQuestions.filter(q => {
            return !testQuestions.some(x => x.questionId == q.id)
        })
        const questionsDropdown = renderFile('./views/admin/partials/question-select-dropdown.ejs', { questions: unusedQuestions, selected: 0, id: 0 });


        var assessmentSettings: (AssessmentSettings & { name: string, groupName: string} )[] = await dbClient.getAssessmentSettings(assessmentId);
        var settings = assessmentSettings.map(as => {
            return {
                ...as,
                startTime: as.startTime ? makeUTCDateString(as.startTime) : undefined,
                endTime: as.endTime ? makeUTCDateString(as.endTime) : undefined,
            }
        })
        const groups = await dbClient.getGroupsNotPartOfAssessment(assessmentId)
        const groupsDropdown = renderFile('./views/admin/partials/group-select-dropdown.ejs', { groups, selected: 0, id: 0 });

        res.render('admin/assessments/assessment', { assessment, testQuestions, questionsDropdown, settings, groupsDropdown });
    });

    router.put('/:assessmentId', async (req: Request, res: Response) => {
        var assessmentId = parseInt(req.params.assessmentId)
        var name = req.body.name;
        var description = req.body.description;

        const success = await dbClient.updateAssessment({ id: assessmentId, name, description });
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


    router.post('/:assessmentId/question', async (req: Request, res: Response) => {
        var assessmentId = parseInt(req.params.assessmentId)
        var questionId = parseInt(req.body.questionId)
        var attempts = req.body.attempts ? parseInt(req.body.attempts) : undefined;
        var ordinal = parseInt(req.body.ordinal);

        const success = await dbClient.createAssessmentQuestion({assessmentId, questionId, attempts, ordinal});
        success ? res.status(200).send({message: `Assessment Question Created`}) : res.status(500).send({message: 'error'});
    });

    router.put('/:assessmentId/:questionId', async (req: Request, res: Response) => {
        var assessmentId = parseInt(req.params.assessmentId)
        var questionId = parseInt(req.params.questionId)

        var attempts = parseInt(req.body.attempts) || undefined;
        var ordinal = parseInt(req.body.ordinal);

        const success = await dbClient.updateAssessmentQuestion({ assessmentId, questionId, attempts, ordinal });
        success ? res.status(200).send({message: `Assessment Question Updated`}) : res.status(500).send({message: 'error'});
    });

    router.delete('/:assessmentId/:questionId', async (req: Request, res: Response) => {
        var assessmentId = parseInt(req.params.assessmentId)
        var questionId = parseInt(req.params.questionId)

        const success = await dbClient.deleteAssessmentQuestion(assessmentId, questionId)
        success ? res.status(200).send({message: `Assessment Deleted`}) : res.status(500).send({message: 'error'});
    });

    return router;
}