import { Request, Response, NextFunction } from 'express';

export const authCheckMiddleware = (req: Request, res: Response, next: NextFunction) => {
    if (req.session.userInfo) {
        next()
    }
    else {
        res.redirect(`/login?redirect=${req.route.path}`)
    }
};

export const rollCheckMiddleware = (roles: string[]) => {
    return function (req: Request, res: Response, next: NextFunction) {
        if (req.session.userInfo?.roles.some(role => roles.includes(role)   ))
            next()
        else {
            res.redirect('/logout')
        }
    }
};