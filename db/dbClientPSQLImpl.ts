import { DbClient } from './dbClient';
import pgp from 'pg-promise'
import { User } from '../models';
import { user } from '../routes';


class DbClientPSQLImpl implements DbClient {
  connection: any;

  constructor() {
    const baseURL = process.env.BASEURL;
    const databaseURL: string = process.env.DATABASE_URL as string;
    const db = pgp()(
      {
        connectionString: databaseURL,
        ssl: baseURL?.includes('localhost') ? false : { rejectUnauthorized: false }
      }
    )
    this.connection = db;
  }

  async getUsers(group?: string | null): Promise<User[] | null> {
    var query = 'SELECT * FROM users'
    var grouping = '';
    if (group) {
      query = query + ' WHERE groups LIKE $1';
      grouping = `%"${group}"%`;
    }
    return this.connection.any(query, [grouping])
    .then((data: User[]) => {
      return data.map((user: User) => {
        user.roles = user.roles? JSON.parse(user.roles as string) : '';
        user.groups = user.groups? JSON.parse(user.groups as string) : '';
        return user;
      });
    })
    .catch((error: any) => {
      console.log('ERROR:', error);
      return null;
    })
  }

  signIn(userId: number) {
    return this.connection.none('INSERT INTO attendance (user_id) VALUES ($1)', [userId])
      .then((data: any) => { return true; })
      .catch((error: any) => {
        console.log('ERROR:', error);
        return false;
      });
  }

  async getUser(userEmail: string): Promise<User | null> {
    return this.connection.one('SELECT * FROM users WHERE email = $1', userEmail)
      .then((data: User) => {
        data.roles = data.roles? JSON.parse(data.roles as string) : '';
        data.groups = data.groups? JSON.parse(data.groups as string) : '';
        return data;
      })
      .catch((error: any) => {
        console.log('ERROR:', error);
        return null;
      });
  }
}

export default new DbClientPSQLImpl();