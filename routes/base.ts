import express, { Request, Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import { DbClient } from '../db/dbClient';
import { Alert, Assignment, CalendarEvent, Course, CourseDate, User } from '../models';
import {  authCheckMiddleware, rollCheckMiddleware } from '../middleware/auth';
import session from 'express-session';
import internal from 'stream';
import { renderFile } from '../views/helper';
import { calendarEventColors } from './helpers';

export default function (dbClient: DbClient) {
    const router = express.Router();
    const clientId = process.env.CLIENTID;
    const baseURL = process.env.BASEURL;

    // GOOGLE AUTH
    const client = new OAuth2Client(clientId);

    router.get('/', authCheckMiddleware, async (req: Request, res: Response) => {
        // get courseIds
        const groups = await dbClient.getGroups(req.session.user?.id as number);
        const courseIds = groups.reduce((acc: number[], currentGroup) => {
            const groupParts = currentGroup.group_name.split('-')
            if (groupParts[0] == 'course') acc.push(parseInt(groupParts[1]))
            return acc
        }, [])
        
        var calendarEvents: CalendarEvent[] = []
        
        // get dates
        const courseDates: {[courseId: number] : Date[]} = {}
        const courseAssignments: {[courseId: number] : Assignment[]} = {}
        const courseNames: {[courseId: number] : string} = {}

        for (const id of courseIds) {
            courseDates[id] = (await dbClient.getCourseDates(id)).map(courseDate => courseDate.meeting);
            courseAssignments[id] = (await dbClient.getAssignments(id));
            courseNames[id] = (await dbClient.getCourse(id)).course_number;
        }
        // get course

        // build calendar events
        courseIds.reduce((acc, id, index) => {
            courseDates[id].forEach(courseDate => {
                acc.push(
                    {
                        title: courseNames[id].toString(),
                        start: courseDate.toISOString().split('T')[0],
                        color: calendarEventColors[index].meeting
                    }
                )
            })
            return acc
        }, calendarEvents)

        // get assignments
        for (const id of courseIds) {
        }

        // build calendar events
        courseIds.reduce((acc, id, index) => {
            courseAssignments[id].forEach((courseAssignment, i) => {
                acc.push(
                    {
                        title: courseAssignment.title,
                        start: courseAssignment.start_time.toISOString(),
                        end: courseAssignment.end_time.toISOString(),
                        color: calendarEventColors[index].assignment[i%2],
                        url: courseAssignment.start_time < new Date() ? courseAssignment.url_link : undefined
                    }
                )
            })
            return acc
        }, calendarEvents)

        const calendar = renderFile('./views/partials/calendar.ejs', {events: calendarEvents});

        res.render('base/index', { title: 'Attendance', user: req.session.user, calendar })
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
        res.render('base/login', { clientId, baseURL, redirect: req.query.redirect, user: req.session.user, alert})
    });

    router.get('/logout', (req: Request, res: Response) => {
        req.session.destroy(() => null);
        const redirect = req.query.message ? `/login?message=${req.query.message}` : '/login';
        res.redirect(redirect)
    });
    
    return router;
}