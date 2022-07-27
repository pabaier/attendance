import { DbClient } from './dbClient';
import pgp from 'pg-promise'
import { Course, User } from '../models';
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
  getLatestSignIn(userId: number): Promise<number | null> {
    return this.connection.one("SELECT user_id FROM attendance WHERE user_id = $1 and date_created > current_date", userId)
    .then((data: number | null) => {
      return data;
    })
    .catch((error: any) => {
      return null
    })
  }

  async getUsers(group?: string | null): Promise<User[] | null> {
    var query = 'select u.id, u.email, u.first_name, u.last_name, u.roles, u.groups from users u'
    if (group) {
      query = 'select u.id, u.email, u.first_name, u.last_name, u.roles, u.groups from user_group ug inner join users u on u.id = ug.user_id'
      query = query + ' where ug.group_name = $1';
    }
    return this.connection.any(query, [group])
      .then((data: User[]) => {
        return data
      })
      .catch((error: any) => {
        console.log('ERROR:', error);
        return [];
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

  async getCourses(): Promise<Course[]> {
    var query = 'SELECT * FROM courses'

    return this.connection.any(query)
      .then((data: Course[]) => {
        return data
      })
      .catch((error: any) => {
        console.log('ERROR:', error);
        return [];
      });
  }

  addCourse(course: Course) {
    return this.connection.none(
        'INSERT INTO courses(course_number, semester, course_year, start_time, end_time) VALUES(${course_number}, ${semester}, ${course_year}, ${start_time}, ${end_time})', course
    )
    .then((data: any) => {
      return true;
    })
    .catch((error: any) => {
      console.log('ERROR:', error);
      return false;
    });
  }

  deleteCourse(courseId: number) {
    return this.connection.none('DELETE FROM courses WHERE id = $1', courseId)
    .then((data: any) => { return true;})
    .catch((error: any) => {
      console.log('ERROR:', error);
      return false;
    });
  };
}

export default new DbClientPSQLImpl();