import { Request, Response, NextFunction } from 'express';

export const authCheckMiddleware = (req: Request, res: Response, next: NextFunction) => {
    if (req.session.isAuthed) {
        next()
    }
    else {
        res.redirect(`/login?redirect=${req.route.path}`)
    }
};

export const rollCheckMiddleware = (role: string) => {
    return function (req: Request, res: Response, next: NextFunction) {
        console.log('rolled!', role)
        next()
    }
};