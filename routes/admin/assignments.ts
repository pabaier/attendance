import express, { Request, Response } from 'express';
import { DbClient } from '../../db/dbClient';
import { AssignmentGroup, Post } from '../../models';
import { renderFile } from '../../views/helper';

export default function (dbClient: DbClient) {
    const router = express.Router()

    router.get('/', async (req: Request, res: Response) => {
        var groups = await dbClient.getGroups();
        var posts = await dbClient.getAllPosts();
        const groupsDropdown = renderFile('./views/admin/partials/group-select-dropdown.ejs', { groups });
        const postsDropdown = renderFile('./views/admin/partials/post-select-dropdown.ejs', { posts });
        res.render('admin/assignments', { groupsDropdown, postsDropdown });
    });

    router.post('/', async (req: Request, res: Response) => {
        var groupId = parseInt(req.body.groupId);
        var postId = parseInt(req.body.postId);
        var open = new Date(req.body.open);
        var close = new Date(req.body.close);
        var start = new Date(req.body.start);
        var end = new Date(req.body.end);
        var assignmentGroup: AssignmentGroup = {
            postId,
            groupId,
            openTime: open,
            closeTime: close,
            activeStartTime: start,
            activeEndTime: end
        }
        // console.log(assignmentGroup);
        var dbres = await dbClient.createAssignmentGroup(assignmentGroup);
        res.sendStatus(200)
    });

    router.put('/:postId', async (req: Request, res: Response) => {
        const postId = parseInt(req.params.postId);
        const title = req.body.title;
        const body = req.body.body;
        const link = req.body.link;
        var result = await dbClient.updatePost({id: postId, title, body, link});
        result ? res.sendStatus(200): res.sendStatus(400);
    });

    router.delete('/:postId', async (req: Request, res: Response) => {
        const postId = parseInt(req.params.postId);
        var result = await dbClient.deletePost(postId);
        result ? res.sendStatus(200): res.sendStatus(400);
    });

    return router;
}