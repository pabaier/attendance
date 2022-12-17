import express, { NextFunction, Request, Response } from 'express';
import NodeCache from 'node-cache';
import { authCheckMiddleware, resourceAccessMiddleware } from '../middleware/auth';
import { DbClient } from '../db/dbClient';
import { Alert, Course, Group, PostGroup, User } from '../models';
import { signIn } from './helpers';

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
        var posts: PostGroup[] = []
        const today = new Date();
        for (const id of userGroupIds) {
            const unfilteredPosts: PostGroup[] = await dbClient.getPosts(id);
            posts = posts.concat(unfilteredPosts.filter(post => post.visible).map(post => {
                post.visible = post.openTime < today;
                post.link =  post.visible ? post.link : '';
                return post
            }))
        }

        // earlier items in the list will show higher, which is what we want
        // so they need to register as "less than" (-1) during the sort
        // closed items always show lower in the list
        const p = posts.sort((a: PostGroup, b:PostGroup) => {
            const aIsEarlier = a.openTime < b.openTime;
            const aIsOpen = a.openTime < today;
            const bIsOpen = b.openTime < today;
            if (aIsOpen && bIsOpen && aIsEarlier) return 1 // b shows up earlier/higher
            if (aIsOpen && bIsOpen && !aIsEarlier) return -1 // a shows up earlier/higher
            if (aIsOpen && !bIsOpen) return -1; // a shows up earlier/higher
            if (!aIsOpen && bIsOpen) return 1; //b shows up earlier/hight
            if (!aIsOpen && !bIsOpen && aIsEarlier) return 1
            if (!aIsOpen && !bIsOpen && !aIsEarlier) return -1 
            return 0
        })
        res.render('user/posts', { posts: p })
    });

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
        var user: User = await dbClient.getUser(userId) as User;
        res.render('user/settings', { user })
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

    router.use((req: Request, res: Response) => {
    })
    return router;
}