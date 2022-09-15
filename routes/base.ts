import express, { NextFunction, Request, Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import { DbClient } from '../db/dbClient';
import { Alert, Assignment, CalendarEvent, Course, CourseDate, User } from '../models';
import {  authCheckMiddleware, rollCheckMiddleware } from '../middleware/auth';
import session from 'express-session';
import { renderFile } from '../views/helper';
import { calendarEventColors } from './helpers';

export default function (dbClient: DbClient) {
    const router = express.Router();
    const clientId = process.env.CLIENTID;
    const baseURL = process.env.BASEURL;

    // GOOGLE AUTH
    const client = new OAuth2Client(clientId);

    router.get('/test', async (req: Request, res: Response) => {
        var a = await dbClient.getTodaySignIns(2)
        console.log(a)
        res.render('base/test')
    })

    router.get('/', authCheckMiddleware, async (req: Request, res: Response) => {
        // get courseIds
        const userId = req.session.user?.id as number
        const courseIds: number[] = await dbClient.getCourseIds(userId);
        var calendarEvents: CalendarEvent[] = []
        
        // get dates
        const courseDates: {[courseId: number] : Date[]} = {}
        const courseNumber: {[courseId: number] : string} = {}

        for (const id of courseIds) {
            const course: Course = await dbClient.getCourse(id);
            courseNumber[id] = course.courseNumber;
            courseDates[id] = (await dbClient.getCourseDates(id))
        }

        // build calendar events
        // course dates
        courseIds.reduce((acc, id, index) => {
            courseDates[id].forEach(date => {
                acc.push(
                    {
                        title: courseNumber[id].toString(),
                        start: date.toISOString(),
                        color: calendarEventColors[index].meeting
                    }
                )
            })
            return acc
        }, calendarEvents)

        // build calendar events
        // course assignments
        const userAssignments = (await dbClient.getUserAssignments(userId));
        var colorIndex = 0;
        const userAssignmentsEvents: CalendarEvent[] = userAssignments.map((courseAssignment) => {
            const singleDayAssignment = new Date(courseAssignment.start_time).setHours(0,0,0,0) == new Date(courseAssignment.end_time).setHours(0,0,0,0)
            // choose a different assignment color only for multiday assignments
            if (!singleDayAssignment) {
                colorIndex += 1;
            }
            return {
                    title: courseAssignment.title,
                    start: courseAssignment.start_time.toISOString(),
                    end: courseAssignment.end_time.toISOString(),
                    color: calendarEventColors[0].assignment[colorIndex%2],
                    url: courseAssignment.start_time < new Date() ? courseAssignment.url_link : undefined
                }
        })

        const calendar = renderFile('./views/partials/calendar.ejs', {events: calendarEvents.concat(userAssignmentsEvents) });

        res.render('base/index', { title: 'Attendance', calendar })
    });

    router.post('/login/verify', async (req: Request, res: Response) => {
        const ticket = await client.verifyIdToken({
            idToken: req.body.credential,
            audience: clientId,
        });
        const payload = ticket.getPayload() || null;
        if (payload) {
            const email = payload['email'] || ''
            const user = await dbClient.getUser(email);
            if (!user) {
                const message = 'Sorry, user not found. Contact your administrator.'
                res.redirect(`/logout?message=${message}`)
                return
            }
            req.session.user = user;
        }
        const redirect: string = req.query.redirect?.toString() || '/'
        res.redirect(redirect)
    });

    router.get('/login', (req: Request, res: Response) => {
        const alert: Alert[] = req.query.message ? [{type: 'danger', message: req.query.message as string}] : [];
        res.render('base/login', { clientId, baseURL, redirect: req.query.redirect, alert})
    });

    router.get('/logout', (req: Request, res: Response) => {
        req.session.destroy(() => null);
        const redirect = req.query.message ? `/login?message=${req.query.message}` : '/login';
        res.redirect(redirect)
    });
    
    return router;
}