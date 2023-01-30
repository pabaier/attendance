import express, { Request, Response } from 'express';
import { DbClient } from '../../db/dbClient';
import { renderFile } from '../../views/helper';
import { Course, CourseDate, User } from '../../models';
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
        try {
            const courseNumber = req.body.number;
            const semesterId = parseInt(req.body.semesterId);
            const startTime = req.body.startTime;
            const endTime = req.body.endTime;
            const days = req.body.days;
            const startDate = new Date(req.body.startDate);
            const endDate = new Date(req.body.endDate);

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

            const courseId = await dbClient.createCourse(course)

            const dayMap = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
            var courseDates: CourseDate[] = []

            var classDate = new Date(startDate);
            const times = startTime.split(':')
            const hours = parseInt(times[0])
            const minutes = parseInt(times[1])
            classDate.setHours(hours);
            classDate.setMinutes(minutes);
            var day = dayMap[classDate.getDay()];
            if (days.includes(day))
                courseDates.push({courseId, meeting: new Date(classDate)})

            while(classDate <= endDate ) {
                classDate = new Date(classDate);
                classDate.setDate(classDate.getDate() + 1)
                var day = dayMap[classDate.getDay()];
                if (days.includes(day))
                    courseDates.push({courseId, meeting: new Date(classDate)})
            }

            await dbClient.setCourseDates(courseDates);

            return res.status(200).send({message: 'success'});
        } catch(error) {
            return res.status(500).send({message: error});
        }
    })

    router.get('/:courseId', async (req: Request, res: Response) => {
        const courseId = parseInt(req.params.courseId)
        const course: Course = await dbClient.getCourse(courseId);
        const group = await dbClient.getGroup(course.groupId);
        const semester = await dbClient.getSemesters(course.semesterId);
        const courseDates = await dbClient.getCourseDates(courseId);

        const data = {
            courseId,
            courseName: makeCourseName(course),
            groupName: group.name,
            courseDates, course,
            semester: semester[0]
        }

        res.render('admin/course', data);
    })

    router.delete('/:courseId', async (req: Request, res: Response) => {
        const courseId = parseInt(req.params.courseId)
        const course = await dbClient.getCourse(courseId);
        await dbClient.deleteCourseDates(courseId);
        const result: boolean = await dbClient.deleteCourse(courseId)
        const groupDel = await dbClient.deleteGroup(course.groupId);

        res.send('ok')
    })

    router.delete('/:courseId/date', async (req: Request, res: Response) => {
        try {
            const courseId = parseInt(req.params.courseId)
            const date = new Date(parseInt(req.body.date));
            await dbClient.deleteCourseDate(courseId, date);

            return res.status(200).send({message: 'success'});
        } catch (error) {
            return res.status(500).send({message: error});
        }
    })

    router.post('/:courseId/date', async (req: Request, res: Response) => {
        try {
            const courseId = parseInt(req.params.courseId)
            const meeting = new Date(parseInt(req.body.date));
            const courseDate: CourseDate = { courseId, meeting }
            await dbClient.setCourseDates([courseDate]);

            return res.status(200).send({message: 'success'});
        } catch (error) {
            return res.status(500).send({message: error});
        }
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