import express, { Request, Response } from 'express';
import NodeCache from 'node-cache';
import { DbClient } from '../db/dbClient';
import { authCheckMiddleware, rollCheckMiddleware } from '../middleware/auth';
import { renderFile } from '../views/helper';
import { User, Course, UserGroups } from '../models';
import { getCourseName } from './helpers';

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
        const usersSections = users?.map(user => {
            return renderFile('./views/admin/partials/user-section.ejs', { user, type: 'Delete' })
        })
        const courses = await dbClient.getCourses();
        const courseNames = courses.map(course => getCourseName(course))

        // {action: form action, fields: [{id: field id, placeholder, }], }
        const action = "/admin/users/add";
        const fieldNames = ['email', 'firstName', 'lastName', 'roles', 'groups']
        const fields = fieldNames.map(name => {
            return {id: name, placeholder: name}
        })
        const addUserForm = renderFile('./views/partials/input-form.ejs', {action, fields});


        res.render('admin/users', { user: req.session.user, users: usersSections, courses: courseNames, addForm: addUserForm, alert: req.session.alert });
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
        // bulk request has text field
        var users: User[];
        if (req.body.text) {
            const rawBody: string = req.body.text;
            const rawUsers: string[] = rawBody.split('\n');
            users = rawUsers.map((rawUser) => {
                const line: string[] = rawUser.split('|')
                return {
                    email: line[0].trim(),
                    first_name: line[1].trim(),
                    last_name: line[2].trim(),
                    roles: line[3].trim(),
                    groups: line[4].trim(),
                }
            });
        } else {
            users = [
                {
                    email: req.body.email.trim(),
                    first_name: req.body.firstName.trim(),
                    last_name: req.body.lastName.trim(),
                    roles: req.body.roles.trim(),
                    groups: req.body.groups.trim()
                }
            ];
        }

        // users.roles and users.groups should now be a string of comma separated values ex: "group1,group2,group3"
        // create object of {userEmail: groups list}
        const emailGroups: {[key: string]: string[] } = {}
        users.filter(user => user.groups).forEach(user => {
            const groups: string[] = (user.groups as string).replaceAll(' ', '').split(',');
            emailGroups[user.email] = groups
        })

        // add users to db
        const newUsers: User[] = await dbClient.addUsers(users);

        // map new user ids to groups by email address
        const userGroups: UserGroups[] = newUsers
        .map(user => {
            const groups: string[] = emailGroups[user.email];
            return {id: user.id as number, groups}
        })

        // add user groups to db
        await dbClient.addUsersToGroups(userGroups);

        res.redirect('/admin/users')
    })

    router.get('/user/:userId', async (req: Request, res: Response) => {
        const user: User | null= await dbClient.getUser(parseInt(req.params.userId))
        res.render('admin/user', {user: req.session.user, profile: user})
    })

    router.delete('/user/:userId', async (req: Request, res: Response) => {
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

    router.get('/courses/:group', async (req: Request, res: Response) => {
        const groupName = req.params.group
        const users = await dbClient.getUsers(groupName);
        const usersSections = users?.map(user => {
            return renderFile('./views/admin/partials/user-section.ejs', { user, type: 'Remove' })
        })
        res.render('admin/course', { user: req.session.user, course: groupName, users: usersSections, alert: req.session.alert });
    })

    router.post('/courses/:group/users', async (req: Request, res: Response) => {
        const groupName: string = req.params.group;
        const userIds: number[] = req.body.userIds;
        const userGroups: UserGroups[] = userIds.map(uId => {
            return {id: uId, groups: [groupName]}
        })
        const outcome = await dbClient.addUsersToGroups(userGroups);
        if (outcome)
            return res.send('ok')
        else
            return res.send('fail') // this should be a 500
    })

    router.delete('/courses/:courseId', (req: Request, res: Response) => {
        const result: boolean= dbClient.deleteCourse(parseInt(req.params.courseId))
        res.send('ok')
    })

    router.delete('/courses/:groupName/:userId', (req: Request, res: Response) => {
        const result: boolean= dbClient.deleteUserFromGroup(req.params.groupName, parseInt(req.params.userId))
        res.send('ok')
    })

    return router;
}