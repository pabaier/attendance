import express, { Request, Response } from 'express';
import NodeCache from 'node-cache';
import { DbClient } from '../../db/dbClient';
import { authCheckMiddleware, rollCheckMiddleware } from '../../middleware/auth';
import courses from './courses';
import users from './users';
import dates from './dates';
import { makeCourseName } from '../helpers';
import { Assignment } from '../../models';

export default function (myCache: NodeCache, dbClient: DbClient) {
    const router = express.Router()

    const codeRefreshRate: number = parseInt(process.env.CODE_REFRESH_RATE || '2');

    router.use(authCheckMiddleware, rollCheckMiddleware(['admin']))

    router.use('/dates', dates(dbClient));

    router.use('/courses', courses(dbClient));

    router.use('/users', users(dbClient));

    router.get('/assignments', async (req: Request, res: Response) => {
        const courses = await dbClient.getCourses();
        const courseNameId = courses.map(course => { return {name: makeCourseName(course), id: course.id}})
        res.render('admin/assignments.ejs', { courses: courseNameId });
    });

    router.post('/assignments', async (req: Request, res: Response) => {
        const courseIds: string[] = req.body.courses;
        const assignments: Assignment[] = req.body.assignments.map((assignmentString: string) => {
            const fieldStrings = assignmentString.split(',');
            return {
                title: fieldStrings[0].trim(),
                start_time: new Date(fieldStrings[1].trim()+'Z'),
                end_time: new Date(fieldStrings[2].trim()+'Z'),
                url_link: fieldStrings[3].trim()
            }
        });
        var assignmentIds: {id: number}[] = await dbClient.addAssignments(assignments)
        var assignmentCourseIds: {assignment_id: number, course_id: number}[] = [];
        courseIds.forEach((courseId: string) => {
            assignmentIds.forEach(async (assignment: { id: number }) => {
                assignmentCourseIds.push({assignment_id: assignment.id, course_id: parseInt(courseId)})
            })
        })
        await dbClient.addAssignmentToCourse(assignmentCourseIds)
        res.send('ok')
    });

    router.get('/', (req: Request, res: Response) => {
        res.render('admin/index')
    });

    router.get('/code/', async (req: Request, res: Response) => {
        const courses = await dbClient.getCourses()
        res.render('admin/code', { courses })
    });

    router.get('/code/update', (req: Request, res: Response) => {
        // var minutes: number = 0;
        // if (myCache.has('time')) {
        //     minutes  = myCache.take('time') as number;
        // }
        // else {
        //     minutes = new Date().getMinutes();
        //     myCache.set('time', minutes, 59)
        // }
        
        // if (minutes < 29 || minutes > 35) {
        //     res.json({ code: null })
        //     return
        // }
        // else {
            const value: number = myCache.has('code') ? myCache.take('code') as number : 0;
            const oldNumber: number = value % 10;
            var newNumber: number = Math.floor(Math.random() * 9) + 1;
            while (newNumber == oldNumber) {
                newNumber = Math.floor(Math.random() * 9) + 1;
            }
            myCache.set('code', (value * 10 + newNumber) % 100000, codeRefreshRate / 1000 + 0.5);
            res.json({ code: newNumber })
        // }
    });

    return router;
}