import { DbClient } from './dbClient';
import pgp from 'pg-promise'
import { Course, User, UserGroups } from '../models';

class DbClientPSQLImpl implements DbClient {
  connection: any;
  pg: pgp.IMain;

  constructor() {
    const baseURL = process.env.BASEURL;
    const databaseURL: string = process.env.DATABASE_URL as string;
    this.pg = pgp()
    this.connection = this.pg(
      {
        connectionString: databaseURL,
        ssl: baseURL?.includes('localhost') ? false : { rejectUnauthorized: false }
      }
    )
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

  async addUsers(users: User[]): Promise<User[]> {
    const cs = new this.pg.helpers.ColumnSet(['email', 'first_name', 'last_name', 'roles', 'groups'], {table: 'users'});
    const values = users.map(u => { return {
      email: u.email, 
      first_name: u.first_name, 
      last_name: u.last_name, 
      roles: u.roles, 
      groups: u.groups
    }})
    const query = this.pg.helpers.insert(values, cs) + ' RETURNING id, email, first_name, last_name, roles, groups';
    const res: User[] = await this.connection.many(query);
    return res;
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

  async addUsersToGroups(userGroups: UserGroups[]): Promise<{}[]> {
    const cs = new this.pg.helpers.ColumnSet(['user_id', 'group_name'], {table: 'user_group'});
    var values: {}[] = []
    userGroups.forEach(user => {
      const uId = user.id
      user.groups.forEach(group => {
        values.push({user_id: uId, group_name: group})
      })
    })
    if (values.length) {
      const query = this.pg.helpers.insert(values, cs) + ' RETURNING user_id, group_name';
      const res = await this.connection.many(query);
      return res;
    } else {
      return []
    }
  }
}

export default new DbClientPSQLImpl();