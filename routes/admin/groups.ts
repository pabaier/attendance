import express, { Request, Response } from 'express';
import { DbClient } from '../../db/dbClient';
import { CalendarEvent, Course, Group, User, UserGroups } from '../../models';

export default function (dbClient: DbClient) {
    const router = express.Router()

    router.get('/', async (req: Request, res: Response) => {
        var groups: Group[] = await dbClient.getGroups();

        res.render('admin/groups', { groups });
    });

    router.post('/', async (req: Request, res: Response) => {
        const groupName = req.body.groupName;
        await dbClient.createGroup(groupName);
        res.sendStatus(200)
    });

    router.delete('/:groupId', async (req: Request, res: Response) => {
        const groupId = parseInt(req.params.groupId);
        await dbClient.deleteGroup(groupId);
        res.sendStatus(200)
    });

    return router;
}