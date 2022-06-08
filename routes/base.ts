import express, { Request, Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import { DbClient } from '../db/dbClient';

export default function (dbClient: DbClient) {
    const router = express.Router();
    const clientId = process.env.CLIENTID;
    const baseURL = process.env.BASEURL;

    // GOOGLE AUTH
    const client = new OAuth2Client(clientId);

    router.get('/', (req: Request, res: Response) => {
        res.render('index', { title: 'Attendance', user: req.session.user })

        // res.send('Express + TypeScript Server');
    });

    router.get('/about', (req: Request, res: Response) => {
        res.render('about', { user: req.session.user })
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
        const message = req.query.message ? req.query.message : ''
        res.render('login', { clientId, baseURL, redirect: req.query.redirect, user: req.session.user, message: message })
    });

    router.get('/logout', (req: Request, res: Response) => {
        req.session.destroy(() => null);
        const redirect = req.query.message ? `/login?message=${req.query.message}` : '/login';
        res.redirect(redirect)
    });
    
    return router;
}