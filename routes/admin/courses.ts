import express, { Request, Response } from 'express';
import { DbClient } from '../../db/dbClient';
import { renderFile } from '../../views/helper';
import { Course, UserGroups } from '../../models';
import { makeCourseName } from '../helpers';

export default function (dbClient: DbClient) {
    const router = express.Router({mergeParams: true})

    router.get('/', async (req: Request, res: Response) => {
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

    router.post('/add', async (req: Request, res: Response) => {
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

    router.get('/:courseId', async (req: Request, res: Response) => {
        const courseId = parseInt(req.params.courseId)
        const course = await dbClient.getCourse(courseId);
        const groupName = `course-${courseId}`
        const users = await dbClient.getUsers(groupName);
        const usersSections = users?.map(user => {
            return renderFile('./views/admin/partials/user-section.ejs', { user, type: 'Remove' })
        })
        const calendar = renderFile('./views/partials/calendar.ejs', {});
        res.render('admin/course', { user: req.session.user, courseId, courseName: makeCourseName(course), users: usersSections, calendar, alert: req.session.alert });
    })

    router.post('/:courseId/users', async (req: Request, res: Response) => {
        const courseId: number = parseInt(req.params.courseId);
        const userIds: number[] = req.body.userIds;
        const userGroups: UserGroups[] = userIds.map(uId => {
            return {id: uId, groups: [`course-${courseId}`]}
        })
        const outcome = await dbClient.addUsersToGroups(userGroups);
        if (outcome)
            return res.send('ok')
        else
            return res.send('fail') // this should be a 500
    })

    router.delete('/:courseId', (req: Request, res: Response) => {
        const result: boolean= dbClient.deleteCourse(parseInt(req.params.courseId))
        res.send('ok')
    })

    router.delete('/:courseId/:userId', (req: Request, res: Response) => {
        const groupName = `course-${req.params.courseId}`;
        const result: boolean= dbClient.deleteUserFromGroup(groupName, parseInt(req.params.userId))
        res.send('ok')
    })

    return router;
}