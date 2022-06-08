import { DbClient } from './dbClient';
import pgp from 'pg-promise'
import { User } from '../models';


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

  async getUsers(): Promise<User[] | null> {
    return this.connection.any('SELECT * FROM users')
    .then((data: User[]) => {
      console.log(data)
      return data;
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
        data.roles = JSON.parse(data.roles as string);
        return data;
      })
      .catch((error: any) => {
        console.log('ERROR:', error);
        return null;
      });
  }
}

export default new DbClientPSQLImpl();