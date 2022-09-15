import express, { Request, Response } from 'express';
import { DbClient } from '../../db/dbClient';
import { renderFile } from '../../views/helper';
import { CalendarEvent, Course, User, UserGroups } from '../../models';
import { calendarEventColors, makeCourseName, getPresentAbsentDates, makePresentAbsentCalendarDates } from '../helpers';

export default function (dbClient: DbClient) {
    const router = express.Router()

    router.get('/', async (req: Request, res: Response) => {
        const groupString: string = req.query.group as string;
        const group = groupString ? parseInt(groupString) : null;
        const users = await dbClient.getUsers(group);
        const usersList = renderFile('./views/admin/partials/users-list.ejs', { users })
        const courses = await dbClient.getCourses();

        // {action: form action, fields: [{id: field id, placeholder, }], }
        const action = "/admin/users/add";
        const fieldNames = ['email', 'firstName', 'lastName', 'roles', 'groups']
        const fields = fieldNames.map(name => {
            return {id: name, placeholder: name}
        })
        const addUserForm = renderFile('./views/partials/input-form.ejs', {action, fields});


        res.render('admin/users', { usersList, courses, addForm: addUserForm, alert: req.session.alert });
    });

    router.post('/add', async (req: Request, res: Response) => {
        if (Object.keys(req.body).length == 0) {
            if (!req.session.alert)
                req.session.alert = [{type: 'success', message: 'success'}]
            else
                req.session.alert.push({type: 'success', message: 'success'})

            res.redirect('/admin/users')
            return
        }
        // bulk request has text field
        var users: any[];
        if (req.body.text) {
            const rawBody: string = req.body.text;
            const rawUsers: string[] = rawBody.split('\n');
            users = rawUsers.map((rawUser) => {
                const line: string[] = rawUser.split('|')
                return {
                    email: line[0].trim(),
                    firstName: line[1].trim(),
                    lastName: line[2].trim(),
                    roles: line[3].trim(),
                    groups: line[4].trim(),
                }
            });
        } else {
            users = [
                {
                    email: req.body.email.trim(),
                    firstName: req.body.firstName.trim(),
                    lastName: req.body.lastName.trim(),
                    roles: req.body.roles.trim(),
                    groups: req.body.groups.trim().split(' ').map((x: string) => parseInt(x))
                }
            ];
        }

        // users.roles and users.groups should now be a string of comma separated values ex: "group1,group2,group3"
        // create object of {userEmail: groups list}
        const emailGroups: {[key: string]: number[] } = {}
        users.filter(user => user.groups).forEach(user => {
            const groups: number[] = (user.groups as string).replaceAll(' ', '').split(',').map(x => parseInt(x));
            emailGroups[user.email] = groups
        })

        // add users to db
        const newUsers: User[] = await dbClient.addUsers(users);

        // map new user ids to groups by email address
        const userGroups: UserGroups[] = newUsers
        .map(user => {
            const groupIds: number[] = emailGroups[user.email];
            return {userId: user.id as number, groupIds}
        })

        // add user groups to db
        await dbClient.addUsersToGroups(userGroups);

        res.redirect('/admin/users')
    })

    router.get('/:userId', async (req: Request, res: Response) => {
        const user: User | null= await dbClient.getUser(parseInt(req.params.userId))
        const courseIds = await dbClient.getCourseIds(user?.id as number)
        if(!courseIds.length) {
            res.render('admin/user', {profile: user, calendar: undefined, attendance: []})
            return
        }
        var calendarEvents: CalendarEvent[] = []
        var attendance: {course: Course, absent: number}[] = [];

        for (const [index, courseId] of courseIds.entries()) {
            var course = await dbClient.getCourse(courseId);
            var courseDates: Date[] = await dbClient.getCourseDates(courseId)
            var signInDates: Date[] = await dbClient.getUserSignInDates(user?.id as number, courseId)
            const today = new Date();
            var previousCourseDates = courseDates.filter(date => date < today);
            const {present, absent} = getPresentAbsentDates(signInDates, previousCourseDates);
            const {presentCalendarEvents, absentCalendarEvents} = makePresentAbsentCalendarDates(present, absent, index)
            calendarEvents = calendarEvents.concat(presentCalendarEvents).concat(absentCalendarEvents)
            attendance.push({course, absent: absent.length})
        };

        const calendar = renderFile('./views/partials/calendar.ejs', {events: calendarEvents});

        res.render('admin/user', {profile: user, calendar, attendance})
    })

    router.put('/:userId', async (req: Request, res: Response) => {
        const user: User = {
            id: parseInt(req.params.userId),
            email: req.params.email,
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            roles: req.body.roles,
            groups: req.body.groups.map((gId: string) => parseInt(gId)),
        }
        await dbClient.updateUser(user);
        await dbClient.setUserGroups({userId: user.id as number, groupIds: user.groups })
        res.send('ok')
    })

    router.delete('/:userId', async (req: Request, res: Response) => {
        const result: boolean = await dbClient.deleteUser(parseInt(req.params.userId))
        res.send('ok')
        // res.render('admin/users', {section: section[0]})
    })

    router.get('/:userId/assume', async (req: Request, res: Response) => {
        try {
            const user: User | null = await dbClient.getUser(parseInt(req.params.userId))
            req.session.user = user as User;
            res.sendStatus(200)
        } catch {
            res.sendStatus(500)
        }
    })

    return router;
}