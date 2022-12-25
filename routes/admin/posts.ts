import express, { Request, Response } from 'express';
import { DbClient } from '../../db/dbClient';
import { Post } from '../../models';

export default function (dbClient: DbClient) {
    const router = express.Router()

    router.get('/', async (req: Request, res: Response) => {
        var posts: Post[] = await dbClient.getAllPosts();
        res.render('admin/posts', { posts });
    });

    router.post('/', async (req: Request, res: Response) => {
        const title = req.body.title;
        const body = req.body.body;
        const link = req.body.link;
        var dbres = await dbClient.createPost({title, body, link})
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