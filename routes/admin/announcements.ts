import express, { Request, Response } from 'express';
import { DbClient } from '../../db/dbClient';
import { PostGroup, Post } from '../../models';
import { renderFile } from '../../views/helper';
import { makeUTCDateString } from '../helpers';

export default function (dbClient: DbClient) {
    const POST_TYPE_ID = 1;

    const router = express.Router()

    router.get('/', async (req: Request, res: Response) => {
        var groups = await dbClient.getGroups();
        var posts = await dbClient.getAllPosts();
        const groupsDropdown = renderFile('./views/admin/partials/group-select-dropdown.ejs', { groups, selected: 0, id: 0 });
        const postsDropdown = renderFile('./views/admin/partials/post-select-dropdown.ejs', { posts, selected: 0, id: 0 });
        const ags = await dbClient.getPostGroups(POST_TYPE_ID);

        var announcementGroups = ags.map((ag: PostGroup) => { 
            return {
                ...ag,
                openTime: makeUTCDateString(ag.openTime as Date),
                closeTime: makeUTCDateString(ag.closeTime as Date),
                activeStartTime: makeUTCDateString(ag.activeStartTime as Date),
                activeEndTime: makeUTCDateString(ag.activeEndTime as Date)
            }
        });

        res.render('admin/announcements', { groupsDropdown, postsDropdown, announcementGroups, groups, posts });
    });

    router.post('/', async (req: Request, res: Response) => {
        var groupId = parseInt(req.body.groupId);
        var postId = parseInt(req.body.postId);
        var open = req.body.open ? new Date(req.body.open) : undefined;
        var close = req.body.close ? new Date(req.body.close) : undefined;
        var start = req.body.start ? new Date(req.body.start) : undefined;
        var end = req.body.end ? new Date(req.body.end) : undefined;
        var announcementGroup: PostGroup = {
            postId,
            groupId,
            openTime: open,
            closeTime: close,
            activeStartTime: start,
            activeEndTime: end,
            postTypeId: POST_TYPE_ID
        }
        var dbres = await dbClient.createPostGroup(announcementGroup);
        dbres ? res.sendStatus(200) : res.sendStatus(400);
    });

    router.delete('/', async (req: Request, res: Response) => {
        var groupId = parseInt(req.body.groupId);
        var postId = parseInt(req.body.postId);
        var result = await dbClient.deletePostGroup(groupId, postId, POST_TYPE_ID);
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
        var assignmentGroup: PostGroup = {
            postId: newPostId,
            groupId: newGroupId,
            openTime: open,
            closeTime: close,
            activeStartTime: start,
            activeEndTime: end,
            postTypeId: POST_TYPE_ID
        }
        var result = await dbClient.updatePostGroup({groupId, postId}, assignmentGroup);
        result ? res.sendStatus(200): res.sendStatus(400);
    });

    return router;
}