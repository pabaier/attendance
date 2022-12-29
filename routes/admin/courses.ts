import express, { Request, Response } from 'express';
import { DbClient } from '../../db/dbClient';
import { renderFile } from '../../views/helper';
import { Course, User } from '../../models';
import { makeCourseName, getPresentAbsentDates } from '../helpers';

export default function (dbClient: DbClient) {
    const router = express.Router()

    router.get('/', async (req: Request, res: Response) => {
        const courses: Course[] = await dbClient.getCourses(req.session.userSettings?.semesterId);
        const coursesBig = courses.map(course => {
            return renderFile('./views/admin/partials/course-section.ejs', { course })
        })

        res.render('admin/courses', { courses: coursesBig, semesterId: req.session.userSettings?.semesterId });
    });

    router.post('/add', async (req: Request, res: Response) => {
        if (Object.keys(req.body).length == 0) {
            if (!req.session.alert)
                req.session.alert = [{type: 'success', message: 'success'}]
            else
                req.session.alert.push({type: 'success', message: 'success'})

            res.redirect('/admin/courses')
            return
        }

        const courseNumber = req.body.number;
        const semesterId = parseInt(req.body.semesterId);
        const startTime = req.body.startTime;
        const endTime = req.body.endTime;

        const semester = (await dbClient.getSemesters(semesterId))[0];
        const groupName = `${semester.year}-${semester.season}-${courseNumber}-${startTime}`;
        const groupId = await dbClient.createGroup(groupName);

        var courseName;
        if(req.body.name)
            courseName = req.body.name;
        else
            courseName = groupName

        const course: Course = {
            courseNumber,
            courseName,
            semesterId,
            startTime,
            endTime,
            groupId
        }

        const r = await dbClient.createCourse(course)

        res.redirect('/admin/courses')
    })

    router.get('/:courseId', async (req: Request, res: Response) => {
        const courseId = parseInt(req.params.courseId)
        const course = await dbClient.getCourse(courseId);
        const users = await dbClient.getUsers([course.groupId]);
        const courseDates = await dbClient.getCourseDates(courseId);
        const userWithAbsences = [];
        const today = new Date()
        const courseDatesUpToToday = courseDates.filter(date => date < today)
        for (const user of users as User[]) {
            const signInDates = await dbClient.getUserSignInDates(user.id as number, courseId);
            const pAndADates = getPresentAbsentDates(signInDates, courseDatesUpToToday)
            userWithAbsences.push({...user, absences: pAndADates.absent.length})
        } 

        const usersList = renderFile('./views/admin/partials/users-list.ejs', { users: userWithAbsences })

        res.render('admin/course', { courseId, courseName: makeCourseName(course), usersList });
    })

    router.delete('/:courseId', async (req: Request, res: Response) => {
        const courseId = parseInt(req.params.courseId)
        const course = await dbClient.getCourse(courseId);
        const groupDel = await dbClient.deleteGroup(course.groupId);
        const result: boolean = await dbClient.deleteCourse(courseId)

        res.send('ok')
    })

    router.post('/:courseId/signin', async (req: Request, res: Response) => {
        const courseId: number = parseInt(req.params.courseId);
        const userIds: number[] = req.body.userIds;
        const alreadySignedInToday: User[] = await dbClient.getTodaySignIns(courseId);
        const usersToSignIn = userIds.reduce((acc: {user_id: number, course_id: number}[], currentId: number) => {
            if (!alreadySignedInToday.some(user => user.id == currentId)) {
                acc.push({user_id: currentId, course_id: courseId });
            }
            return acc;
        }, []) 

        // TODO: check users are in the course

        const outcome = await dbClient.signInUsers(usersToSignIn);
        if (outcome)
            return res.send('ok')
        else
            return res.send('fail') // this should be a 500
    })

    router.get('/:courseId/signedin', async (req: Request, res: Response) => {
        const courseId: number = parseInt(req.params.courseId);
        const users: User[] = await dbClient.getTodaySignIns(courseId);
        res.json(users);
    });

    return router;
}