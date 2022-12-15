import express, { NextFunction, Request, Response } from 'express';
import NodeCache from 'node-cache';
import { DbClient } from '../db/dbClient';
import { User } from '../models';
import crypto from 'crypto';
import { authCheckMiddleware } from '../middleware/auth';

export default function (myCache: NodeCache, dbClient: DbClient) {
    const router = express.Router();

    router.get('/login', async (req: Request, res: Response) => {
        res.render('auth/login', {redirect: req.query.redirect?.toString() || '/'})
    })

    router.post('/login', async (req: Request, res: Response) => {
        res.setHeader('Content-Type', 'application/json');
        const email = req.body.email;
        const password = req.body.password;
        const user: User | null = await dbClient.getUser(email);
        if(!user) return res.status(400).send({ status: 400, message: 'login email or password incorrect' });

        let saltBuff = Buffer.from(user.salt as string, 'base64');
        let passBuff = Buffer.from(user.password as string, 'base64');
        var buffedSubmitPassword = crypto.pbkdf2Sync(password, saltBuff, 310000, 32, 'sha256')
        if (crypto.timingSafeEqual(passBuff, buffedSubmitPassword)) {
            req.session.user = user;
            return res.status(200).send({ status: 200, message: req.query.redirect?.toString() || '/' });
        }
        else {
            return res.status(400).send({ status: 400, message: 'login email or password incorrect' });
        }
    });

    router.get('/logout', (req: Request, res: Response) => {
        req.session.destroy(() => null);
        const redirect = req.query.message ? `/auth/login?message=${req.query.message}` : '/auth/login';
        res.redirect(redirect)
    });

    router.post('/changePassword', authCheckMiddleware, async (req: Request, res: Response) => {
        res.setHeader('Content-Type', 'application/json');
        const user: User = req.session.user as User;
        
        // form data
        const currentSubmittedPassword = req.body.password;
        const newPassword = req.body.newPassword;
        const confirmedPassword = req.body.confirmedPassword;
        
        // password confirmation different
        if (!(newPassword === confirmedPassword)) return res.status(400).send({status: 400, message: 'new passwords do not match'});
        
        // convert user's current salt and password to buffer
        const saltBuff = Buffer.from(user.salt as string, 'base64');
        const passBuff = Buffer.from(user.password as string, 'base64');
        
        // convert submitted user password to buffer
        const buffedSubmittedPassword = crypto.pbkdf2Sync(currentSubmittedPassword, saltBuff, 310000, 32, 'sha256')
        // check if passwords match
        const passMatch = crypto.timingSafeEqual(passBuff, buffedSubmittedPassword)

        // wrong password submitted by user
        if (!passMatch) return res.status(403).send({status: 403, message: 'wrong user password'});

        // create and store new password
        const buffedNewPassword = crypto.pbkdf2Sync(newPassword, saltBuff, 310000, 32, 'sha256')
        const newPass = buffedNewPassword.toString('base64');
        const result = await dbClient.updateUserPassword(user.id as number, newPass);
        if (result) {
            user.password = newPass;
        } else {
            return res.status(500).send({
                status: 500,
                message: 'unable to save new password. please try again or contact the administrator'
            });
        }
        res.status(200).send({status: 200, message: 'success!'});
    });

    return router;
}