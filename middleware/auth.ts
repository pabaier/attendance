import { Request, Response, NextFunction } from 'express';

export const authCheckMiddleware = (req: Request, res: Response, next: NextFunction) => {
    if (req.session.user) {
        next()
    }
    else {
        res.redirect(`/auth/login?redirect=${req.originalUrl}`)
    }
};

export const rollCheckMiddleware = (roles: string[]) => {
    return function (req: Request, res: Response, next: NextFunction) {
        if ((<string[]>req.session.user?.roles)?.some(role => roles.includes(role)))
            next()
        else {
            res.redirect('/auth/logout')
        }
    }
};