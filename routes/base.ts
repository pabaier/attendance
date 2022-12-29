import express, { NextFunction, Request, Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import { DbClient } from '../db/dbClient';
import { Alert, Assignment, CalendarEvent, Course, CourseDate, Post, PostGroup, User } from '../models';
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
        const semesterId = req.session.userSettings?.semesterId as number;
        const courses = await dbClient.getUserCourses(userId, semesterId);
        var calendarEvents: CalendarEvent[] = []
        
        // get dates
        const courseDates: {[courseId: number] : Date[]} = {}
        const courseNumber: {[courseId: number] : string} = {}

        for (const course of courses) {
            const courseId = course.id as number;
            courseNumber[courseId] = course.courseNumber;
            courseDates[courseId] = (await dbClient.getCourseDates(courseId))
        }

        // build calendar events
        // course dates
        courses.reduce((acc, course, index) => {
            const id = course.id as number;
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
        const groups = await dbClient.getGroups(userId);
        var userAssignments: (Post & PostGroup)[] = []
        for (const group of groups) {
            var fullPosts = await dbClient.getFullPosts([group.id as number], [2]);
            userAssignments = [...userAssignments, ...fullPosts];
        }

        var colorIndex = 0;
        const userAssignmentsEvents: CalendarEvent[] = userAssignments.map((courseAssignment) => {
            const singleDayAssignment = new Date(courseAssignment.openTime as Date).setHours(0,0,0,0) == new Date(courseAssignment.closeTime as Date).setHours(0,0,0,0)
            // choose a different assignment color only for multiday assignments
            if (!singleDayAssignment) {
                colorIndex += 1;
            }

            const today = new Date();
            var isActive = false;
            if (courseAssignment.activeStartTime && courseAssignment.activeEndTime) 
                isActive = courseAssignment.activeStartTime < today && courseAssignment.activeEndTime > today;
            else if (courseAssignment.activeStartTime)
                isActive = true;

            return {
                    title: courseAssignment.title as string,
                    start: courseAssignment.openTime?.toISOString(),
                    end: courseAssignment.closeTime?.toISOString(),
                    color: calendarEventColors[0].assignment[colorIndex%2],
                    url: isActive ? courseAssignment.link : undefined
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
        const redirect = req.query.redirect?.toString() || '/'
        res.redirect(307, 'auth/login?redirect=' + redirect);
    });

    router.get('/logout', (req: Request, res: Response) => {
        req.session.destroy(() => null);
        const redirect = req.query.message ? `/login?message=${req.query.message}` : '/login';
        res.redirect(redirect)
    });
    
    return router;
}