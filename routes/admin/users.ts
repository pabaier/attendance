import express, { Request, Response } from 'express';
import { DbClient } from '../../db/dbClient';
import { renderFile } from '../../views/helper';
import { User, UserGroups } from '../../models';
import { makeCourseName } from '../helpers';

export default function (dbClient: DbClient) {
    const router = express.Router()

    router.get('/', async (req: Request, res: Response) => {
        const group = req.query.group ? req.query.group as string : '';
        const users = await dbClient.getUsers(group);
        const usersSections = users?.map(user => {
            return renderFile('./views/admin/partials/user-section.ejs', { user, type: 'Delete' })
        })
        const courses = await dbClient.getCourses();

        // {action: form action, fields: [{id: field id, placeholder, }], }
        const action = "/admin/users/add";
        const fieldNames = ['email', 'firstName', 'lastName', 'roles', 'groups']
        const fields = fieldNames.map(name => {
            return {id: name, placeholder: name}
        })
        const addUserForm = renderFile('./views/partials/input-form.ejs', {action, fields});


        res.render('admin/users', { users: usersSections, courses, addForm: addUserForm, alert: req.session.alert });
    });

    router.post('/add', async (req: Request, res: Response) => {
        if (Object.keys(req.body).length == 0) {
            if (!req.session.alert)
                req.session.alert = [{type: 'success', message: 'success'}]
            else
                req.session.alert.push({type: 'success', message: 'success'})

            res.redirect('/admin/users')
            return
        }
        // bulk request has text field
        var users: User[];
        if (req.body.text) {
            const rawBody: string = req.body.text;
            const rawUsers: string[] = rawBody.split('\n');
            users = rawUsers.map((rawUser) => {
                const line: string[] = rawUser.split('|')
                return {
                    email: line[0].trim(),
                    first_name: line[1].trim(),
                    last_name: line[2].trim(),
                    roles: line[3].trim(),
                    groups: line[4].trim(),
                }
            });
        } else {
            users = [
                {
                    email: req.body.email.trim(),
                    first_name: req.body.firstName.trim(),
                    last_name: req.body.lastName.trim(),
                    roles: req.body.roles.trim(),
                    groups: req.body.groups.trim()
                }
            ];
        }

        // users.roles and users.groups should now be a string of comma separated values ex: "group1,group2,group3"
        // create object of {userEmail: groups list}
        const emailGroups: {[key: string]: string[] } = {}
        users.filter(user => user.groups).forEach(user => {
            const groups: string[] = (user.groups as string).replaceAll(' ', '').split(',');
            emailGroups[user.email] = groups
        })

        // add users to db
        const newUsers: User[] = await dbClient.addUsers(users);

        // map new user ids to groups by email address
        const userGroups: UserGroups[] = newUsers
        .map(user => {
            const groups: string[] = emailGroups[user.email];
            return {id: user.id as number, groups}
        })

        // add user groups to db
        await dbClient.addUsersToGroups(userGroups);

        res.redirect('/admin/users')
    })

    router.get('/:userId', async (req: Request, res: Response) => {
        const user: User | null= await dbClient.getUser(parseInt(req.params.userId))
        res.render('admin/user', {profile: user})
    })

    router.delete('/:userId', async (req: Request, res: Response) => {
        const result: boolean= await dbClient.deleteUser(parseInt(req.params.userId))
        res.send('ok')
        // res.render('admin/users', {section: section[0]})
    })

    return router;
}