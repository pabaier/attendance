import express, { Request, Response } from 'express';
import { DbClient } from '../../db/dbClient';
import { renderFile } from '../../views/helper';
import { CalendarEvent, Course, Group, User, UserGroups } from '../../models';
import { calendarEventColors, makeCourseName, getPresentAbsentDates, makePresentAbsentCalendarDates } from '../helpers';
import crypto from 'crypto';

export default function (dbClient: DbClient) {
    const router = express.Router()

    router.get('/groups', async (req: Request, res: Response) => {
        var groups: Group[] = await dbClient.getGroups();

        res.render('admin/groups', { groups });
    });

    router.get('/utils', async (req: Request, res: Response) => {
        res.render('admin/utils');
    });

    router.post('/groups', async (req: Request, res: Response) => {
        const groupName = req.body.groupName;
        await dbClient.createGroup(groupName);
        res.sendStatus(200)
    });

    router.delete('/groups/:groupId', async (req: Request, res: Response) => {
        const groupId = parseInt(req.params.groupId);
        await dbClient.deleteGroup(groupId);
        res.sendStatus(200)
    });

    router.get('/', async (req: Request, res: Response) => {
        const groupQuery = req.query.groupId
        var users = [];
        var selected = 0;
        if (groupQuery) {
            const groupId = parseInt(groupQuery as string)
            var selected = groupId;
            users = await dbClient.getUsers([groupId]);

        } else {
            const semesterId = req.session.userSettings?.semesterId;
            const courses = await dbClient.getCourses(semesterId);
            var groupIds: number[] = courses.map(course => course.groupId);
            users = await dbClient.getUsers(groupIds);
        }

        const usersList = renderFile('./views/admin/partials/users-list.ejs', { users })

        var groups = await dbClient.getGroups();
        groups = groups.map(group => {
            if(group.id == selected) {
                return {...group, selected: true}
            } else {
                return {...group}
            }
        })

        res.render('admin/users', { usersList, userCount: users.length, groups });
    });

    router.post('/bulkadd', async (req: Request, res: Response) => {
        const groupId = parseInt(req.body.groupId);
        const semesterId = req.session.userSettings?.semesterId as number

        var emails = req.body.emails as string
        var emailList = emails.replaceAll(' ', '').split('\n').map(z=>z.split(',')).flat()

        // 'email', 'roles', 'salt', 'password_hash'
        var users = emailList.map(email => {
            const {password, salt} = createPasswordHash(email);
            return {
                email,
                roles: 'student',
                salt,
                password,
            }
        });
        var ids = await dbClient.createUsers(users);
        var userGroups: UserGroups[] = ids.map(userId => {
            return {
                userId,
                groupIds: [groupId]
            }
        });
        await dbClient.addUsersToGroups(userGroups);

        var userSettings = ids.map(userId => {
            return {
                userId,
                semesterId
            }
        })
        await dbClient.updateUserSettings(userSettings);
        res.sendStatus(200);
    })

    router.get('/:userId', async (req: Request, res: Response) => {
        const userId: number = parseInt(req.params.userId)
        const user: User | null= await dbClient.getUser(userId)
        const userGroups: Group[] = await dbClient.getGroups(userId)
        const allGroups: Group[] = await dbClient.getGroups();
        const courseIds = await dbClient.getCourseIds(user?.id as number)
        if(!courseIds.length) {
            res.render('admin/user', {profile: {...user, groups: userGroups}, allGroups, calendar: undefined, attendance: []})
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
        res.render('admin/user', {profile: {...user, groups: userGroups}, allGroups, calendar, attendance})
    })

    router.put('/:userId', async (req: Request, res: Response) => {
        const user: User = {
            id: parseInt(req.params.userId),
            email: req.params.email,
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            roles: req.body.roles.replaceAll(' ', '').split(','),
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

    router.get('/:userId/password', async (req: Request, res: Response) => {
        const userId: number = parseInt(req.params.userId)
        res.render('admin/user-password', { userId })
    })

    router.post('/:userId/password', async (req: Request, res: Response) => {
        res.setHeader('Content-Type', 'application/json');
        const userId: number = parseInt(req.params.userId)
        const newPassword = req.body.password;

        const {password, salt} = createPasswordHash(newPassword);

        const result = await dbClient.updateUserPassword(userId, password, salt);
        if (result) {
            res.status(200).send({status: 200, message: 'success!', redirect: `/admin/users/${userId}`});
        } else {
            return res.status(500).send({
                status: 500,
                message: 'unable to save new password. please try again or contact the administrator'
            });
        }
    });

    const createPasswordHash = (newPassword: string, previousSalt?: string) => {
        var salt: Buffer;
        var saltHash: string;

        // create salt
        if (previousSalt) {
            salt = Buffer.from(previousSalt, 'base64');
            saltHash = previousSalt;
        } else {
            salt = crypto.randomBytes(16);            
            saltHash = salt.toString('base64');
        }

        // create password
        const newPasswordBuffer: Buffer = crypto.pbkdf2Sync(newPassword, salt, 310000, 32, 'sha256')

        // hash salt and password
        const newPasswordHash = newPasswordBuffer.toString('base64');

        return {password: newPasswordHash, salt: saltHash}
    }

    return router;
}