import { DbClient } from './dbClient';
import pgp from 'pg-promise'
import { Assignment, Course, CourseDate, User, UserGroups, PostGroup, Group } from '../models';

class DbClientPSQLImpl implements DbClient {
  connection: any;
  pg: pgp.IMain;

  constructor() {
    const baseURL = process.env.BASEURL;
    const databaseURL: string = process.env.DB_URL as string;
    this.pg = pgp()
    this.connection = this.pg(
      {
        connectionString: databaseURL,
        ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false
      }
    )
  }

  async createGroup(groupName: string): Promise<number> {
    const cs = new this.pg.helpers.ColumnSet(['group_name'], {table: 'groups'});
    const query = this.pg.helpers.insert({group_name: groupName}, cs) + ' RETURNING id';
    const res: {id: number} = await this.connection.one(query);
    return res.id;
  }

  async getCourseIds(userId: number): Promise<number[]> {
    return await this.connection.any({
      name: 'getCourseIds',
      text: `select c.id from users u
        join user_group ug
        on u.id = ug.user_id
        join courses c
        on ug.group_id = c.group_id 
        where u.id = $1`,
      values: [userId],
      rowMode: 'array'
    }).then((data: any) => {
        return data.flat();
    }).catch((error: any) => {
      console.log('ERROR:', error);
      return []
    }); 
  }

  async getPosts(groupId: number): Promise<PostGroup[]> {
    return await this.connection.any({
      name: 'getPosts',
      text: `SELECT p.id "postId", pg.group_id "groupId",
      pg.open_time "openTime", pg.close_time "closeTime",
      pg.visible, p.title, p.body, p.url_link link
      FROM post_group pg 
      inner join posts p
      on pg.post_id = p.id 
      where pg.group_id = $1 
      order by pg.open_time`,
      values: [groupId],
    }).then((data: PostGroup[][]) => {
      return data.flat();
    }).catch((error: any) => {
      console.log('ERROR:', error);
      return []
    });
  }

  async getUserSignInDates(userId: number, courseId: number): Promise<Date[]> {
    return await this.connection.any({
      name: 'getUserSignInDates',
      text: 'SELECT date_created FROM attendance where user_id = $1 and course_id = $2',
      values: [userId, courseId],
      rowMode: 'array'
    }).then((data: any) => {
      return data.flat();
    }).catch((error: any) => {
      console.log('ERROR:', error);
      return 0
    });
  }

  async setUserGroups(userGroups: UserGroups): Promise<boolean> {
    const userId = userGroups.userId;
    var query = 'delete from user_group where user_id = $1'
    return this.connection.none(query, [userId])
    .then((data: any) => {
      return this.addUsersToGroups([userGroups]);
    })
    .catch((error: any) => {
      return false;
    })
  }

  async updateUser(user: User): Promise<boolean> {
    const cs = new this.pg.helpers.ColumnSet(['first_name', 'last_name', 'roles']);
    const data = {first_name: user.firstName, last_name: user.lastName, roles: user.roles}
    const condition = pgp.as.format(' WHERE id = $1', user.id);
    const query = this.pg.helpers.update(data, cs, 'users') + condition;
    return this.connection.none(query).then((data: any) => {
      return true;
    }).catch((error: any) => {
      console.log(error)
      return false;
    });  }

  async getTodaySignIns(courseId: number): Promise<User[]> {
    const query = {
      name: 'getTodaySignIns',
      text: `
        SELECT u.id, u.email, u.first_name "firstName", u.last_name "lastName", u.roles FROM attendance a
        inner join users u
        on a.user_id = u.id
        where a.course_id = $1 and a.date_created > (current_date at time zone 'est')::date
      `,
      values: [courseId]
    }
    return this.connection.any(query).then((data: User[]) => {
      return data;
    }).catch((error: any) => {
      console.log(error)
      return [];
    });
  }

  async signInUsers(userCourseIds: {user_id: number, course_id: number}[]): Promise<boolean> {
    const cs = new this.pg.helpers.ColumnSet(['user_id', 'course_id'], {table: 'attendance'});
    const query = this.pg.helpers.insert(userCourseIds, cs);
    return this.connection.any(query).then((data: any) => {
      return true;
    }).catch((error: any) => {
      console.log(error)
      return false;
    });
  }

