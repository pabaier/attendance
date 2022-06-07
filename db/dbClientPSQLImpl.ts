import { DbClient } from './dbClient';
export class DbClientPSQLImpl implements DbClient {
    connection: any;
   
    constructor(connection: any) {
      this.connection = connection;
    }
   
    signIn(userName: string) {
        return this.connection.none('INSERT INTO attendance (user_id) VALUES ($1)', [userName])
        .then((data: any) => {return true;})
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
      .catch((error: any) =>{
        console.log('ERROR:', error);
        return null;
      });
    }
  }