import express, { NextFunction, Request, Response } from 'express';
import NodeCache from 'node-cache';
import { authCheckMiddleware, resourceAccessMiddleware, rollCheckMiddleware } from '../middleware/auth';
import { DbClient } from '../db/dbClient';
import { Alert, Assessment, AssessmentQuestion, AssessmentSettings, Course, Group, Post, PostGroup, Question, Semester, User, UserAssessment, UserQuestion, UserSettings } from '../models';
import { getQuestionFromLibrary, signIn } from './helpers';
import { renderFile } from '../views/helper';

export default function (myCache: NodeCache, dbClient: DbClient) {
    const router = express.Router();

    router.use(authCheckMiddleware);

    router.get('/attendance', async (req: Request, res: Response, next: NextFunction) => {
        const userId = req.session.user?.id as number
        const courseIds: number[] = await dbClient.getCourseIds(userId);

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

    router.get('/announcements', async (req: Request, res: Response) => {
        const userGroupIds = req.session.user?.groups as number[];
        var announcements: (Post & PostGroup)[] = await dbClient.getFullPosts(userGroupIds, [1]);
        var pinnedAnnouncements: (Post & PostGroup)[] = await dbClient.getFullPosts(userGroupIds, [3]);
        announcements = filterPosts(announcements);
        pinnedAnnouncements = filterPosts(pinnedAnnouncements);
        res.render('user/posts', { pinnedAnnouncements, announcements })
    });

    router.get('/grades', async (req: Request, res: Response) => {
        const userId = req.session.user?.id as number;
        const userAssessments: {assessmentId: number, graded: boolean}[] = await dbClient.getUserAssessmentIds(userId);
        var assessments = [];
        var index = 0
        for (const userAssessment of userAssessments) {
            var assessment: Assessment = (await dbClient.getAssessments(userAssessment.assessmentId))[0];
            var dups = userAssessments.some((x, i) => {return x.assessmentId == userAssessment.assessmentId && !userAssessment.graded && index != i});
            index ++;
            if (dups) {
                continue;
            }
            assessments.push({...assessment, ...userAssessment})
        }
        res.render('user/grades/index', { assessments })
    });

    router.get('/grades/:assessmentId', async (req: Request, res: Response) => {
        const userId = req.session.user?.id as number;
        const userGroups = await dbClient.getGroups(userId);
        const assessmentId = parseInt(req.params.assessmentId)
        
        // check if the user is part of a graded group
        var assessmentSettings: (AssessmentSettings & {name: string, groupName: string, description: string})[] = (await dbClient.getAssessmentSettings(assessmentId));
        if (!assessmentSettings.some( assessment => { return assessment.graded && userGroups.some( group => group.id as number === assessment.groupId)})) {
            res.redirect('/auth/logout')
            return;
        }
        const assessment: Assessment = (await dbClient.getAssessments(assessmentId))[0]

        var userAssessment: UserAssessment = await dbClient.getUserAssessment(userId, assessmentId);
        const questions: (AssessmentQuestion & Question)[] = await dbClient.getAssessmentQuestions(assessmentId);
        var userQuestions = []
        for (const question of questions) {
            const questionId = question.questionId as number;
            var userQuestion: UserQuestion = await dbClient.getUserQuestion(assessmentId, questionId, userId)
            var questionDetails: {vars: any, ans: any, text: any} = getQuestionFromLibrary(questionId, userQuestion?.variables );
            
            if (!userQuestion) {
                userQuestion = {
                    assessmentId,
                    questionId,
                    userId,
                    variables: JSON.stringify(questionDetails.vars),
                    questionAnswer: questionDetails.ans,
                    userAnswer: '',
                    attempts: 0,
                };
            }
            userQuestions.push({...userQuestion, title: question.title, text: questionDetails.text});
        }
        res.render('user/grades/grades', { userAssessment: { ...userAssessment, name: assessment.name }, userQuestions })
    });

    const filterPosts = (posts : (Post & PostGroup)[]) : (Post & PostGroup)[] => {
        const today = new Date();
        return posts.filter(post => post.openTime ? post.openTime < today : false).map(post => {
            if ((post.activeStartTime && post.activeStartTime > today) || (post.activeEndTime && post.activeEndTime < today)) {
                post.link = ''
            }
            return post
        });
    }

    router.post('/attendance', async (req: Request, res: Response) => {
        const result = parseInt(req.body.code) == myCache.get('code') as number
        const ip: string = `${req.socket.remoteAddress}|${req.socket.remotePort}`
        const userId = req.session.user?.id as number
        const courseId = parseInt(req.body.courseId);
        var success = false;

        var alert: Alert[] = [];
        if (result) {
            var signInResult = await signIn(dbClient, userId, courseId, ip);
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

    router.get('/:userId/settings', resourceAccessMiddleware, async (req: Request, res: Response) => {
        const userId = parseInt(req.params.userId)
        const isAdmin = (<string[]>req.session.user?.roles)?.some(role => role == 'admin')
        let settings: UserSettings;
        let semesters: Semester[];
        let semestersDropdown;
        let globalSettings;

        if (isAdmin) {
            settings = await dbClient.getUserSettings(req.session.user?.id as number)
            globalSettings = await dbClient.getGlobalSettings(req.session.user?.id as number)
            semesters = await dbClient.getSemesters();
            semestersDropdown = renderFile('./views/partials/semester-select-dropdown.ejs', { semesters, selected: settings.semesterId, id: 0 });

        }
        var user: User = await dbClient.getUser(userId) as User;
        res.render('user/settings', { user, isAdmin, semestersDropdown, globalSettings })
    });

    router.patch('/:userId/settings', resourceAccessMiddleware, async (req: Request, res: Response) => {
        const userId = parseInt(req.params.userId)
        var user: User = await dbClient.getUser(userId) as User;

        let firstName = req.body.firstName;
        let lastName = req.body.lastName;
        const newUser = {...user, firstName, lastName}
        let response = await dbClient.updateUser(newUser)
        const isAdmin = (<string[]>req.session.user?.roles)?.some(role => role == 'admin')
        if (response) {
            if(!isAdmin)
                req.session.user = newUser;
            res.status(200).send({status: 200, message: 'success!'});
        }
        else
            res.status(500).send({status: 500, message: 'error saving user info'});
    })

    router.patch('/:userId/settings/semester', rollCheckMiddleware(['admin']), async (req: Request, res: Response) => {
        const userId = parseInt(req.params.userId)
        var user: User = await dbClient.getUser(userId) as User;

        let semesterId = parseInt(req.body.semesterId);
        let response = await dbClient.updateSemester(userId, semesterId)
        
        if (response) {
            req.session.userSettings = { ...req.session.userSettings, semesterId };
        }
        res.status(200).send({status: 200, message: 'success!'});
    })

    router.put('/:userId/settings/global', rollCheckMiddleware(['admin']), async (req: Request, res: Response) => {
        const userId = parseInt(req.params.userId)
        const codeRefreshRate = parseInt(req.body.codeRefresh);
        const codeTimeStart = parseInt(req.body.codeStart);
        const codeTimeWindow = parseInt(req.body.codeWindow);

        let response = await dbClient.updateGlobalSettings({userId, codeRefreshRate, codeTimeStart, codeTimeWindow})

        response ? res.status(200).send({message: 'global settings updated'}) : res.status(500).send({message: 'error'});
    })

    router.use((req: Request, res: Response) => {
    })
    return router;
}