  async getTotalUserSignIns(userId: number, courseId: number): Promise<number> {
    return await this.connection.any({
      name: 'getTotalUserSignIns',
      text: 'SELECT * FROM attendance where user_id = $1 and course_id = $2',
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

  async getGroups(userId: number): Promise<Group[]> {
    return await this.connection.any({
      name: 'getGroups',
      text: `SELECT g.id, g.group_name "name" 
        FROM user_group ug
        left join "groups" g 
        on g.id = ug.group_id 
        where user_id = $1
      `,
      values: [userId],
    }).then((data: Group[]) => {
        return data;
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

  async updateAssignment(assignment: Assignment): Promise<boolean> {
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
  async getAssignments(groupId: number): Promise<Assignment[]> {
    var query = `select a.id, a.title, a.start_time, a.end_time, a.url_link
    from assignment_group ga
    inner join assignments a
    on ga.assignment_id = a.id
    where ga.group_id = $1
    ORDER BY a.start_time`;
    
    return this.connection.any(query, [groupId])
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

  async getUsers(groupId?: number | null): Promise<User[] | null> {
    var query = 'select u.id, u.email, u.first_name "firstName", u.last_name "lastName", u.roles from users u'
    if (groupId) {
      query = 'select u.id, u.email, u.first_name "firstName", u.last_name "lastName", u.roles from user_group ug inner join users u on u.id = ug.user_id'
      query = query + ' where ug.group_id = $1';
    }
    query = query + ' order by u.roles desc, u.last_name';
    return this.connection.any(query, [groupId])
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

    return await this.connection.any(
      `SELECT u.id, u.email, u.first_name "firstName", u.last_name "lastName", u.roles, ug.group_id FROM users u
      left join user_group ug 
      on u.id = ug.user_id
      WHERE u.${userOption} = $1`, [user]
    ).then((users: any[]) => {
      return {
        id: users[0].id,
        email: users[0].email,
        firstName: users[0].firstName,
        lastName: users[0].lastName,
        roles: users[0].roles.replaceAll(' ', '').split(','),
        groups: users.map(user => user.group_id)
      }
    }).catch((error: any) => {
      console.log('ERROR:', error);
      return null
    }); 
  }

  async addUsers(users: User[]): Promise<User[]> {
    const cs = new this.pg.helpers.ColumnSet(['email', 'first_name', 'last_name', 'roles'], {table: 'users'});
    const values = users.map(u => { return {
      email: u.email, 
      first_name: u.firstName, 
      last_name: u.lastName, 
      roles: u.roles, 
    }})
    const query = this.pg.helpers.insert(values, cs) + ' RETURNING id, email, first_name as "firstName", last_name as "lastName", roles';
    const res: User[] = await this.connection.many(query);
    return res;
  }

  async deleteUser(userId: number): Promise<boolean> {
    return this.connection.none('DELETE FROM users WHERE id = $1', userId)
    .then((data: any) => { return true;})
    .catch((error: any) => {
      console.log('ERROR:', error);
      return false;
    });
  };

  async getCourses(): Promise<Course[]> {
    var query = `SELECT 
    id, semester, course_year "courseYear", start_time "startTime", end_time "endTime",
    course_number "courseNumber", course_name "courseName", group_id "groupId"
    FROM courses`
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

    return this.connection.one(`SELECT 
    id, semester, course_year "courseYear", start_time "startTime", end_time "endTime",
    course_number "courseNumber", course_name "courseName", group_id "groupId"
    FROM courses WHERE id = $1`, courseId)
      .then((data: Course) => {
        return data;
      })
      .catch((error: any) => {
        console.log('ERROR:', error);
      });
  }

  async createCourse(course: Course): Promise<number> {
    const cs = new this.pg.helpers.ColumnSet(['course_number', 'semester', 'course_year', 'start_time', 'end_time', 'group_id'], {table: 'courses'});
    const insertObj = {
      course_number: course.courseNumber,
      semester: course.semester,
      course_year: course.courseYear,
      start_time: course.startTime,
      end_time: course.endTime,
      group_id: course.groupId,
    }

    const query = this.pg.helpers.insert(insertObj, cs) + ' RETURNING id';
    const res: {id: number} = await this.connection.one(query);
    return res.id;
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
    if(!userGroups.length) return [];
    const cs = new this.pg.helpers.ColumnSet(['user_id', 'group_id'], {table: 'user_group'});
    var values: {}[] = []
    userGroups.forEach(entry => {
      const uId = entry.userId
      entry.groupIds.forEach(gId => {
        values.push({user_id: uId, group_id: gId})
      })
    })
    if (values.length) {
      const query = this.pg.helpers.insert(values, cs) + ' RETURNING user_id, group_id';
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