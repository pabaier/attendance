import express, { NextFunction, Request, Response } from 'express';
import NodeCache from 'node-cache';
import { authCheckMiddleware, resourceAccessMiddleware, rollCheckMiddleware } from '../middleware/auth';
import { DbClient } from '../db/dbClient';
import { Alert, Course, Group, Post, PostGroup, Semester, User, UserSettings } from '../models';
import { signIn } from './helpers';
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

        if (isAdmin) {
            settings = await dbClient.getUserSettings(req.session.user?.id as number)
            semesters = await dbClient.getSemesters();
            semestersDropdown = renderFile('./views/partials/semester-select-dropdown.ejs', { semesters, selected: settings.semesterId, id: 0 });

        }
        var user: User = await dbClient.getUser(userId) as User;
        res.render('user/settings', { user, isAdmin, semestersDropdown })
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

    router.use((req: Request, res: Response) => {
    })
    return router;
}