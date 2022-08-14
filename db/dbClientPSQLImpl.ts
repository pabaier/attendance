import { DbClient } from './dbClient';
import pgp from 'pg-promise'
import { Assignment, Course, CourseDate, User, UserGroups } from '../models';

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
  async getTotalUserSignIns(userId: number, courseId: number): Promise<number> {
    return await this.connection.any({
      name: 'getTotalUserSignIns',
      text: 'SELECT * FROM public.attendance where user_id = $1 and course_id = $2',
      values: [userId, courseId],
      rowMode: 'array'
    }).then((data: any) => {
      return data.length;
    }).catch((error: any) => {
      console.log('ERROR:', error);
      return 0
    });
  }

  async getTotalCourseDays(courseId: number, until?: Date): Promise<number> {
    var values: (number | Date)[] = [courseId];
    var text: string = 'SELECT * FROM course_dates where course_id = $1'
    if (until) {
      values.push(until);
      text += ' and meeting <= $2'
    }
    return await this.connection.any({
      name: 'getTotalCourseDays',
      text,
      values,
      rowMode: 'array'
    }).then((data: any) => {
      return data.length;
    }).catch((error: any) => {
      console.log('ERROR:', error);
      return 0
    });
  }

  async getTodaySignIn(userId: number, courseId: number): Promise<Date[]> {
    return await this.connection.any({
      name: 'getTodaySignIn',
      text: "SELECT date_created FROM attendance where user_id = $1 and course_id = $2 and date_created > (current_date at time zone 'est')::date",
      values: [userId, courseId],
      rowMode: 'array'
    }).then((data: any) => {
      return data.flat();
    }).catch((error: any) => {
      console.log('ERROR:', error);
      return []
    }); 
  }

  async getGroups(userId: number): Promise<string[]> {
    return await this.connection.any({
      name: 'getGroups',
      text: 'SELECT group_name FROM user_group where user_id = $1',
      values: [userId],
      rowMode: 'array'
    }).then((data: any) => {
        return data.flat();
    }).catch((error: any) => {
      console.log('ERROR:', error);
      return []
    }); 
  }

  async addAssignmentToCourse(assignmentCourse: {assignment_id: number, course_id: number}[]): Promise<boolean> {
    const cs = new this.pg.helpers.ColumnSet(['assignment_id', 'course_id'], {table: 'course_assignments'});
    const query = this.pg.helpers.insert(assignmentCourse, cs);
    await this.connection.any(query);
    return true;
  }

  async addAssignments(assignments: Assignment[]): Promise<{id: number}[]> {
    const cs = new this.pg.helpers.ColumnSet(['title', 'start_time', 'end_time', 'url_link'], {table: 'assignments'});
    const query = this.pg.helpers.insert(assignments, cs) + ' RETURNING id';
    const res: {id: number}[] = await this.connection.many(query);
    return res;
  }

  updateAssignment(assignment: Assignment): Promise<boolean> {
    const a = assignment
    var query = `
      UPDATE assignments
      SET title = $1, start_time = $2, end_time = $3, url_link = $4
      WHERE id = $5;
    `
    return this.connection.none(query, [a.title, a.start_time, a.end_time, a.url_link, a.id])
    .then((data: any) => {
      return true;
    })
    .catch((error: any) => {
      return false;
    })
  }

  // (Course & Assignment)[]
  async getAssignments(courseId: number): Promise<Assignment[]> {
    var query = `
      select a.id, a.title, a.start_time, a.end_time, a.url_link
      from assignments a
      inner join course_assignments ca 
      on a.id = ca.assignment_id
      where ca.course_id = $1
      ORDER BY a.start_time`;
    
    return this.connection.any(query, [courseId])
      .then((data: Assignment[]) => {
        return data
      })
      .catch((error: any) => {
        console.log('ERROR:', error);
        return [];
      })  }

  deleteUserFromGroup(groupName: string, userId: number): boolean {
    return this.connection.none('DELETE FROM user_group WHERE user_id = $1 AND group_name = $2', [userId, groupName])
    .then((data: any) => { return true;})
    .catch((error: any) => {
      console.log('ERROR:', error);
      return false;
    });
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
    var query = 'select u.id, u.email, u.first_name, u.last_name, u.roles from users u'
    if (group) {
      query = 'select u.id, u.email, u.first_name, u.last_name, u.roles from user_group ug inner join users u on u.id = ug.user_id'
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

  async signIn(userId: number, courseId: number) {
    return this.connection.none('INSERT INTO attendance (user_id, course_id) VALUES ($1, $2)', [userId, courseId])
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
        data.roles = data.roles ? (data.roles as string).split(',') : '';
        return data;
      })
      .catch((error: any) => {
        console.log('ERROR:', error);
        return null;
      });
  }

  async addUsers(users: User[]): Promise<User[]> {
    const cs = new this.pg.helpers.ColumnSet(['email', 'first_name', 'last_name', 'roles'], {table: 'users'});
    const values = users.map(u => { return {
      email: u.email, 
      first_name: u.first_name, 
      last_name: u.last_name, 
      roles: u.roles, 
    }})
    const query = this.pg.helpers.insert(values, cs) + ' RETURNING id, email, first_name, last_name, roles';
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

  async getCourse(courseId: number): Promise<Course> {

    return this.connection.one(`SELECT * FROM courses WHERE id = $1`, courseId)
      .then((data: Course) => {
        return data;
      })
      .catch((error: any) => {
        console.log('ERROR:', error);
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

  async getCourseDates(courseId: number): Promise<Date[]> {
    return await this.connection.any({
      name: 'getCourseDates',
      text: 'SELECT meeting FROM course_dates WHERE course_id = $1',
      values: [courseId],
      rowMode: 'array'
    }).then((data: Date[]) => {
        return data.flat();
    }).catch((error: any) => {
      console.log('ERROR:', error);
      return []
    });      
  }

  async setCourseDates(courses: CourseDate[]): Promise<void> {
    const cs = new this.pg.helpers.ColumnSet(['course_id', 'meeting'], {table: 'course_dates'});
    const query = this.pg.helpers.insert(courses, cs) + ' RETURNING course_id, meeting';
    await this.connection.many(query);
  }
}

export default new DbClientPSQLImpl();