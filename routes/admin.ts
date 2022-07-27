import express, { Request, Response } from 'express';
import NodeCache from 'node-cache';
import { DbClient } from '../db/dbClient';
import { authCheckMiddleware, rollCheckMiddleware } from '../middleware/auth';
import { renderFile } from '../views/helper';
import { User, Course } from '../models';

export default function (myCache: NodeCache, dbClient: DbClient) {
    const router = express.Router()

    const codeRefreshRate: number = parseInt(process.env.CODE_REFRESH_RATE || '2');

    router.use(authCheckMiddleware, rollCheckMiddleware(['admin']))

    router.get('/', (req: Request, res: Response) => {
        res.render('admin/index', { user: req.session.user })
    });

    router.get('/code/', (req: Request, res: Response) => {
        res.render('admin/code', { user: req.session.user })
    });

    router.get('/code/update', (req: Request, res: Response) => {
        var minutes: number = 0;
        if (myCache.has('time')) {
            minutes  = myCache.take('time') as number;
        }
        else {
            minutes = new Date().getMinutes();
            myCache.set('time', minutes, 59)
        }
        
        if (minutes < 29 || minutes > 35) {
            res.json({ code: null })
            return
        }
        else {
            const value: number = myCache.has('code') ? myCache.take('code') as number : 0;
            const oldNumber: number = value % 10;
            var newNumber: number = Math.floor(Math.random() * 9) + 1;
            while (newNumber == oldNumber) {
                newNumber = Math.floor(Math.random() * 9) + 1;
            }
            myCache.set('code', (value * 10 + newNumber) % 100000, codeRefreshRate / 1000 + 0.5);
            res.json({ code: newNumber })
        }
    });

    router.get('/users', async (req: Request, res: Response) => {
        const group = req.query.group ? req.query.group as string : '';
        const users = await dbClient.getUsers(group);
        const usersBig = users?.map(user => {
            var htmlResult = renderFile('./views/admin/partials/user-section.ejs', { user })
            return {
                ...user,
                html: htmlResult,
            }
        })
        res.render('admin/users', { user: req.session.user, users: JSON.stringify(usersBig), alert: req.session.alert });
    });

    router.post('/user/:userId/signin', (req: Request, res: Response) => {
        const out = dbClient.signIn(parseInt(req.params.userId))
        res.send(out)
    })

    router.post('/users/add', async (req: Request, res: Response) => {
        if (Object.keys(req.body).length == 0) {
            if (!req.session.alert)
                req.session.alert = [{type: 'success', message: 'success'}]
            else
                req.session.alert.push({type: 'success', message: 'success'})

            res.redirect('/admin/users')
            return
        }
        const rawBody: string = req.body.text;
        const rawUsers: string[] = rawBody.split('\n');
        const users: User[] = rawUsers.map((rawUser) => {
            const line: string[] = rawUser.split(',')
            return {
                email: line[0].trim(),
                first_name: line[1].trim(),
                last_name: line[2].trim(),
                roles: line[3].trim().replaceAll('\'', '"'),
                groups: line[4].trim().replaceAll('\'', '"'),
            }
        });
        await dbClient.addUsers(users);

        res.redirect('/admin/users')
    })

    router.get('/user/:userId', async (req: Request, res: Response) => {
        const user: User | null= await dbClient.getUser(parseInt(req.params.userId))
        const section: string[] = (user?.groups as string[]).filter(x => x.indexOf('section') !== -1)
        res.render('admin/user', {user: req.session.user, profile: user, section: section[0]})
    })

    router.delete('/user/:userId', async (req: Request, res: Response) => {
        const user: User | null= await dbClient.getUser(parseInt(req.params.userId))
        const section: string[] = (user?.groups as string[]).filter(x => x.indexOf('section') !== -1)
        const result: boolean= await dbClient.deleteUser(parseInt(req.params.userId))
        res.send('ok')
        // res.render('admin/users', {user: req.session.user, section: section[0]})
    })

    router.get('/courses', async (req: Request, res: Response) => {
        const courses = await dbClient.getCourses();
        const coursesBig = courses.map(course => {
            return renderFile('./views/admin/partials/course-section.ejs', { course })
        })

        // {action: form action, fields: [{id: field id, placeholder, }], }
        const action = "/admin/courses/add";
        const fieldNames = ['number', 'semester', 'year', 'startTime', 'endTime']
        const fields = fieldNames.map(name => {
            return {id: name, placeholder: name}
        })
        const addCoursesForm = renderFile('./views/partials/input-form.ejs', {action, fields});
        res.render('admin/courses', { user: req.session.user, courses: coursesBig, addForm: addCoursesForm });
    });

    router.post('/courses/add', async (req: Request, res: Response) => {
        if (Object.keys(req.body).length == 0) {
            if (!req.session.alert)
                req.session.alert = [{type: 'success', message: 'success'}]
            else
                req.session.alert.push({type: 'success', message: 'success'})

            res.redirect('/admin/courses')
            return
        }
        const course: Course = {
            course_number: parseInt(req.body.number),
            semester: req.body.semester,
            course_year: parseInt(req.body.year),
            start_time: req.body.startTime,
            end_time: req.body.endTime
        }

        const r = dbClient.addCourse(course)

        res.redirect('/admin/courses')
    })

    router.delete('/courses/:courseId', (req: Request, res: Response) => {
        console.log('delete', req.params.courseId)
        const result: boolean= dbClient.deleteCourse(parseInt(req.params.courseId))
        res.send('ok')
    })

    return router;
}