import express, { Request, Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import { UserInfo } from '../models';
import { DbClient } from '../db/dbClient';

export default function (dbClient: DbClient) {
    const router = express.Router();
    const clientId = process.env.CLIENTID;
    const baseURL = process.env.BASEURL;

    // GOOGLE AUTH
    const client = new OAuth2Client(clientId);

    router.get('/', (req: Request, res: Response) => {
        res.render('index', { title: 'Attendance', userInfo: req.session.userInfo })

        // res.send('Express + TypeScript Server');
    });

    router.get('/about', (req: Request, res: Response) => {
        res.render('about', { userInfo: req.session.userInfo })
    });

    router.post('/login/verify', async (req: Request, res: Response) => {
        const ticket = await client.verifyIdToken({
            idToken: req.body.credential,
            audience: clientId,
        });
        const payload = ticket.getPayload() || null;
        if (!req.session.userInfo) {
            req.session.userInfo = new UserInfo();
        }
        if (payload) {
            const email = payload['email'] || ''
            req.session.userInfo.userName = payload['given_name'] || '';
            req.session.userInfo.userEmail = email;
            if (payload['email'] == 'baierpa@cofc.edu' || payload['email'] == 'baierpa@cofc.edu')
                req.session.userInfo.roles.push('admin')
            const userid = payload['sub'];
            const lastName = payload['family_name'];
            const fullName = payload['name'];
            const domain = payload['hd'];
            const userId = await dbClient.getUserId(email);
            if (!userId) {
                const message = 'Sorry, user not found. Contact your administrator.'
                res.redirect(`/logout?message=${message}`)
                return
            }
            req.session.userInfo.userId = userId;
        }
        const redirect: string = req.query.redirect?.toString() || '/'
        res.redirect(redirect)
    });

    router.get('/login', (req: Request, res: Response) => {
        const message = req.query.message ? req.query.message : ''
        res.render('login', { clientId, baseURL, redirect: req.query.redirect, userInfo: req.session.userInfo, message: message })
    });

    router.get('/logout', (req: Request, res: Response) => {
        req.session.destroy(() => null);
        const redirect = req.query.message ? `/login?message=${req.query.message}` : '/login';
        res.redirect(redirect)
    });
    
    return router;
}