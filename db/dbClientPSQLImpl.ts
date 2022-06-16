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
          user.roles = user.roles ? JSON.parse(user.roles as string) : '';
          user.groups = user.groups ? JSON.parse(user.groups as string) : '';
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
  async getUser(user: string | number): Promise<User | null> {
    const userOption: string = typeof(user) == 'string' ? 'email' : 'id';
    return this.connection.one(`SELECT * FROM users WHERE ${userOption} = $1`, user)
      .then((data: User) => {
        data.roles = data.roles ? JSON.parse(data.roles as string) : '';
        data.groups = data.groups ? JSON.parse(data.groups as string) : '';
        return data;
      })
      .catch((error: any) => {
        console.log('ERROR:', error);
        return null;
      });
  }

  addUsers(users: User[]) {
    return this.connection.tx((t: any) => {
      const queries = users.map(u => {
        return t.none('INSERT INTO users(email, first_name, last_name, roles, groups) VALUES(${email}, ${first_name}, ${last_name}, ${roles}, ${groups})', u);
      });
      return t.batch(queries);
    })
    .then((data: any) => {
      return null;
    })
    .catch((error: any) => {
      console.log('ERROR:', error);
      return null;
    });
  }

  deleteUser(userId: number) {
    return this.connection.none('DELETE FROM users WHERE id = $1', userId)
    .then((data: any) => { return true;})
    .catch((error: any) => {
      console.log('ERROR:', error);
      return false;
    });
  };

}

export default new DbClientPSQLImpl();