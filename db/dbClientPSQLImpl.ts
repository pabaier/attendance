import { DbClient } from './dbClient';
import pgp from 'pg-promise'


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

  signIn(userName: string) {
    return this.connection.none('INSERT INTO attendance (user_id) VALUES ($1)', [userName])
      .then((data: any) => { return true; })
      .catch((error: any) => {
        console.log('ERROR:', error);
        return false;
      });
  }

  async getUserId(userEmail: string) {
    return this.connection.one('SELECT * FROM users WHERE email = $1', userEmail)
      .then((data: any) => {
        return data.id;
      })
      .catch((error: any) => {
        console.log('ERROR:', error);
        return null;
      });
  }
}

export default new DbClientPSQLImpl();