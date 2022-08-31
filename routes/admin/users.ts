import express, { Request, Response } from 'express';
import { DbClient } from '../../db/dbClient';
import { renderFile } from '../../views/helper';
import { CalendarEvent, User, UserGroups } from '../../models';
import { calendarEventColors, getUserCourseIds, makeCourseName } from '../helpers';

export default function (dbClient: DbClient) {
    const router = express.Router()

    router.get('/', async (req: Request, res: Response) => {
        const group = req.query.group ? req.query.group as string : '';
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

    router.get('/:userId', async (req: Request, res: Response) => {
        const user: User | null= await dbClient.getUser(parseInt(req.params.userId))
        const courseIds = getUserCourseIds(user?.groups as string[])
        if(!courseIds.length) {
            res.render('admin/user', {profile: user, calendar: undefined})
            return
        }
        var calendarEvents: CalendarEvent[] = [];
        var tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1)
        var attendance: {course: string, present: number, absent: number}[] = [];

        var index = 0;
        for (const courseId of courseIds) {
            var present = 0;
            var absent = 0;
            var courseDates: Date[] = await dbClient.getCourseDates(courseId)
            var signInDates: Date[] = await dbClient.getUserSignInDates(user?.id as number, courseId)
            var course = await dbClient.getCourse(courseId);
            var courseHour = parseInt(course.start_time.split(':')[0]);
            var courseMinutes = parseInt(course.start_time.split(':')[1]);
            const signIns = signInDates.map(date => {
                date.setHours(courseHour, courseMinutes, 0, 0)
                return date.valueOf()
            })

            var events = courseDates.map(date => {
                date.setHours(courseHour)
                date.setMinutes(courseMinutes)
                var wasPresent = signIns.includes(date.valueOf());
                var beforeToday = date < tomorrow;
                if (wasPresent && beforeToday){
                    present++;
                } else if (beforeToday) { absent++ }
                var event: CalendarEvent =  {
                    title: beforeToday ? wasPresent ? 'Present' : 'Absent' : course.course_number,
                    start: date.toISOString(),
                    end: undefined,
                    url: undefined,
                    backgroundColor: beforeToday ? wasPresent ? calendarEventColors[index].present : calendarEventColors[index].absent :calendarEventColors[index].meeting,
                    textColor: undefined,
                }
                return event
             })
            
            calendarEvents = calendarEvents.concat(events)
            attendance.push({course: course.course_number, present, absent})
            index ++;
        };

        const calendar = renderFile('./views/partials/calendar.ejs', {events: calendarEvents});

        res.render('admin/user', {profile: user, calendar, attendance})
    })

    router.put('/:userId', async (req: Request, res: Response) => {
        const user: User = {
            id: parseInt(req.params.userId),
            email: req.params.email,
            first_name: req.body.firstName,
            last_name: req.body.lastName,
            roles: req.body.roles,
            groups: req.body.groups,
        }
        await dbClient.updateUser(user);
        await dbClient.setUserGroups({id: user.id as number, groups: user.groups })
        res.send('ok')
        // const user: User | null= await dbClient.getUser(parseInt(req.params.userId))
        // res.render('admin/user', {profile: user})
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