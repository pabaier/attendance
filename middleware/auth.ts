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

export const resourceAccessMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const resourceUserId = parseInt(req.params.userId)
    const requestUserId = req.session.user?.id as number;
    const isAdmin = (<string[]>req.session.user?.roles)?.some(role => role == 'admin')
    if (isAdmin || resourceUserId === requestUserId)
        next()
    else {
        res.status(403).send({status: 403, message: 'forbidden'});
    }
};

export const assessmentAccessMiddleware = (req: Request, res: Response, next: NextFunction) => {
    
    const assessmentSlug = req.params.assessmentSlug;

    
    // verify user has access to this question based on session data
    // need matching assessment Ids, needs to be verified, expiration needs to be after now.
    // if the date is undefined (but verified), then the assessment has no end time and they can proceed.
    var assessmentVerificationData = req.session.userSettings?.assessment;
    if (!assessmentVerificationData || 
        !(assessmentVerificationData.id == assessmentSlug) || 
        !assessmentVerificationData.verified ||
        (assessmentVerificationData.expires && (new Date(assessmentVerificationData.expires) < new Date()))
    ) {
        res.status(403).send({ message: 'forbidden', verificationError: true });
    } else {
        next()
    }
};