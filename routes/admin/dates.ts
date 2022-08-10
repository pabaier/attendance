import express, { Request, Response } from 'express';
import { DbClient } from '../../db/dbClient';
import { CourseDate } from '../../models';
import { makeCourseName } from '../helpers';
import dbClientPSQLImpl from '../../db/dbClientPSQLImpl';

export default function (dbClient: DbClient) {
    const router = express.Router()

    router.get('/', async (req: Request, res: Response) => {
        const courses = await dbClientPSQLImpl.getCourses();
        const courseNameId = courses.map(course => { return {name: makeCourseName(course), id: course.id}})
        res.render('admin/dates', { user: req.session.user, courses: courseNameId });
    });

    router.post('/', async (req: Request, res: Response) => {
        const courseIds: string[] = req.body.courses;
        const dates: string[] = req.body.dates;
        var courseDates: CourseDate[] = [];
        courseIds.forEach((id: string) => {
            dates.forEach((date: string) => {
                const d: CourseDate = {
                    course_id: parseInt(id),
                    meeting: new Date(`${date} EST`)
                }
                courseDates.push(d);
            })
        })
        await dbClientPSQLImpl.setCourseDates(courseDates);
        res.send('ok')
    });

    return router;
}