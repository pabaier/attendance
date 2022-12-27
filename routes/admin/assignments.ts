import express, { Request, Response } from 'express';
import { DbClient } from '../../db/dbClient';
import { AssignmentGroup, Post } from '../../models';
import { renderFile } from '../../views/helper';
import { makeUTCDateString } from '../helpers';

export default function (dbClient: DbClient) {
    const router = express.Router()

    router.get('/', async (req: Request, res: Response) => {
        var groups = await dbClient.getGroups();
        var posts = await dbClient.getAllPosts();
        const groupsDropdown = renderFile('./views/admin/partials/group-select-dropdown.ejs', { groups, selected: 0, id: 0 });
        const postsDropdown = renderFile('./views/admin/partials/post-select-dropdown.ejs', { posts, selected: 0, id: 0 });
        const ags = await dbClient.getAssignmentGroups();

        const assignmentGroups = ags.map((ag: AssignmentGroup) => { 
            return {
                ...ag,
                openTime: makeUTCDateString(ag.openTime as Date),
                closeTime: makeUTCDateString(ag.closeTime as Date),
                activeStartTime: makeUTCDateString(ag.activeStartTime as Date),
                activeEndTime: makeUTCDateString(ag.activeEndTime as Date)
            }
          });

        res.render('admin/assignments', { groupsDropdown, postsDropdown, assignmentGroups, groups, posts });
    });

    router.post('/', async (req: Request, res: Response) => {
        var groupId = parseInt(req.body.groupId);
        var postId = parseInt(req.body.postId);
        var open = req.body.open ? new Date(req.body.open) : undefined;
        var close = req.body.close ? new Date(req.body.close) : undefined;
        var start = req.body.start ? new Date(req.body.start) : undefined;
        var end = req.body.end ? new Date(req.body.end) : undefined;
        var assignmentGroup: AssignmentGroup = {
            postId,
            groupId,
            openTime: open,
            closeTime: close,
            activeStartTime: start,
            activeEndTime: end
        }
        var dbres = await dbClient.createAssignmentGroup(assignmentGroup);
        dbres ? res.sendStatus(200) : res.sendStatus(400);
    });

    router.delete('/', async (req: Request, res: Response) => {
        var groupId = parseInt(req.body.groupId);
        var postId = parseInt(req.body.postId);
        var result = await dbClient.deleteAssignment(groupId, postId);
        result ? res.sendStatus(200): res.sendStatus(400);
    });

    router.put('/', async (req: Request, res: Response) => {
        var groupId = parseInt(req.body.groupId);
        var postId = parseInt(req.body.postId);
        var open = req.body.open ? new Date(req.body.open) : undefined;
        var close = req.body.close ? new Date(req.body.close) : undefined;
        var start = req.body.start ? new Date(req.body.start) : undefined;
        var end = req.body.end ? new Date(req.body.end) : undefined;
        var newGroupId = parseInt(req.body.newGroupId);
        var newPostId = parseInt(req.body.newPostId);
        var assignmentGroup: AssignmentGroup = {
            postId: newPostId,
            groupId: newGroupId,
            openTime: open,
            closeTime: close,
            activeStartTime: start,
            activeEndTime: end
        }
        var result = await dbClient.updateAssignmentGroup({groupId, postId}, assignmentGroup);
        result ? res.sendStatus(200): res.sendStatus(400);
    });

    return router;
}