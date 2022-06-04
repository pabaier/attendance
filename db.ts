export class DBClient {
    connection: any;
   
    constructor(connection: any) {
      this.connection = connection;
    }
   
    signIn(userName: string) {
        this.connection.none('INSERT INTO attendance (user_name) VALUES ($1)', [userName])
        .then((data: any) => {})
        .catch((error: any) => {
            console.log('ERROR:', error); // print error;
        });
    }
  }