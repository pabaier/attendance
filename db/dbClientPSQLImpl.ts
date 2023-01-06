import { DbClient } from './dbClient';
import pgp from 'pg-promise'
import { Course, CourseDate, User, UserGroups, PostGroup, Group, Test, UserQuestionGrade, TestUserData, UserTest, UserSettings, Semester, Post, PostType, Assessment, AssessmentQuestion, AssessmentSettings, GlobalSettings, Question } from '../models';

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

  async updateQuestion(question: Question): Promise<boolean> {
    const cs = new this.pg.helpers.ColumnSet(['title', 'question_description']);
    const data = {
      title: question.title,
      question_description: question.description,
    };
    const condition = pgp.as.format(' WHERE id = $1', [question.id]);
    const query = this.pg.helpers.update(data, cs, 'question') + condition;
    return this.connection.none(query).then((data: any) => {
      return true;
    }).catch((error: any) => {
      console.log(error)
      return false;
    });
  }

  async deleteQuestion(questionId: number): Promise<boolean> {
    var query = 'delete from question where id = $1'
    return this.connection.none(query, [questionId])
    .then((data: any) => {
      return true;
    })
    .catch((error: any) => {
      console.log(error)
      return false;
    })
  }

  async updateGlobalSettings(settings: GlobalSettings): Promise<boolean> {
    const cs = new this.pg.helpers.ColumnSet(['code_refresh_rate', 'code_time_window', 'code_time_start']);
    const data = {
      code_refresh_rate: settings.codeRefreshRate,
      code_time_window: settings.codeTimeWindow,
      code_time_start: settings.codeTimeStart,
    };
    const condition = pgp.as.format(' WHERE user_id = $1', [settings.userId]);
    const query = this.pg.helpers.update(data, cs, 'global_settings') + condition;
    return this.connection.none(query).then((data: any) => {
      return true;
    }).catch((error: any) => {
      console.log(error)
      return false;
    });
  }

  async getGlobalSettings(userId: number): Promise<GlobalSettings> {
    var query = `SELECT gs.user_id "userId", gs.code_refresh_rate "codeRefreshRate", gs.code_time_window "codeTimeWindow", gs.code_time_start "codeTimeStart"
                 FROM global_settings gs
                 WHERE gs.user_id = $1`
    return this.connection.one(query, [userId])
      .then((data: GlobalSettings) => {
        return data
      })
      .catch((error: any) => {
        console.log('ERROR:', error);
        return undefined;
      });
  }
  
  async getCourseByGroupId(groupId: number): Promise<Course | undefined> {
    var query = `SELECT c.id, c.semester_id "semesterId", c.start_time "startTime", c.end_time "endTime",
                 c.course_number "courseNumber", c.course_name "courseName", c.group_id "groupId"
                 FROM courses c
                 WHERE c.group_id = $1`
    return this.connection.any(query, [groupId])
      .then((data: Course[]) => {
        return data.length ? data[0] : undefined
      })
      .catch((error: any) => {
        console.log('ERROR:', error);
        return undefined;
      });
  }

  async deleteAssessmentQuestion(assessmentId: number, questionId: number): Promise<boolean> {
    var query = 'delete from assessment_question where assessment_id = $1 and question_id = $2'
    return this.connection.none(query, [assessmentId, questionId])
    .then((data: any) => {
      return true;
    })
    .catch((error: any) => {
      console.log(error)
      return false;
    })
  }

  async createAssessmentQuestion(assessmentQuestion: AssessmentQuestion): Promise<boolean> {
    const cs = new this.pg.helpers.ColumnSet(['assessment_id', 'question_id', 'attempts'], {table: 'assessment_question'});
    const data = {
        assessment_id: assessmentQuestion.assessmentId,
        question_id: assessmentQuestion.questionId,
        attempts: assessmentQuestion.attempts,
    };
    const query = this.pg.helpers.insert(data, cs);
    return this.connection.none(query)
    .then((data: any) => {
      return true;
    }).catch((error: any) => {
      console.log(error)
      return false;
    });
  }

  async updateAssessmentSettings(assessmentSettings: AssessmentSettings): Promise<boolean> {
    const cs = new this.pg.helpers.ColumnSet(['start_time', 'end_time']);
    const data = {
      start_time: assessmentSettings.startTime,
      end_time: assessmentSettings.endTime,
    };
    const condition = pgp.as.format(' WHERE assessment_id = $1 and group_id = $2', [assessmentSettings.assessmentId, assessmentSettings.groupId]);
    const query = this.pg.helpers.update(data, cs, 'assessment_settings') + condition;
    return this.connection.none(query).then((data: any) => {
      return true;
    }).catch((error: any) => {
      console.log(error)
      return false;
    });
  }

  async deleteAssessmentSettings(assessmentId: number, groupId: number): Promise<boolean> {
    var query = 'delete from assessment_settings where assessment_id = $1 and group_id = $2'
    return this.connection.none(query, [assessmentId, groupId])
    .then((data: any) => {
      return true;
    })
    .catch((error: any) => {
      console.log(error)
      return false;
    })
  }

  async createAssessmentSettings(assessmentSettings: AssessmentSettings): Promise<boolean> {
    const cs = new this.pg.helpers.ColumnSet(['assessment_id', 'group_id', 'start_time', 'end_time'], {table: 'assessment_settings'});
    const data = {
        assessment_id: assessmentSettings.assessmentId,
        group_id: assessmentSettings.groupId,
        start_time: assessmentSettings.startTime,
        end_time: assessmentSettings.endTime,
    };
    const query = this.pg.helpers.insert(data, cs);
    return this.connection.none(query)
    .then((data: any) => {
      return true;
    }).catch((error: any) => {
      console.log(error)
      return false;
    });
  }

  async getGroupsNotPartOfAssessment(assessmentId: number): Promise<Group[]> {
    var query = `SELECT g.id, g.group_name "name"
                 FROM "groups" g
                 WHERE g.id NOT IN (
                  SELECT as2.group_id 
                  FROM assessment_settings as2 
                  WHERE as2.assessment_id = $1
                 )
                 ORDER BY g.id DESC`
    return this.connection.any(query, [assessmentId])
    .then((data: Group[]) => {
      return data;
    })
    .catch((error: any) => {
      console.log(error)
      return [];
    })
  }

  async updateAssessmentQuestion(assessmentQuestion: AssessmentQuestion): Promise<boolean> {
    const cs = new this.pg.helpers.ColumnSet(['attempts']);
    const data = {
      attempts: assessmentQuestion.attempts
    };
    const condition = pgp.as.format(' WHERE assessment_id = $1 and question_id = $2', [assessmentQuestion.assessmentId, assessmentQuestion.questionId]);
    const query = this.pg.helpers.update(data, cs, 'assessment_question') + condition;
    return this.connection.none(query).then((data: any) => {
      return true;
    }).catch((error: any) => {
      console.log(error)
      return false;
    });
  }

  async updateAssessment(assessment: Assessment): Promise<boolean> {
    const cs = new this.pg.helpers.ColumnSet(['id', 'assessment_name']);
    const data = {
      id: assessment.id,
      assessment_name: assessment.name
    };
    const condition = pgp.as.format(' WHERE id = $1', [assessment.id]);
    const query = this.pg.helpers.update(data, cs, 'assessment') + condition;
    return this.connection.none(query).then((data: any) => {
      return true;
    }).catch((error: any) => {
      console.log(error)
      return false;
    });
  }

  async getAssessmentSettings(assessmentId: number): Promise<(AssessmentSettings & {groupName: string})[]> {
    var text = `SELECT a.assessment_id "assessmentId", a.group_id "groupId", a.start_time "startTime", a.end_time "endTime", g.group_name "groupName"
                FROM assessment_settings a
                JOIN "groups" g
                ON g.id = a.group_id
                WHERE a.assessment_id = $1
                ORDER BY a.start_time DESC
                `;
    var data = [assessmentId]
    return await this.connection.any(text, data).then((data: (AssessmentSettings  & {groupName: string})[]) => {
      return data
    }).catch((error: any) => {
      console.log('ERROR:', error);
      return []
    });
  }

  async getAssessmentQuestions(assessmentId: number): Promise<(AssessmentQuestion & Question)[]> {
    return await this.connection.any({
      name: 'getAssessmentQuestions',
      text: `SELECT aq.assessment_id "assessmentId", aq.question_id "questionId", aq.attempts "attempts", q.title, q.question_description "description"
             FROM assessment_question aq
             JOIN question q
             ON aq.question_id = q.id
             WHERE aq.assessment_id = $1
             ORDER BY aq.question_id`
    }, [assessmentId]).then((data: any[]) => {
      return data
    }).catch((error: any) => {
      console.log('ERROR:', error);
      return []
    });
  }

  async createQuestion(question: Question): Promise<number | undefined> {
    const cs = new this.pg.helpers.ColumnSet(['title', 'question_description'], {table: 'question'});
    const values = {
      title: question.title,
      question_description: question.description
    }
    const query = this.pg.helpers.insert(values, cs) + ' RETURNING id';
    return this.connection.one(query).then((data: number) => {
      return data;
    }).catch((error: any) => {
      console.log(error)
      return undefined;
    });
  }

  async getQuestions(): Promise<Question[]> {
    return await this.connection.any({
      name: 'getQuestions',
      text: `SELECT q.id, q.title, q.question_description "description"
             FROM question q
             ORDER BY q.id DESC`,
    }).then((data: Question[]) => {
      return data
    }).catch((error: any) => {
      console.log('ERROR:', error);
      return []
    });
  }

  async createAssessment(assessment: Assessment): Promise<boolean> {
    const cs = new this.pg.helpers.ColumnSet(['assessment_name'], {table: 'assessment'});
    const values = {
      assessment_name: assessment.name,
    }
    const query = this.pg.helpers.insert(values, cs);
    return this.connection.none(query).then((data: any) => {
      return true;
    }).catch((error: any) => {
      console.log(error)
      return false;
    });
  }

  async getAssessments(assessmentId? : number): Promise<Assessment[]> {
    var text = `SELECT a.id, a.assessment_name "name"
                FROM assessment a`
    var data: any[] = []
    if (assessmentId) {
      text += ` where a.id = ${assessmentId}`
      data = [assessmentId]
    }
    else
      text += ' ORDER BY a.id DESC'
    return await this.connection.any(text, data).then((data: Assessment[]) => {
      return data
    }).catch((error: any) => {
      console.log('ERROR:', error);
      return []
    });
  }

  async updateSemester(userId: number, semesterId: number): Promise<boolean> {
    const columns = ['semester_id'];
    const cs = new this.pg.helpers.ColumnSet(columns);
    const data = {semester_id: semesterId}
    const condition = pgp.as.format(' WHERE user_id = $1', userId);
    const query = this.pg.helpers.update(data, cs, 'user_settings') + condition;
    return this.connection.none(query).then((data: any) => {
      return true;
    }).catch((error: any) => {
      console.log(error)
      return false;
    });  
  }

  async getPostTypes(): Promise<PostType[]> {
    return await this.connection.any({
      name: 'getPostTypes',
      text: `SELECT pt.id, pt.post_type "postType"
             FROM post_types pt`,
    }).then((data: PostType[]) => {
      return data
    }).catch((error: any) => {
      console.log('ERROR:', error);
      return []
    });
  }

  async updatePostGroup(oldIds: {groupId: number, postId: number, postTypeId: number}, postGroup: PostGroup): Promise<boolean> {
    const cs = new this.pg.helpers.ColumnSet(['post_id', 'group_id', 'open_time', 'close_time', 'active_start_time', 'active_end_time', 'post_type_id']);
    const data = {
      post_id: postGroup.postId,
      group_id: postGroup.groupId,
      open_time: postGroup.openTime,
      close_time: postGroup.closeTime,
      active_start_time: postGroup.activeStartTime,
      active_end_time: postGroup.activeEndTime,
      post_type_id: postGroup.postTypeId
    };
    const condition = pgp.as.format(' WHERE post_id = $1 and group_id = $2 and post_type_id = $3', [oldIds.postId, oldIds.groupId, oldIds.postTypeId]);
    const query = this.pg.helpers.update(data, cs, 'post_group') + condition;
    return this.connection.none(query).then((data: any) => {
      return true;
    }).catch((error: any) => {
      console.log(error)
      return false;
    });
  }

  async deletePostGroup(groupId: number, postId: number, postTypeId: number): Promise<boolean> {
    var query = 'delete from post_group where group_id = $1 and post_id = $2 and post_type_id = $3'
    return this.connection.none(query, [groupId, postId, postTypeId])
    .then((data: any) => {
      return true;
    })
    .catch((error: any) => {
      return false;
    })
  }

  async getPostGroups(postTypeIds: number[]): Promise<PostGroup[]> {
    return await this.connection.any(
      `SELECT pg.post_id "postId", pg.group_id "groupId", pg.open_time "openTime", pg.close_time "closeTime",
      pg.active_start_time "activeStartTime", pg.active_end_time "activeEndTime", pg.post_type_id "postTypeId"
      FROM post_group pg
      WHERE pg.post_type_id in ($1:csv)
      order by pg.open_time DESC`, [postTypeIds]
    ).then((data: PostGroup[]) => {
      return data
    }).catch((error: any) => {
      console.log('ERROR:', error);
      return []
    });
  }

  async createPostGroup(postGroup: PostGroup): Promise<boolean> {
    const cs = new this.pg.helpers.ColumnSet(['post_id', 'group_id', 'open_time', 'close_time', 'active_start_time', 'active_end_time', 'post_type_id'], {table: 'post_group'});
    const values = {
      post_id: postGroup.postId,
      group_id: postGroup.groupId,
      open_time: postGroup.openTime,
      close_time: postGroup.closeTime,
      active_start_time: postGroup.activeStartTime,
      active_end_time: postGroup.activeEndTime,
      post_type_id: postGroup.postTypeId
    }
    const query = this.pg.helpers.insert(values, cs);
    return this.connection.none(query).then((data: any) => {
      return true;
    }).catch((error: any) => {
      console.log(error)
      return false;
    });
  }

  async updatePost(post: Post): Promise<boolean> {
    const cs = new this.pg.helpers.ColumnSet(['title', 'body', 'url_link']);
    const data = {title: post.title, body: post.body, url_link: post.link}
    const condition = pgp.as.format(' WHERE id = $1', post.id);
    const query = this.pg.helpers.update(data, cs, 'posts') + condition;
    return this.connection.none(query).then((data: any) => {
      return true;
    }).catch((error: any) => {
      console.log(error)
      return false;
    });
  }

  async deletePost(postId: number): Promise<boolean> {
    var query = 'delete from posts where id = $1'
    return this.connection.none(query, [postId])
    .then((data: any) => {
      return true;
    })
    .catch((error: any) => {
      return false;
    })
  }

  async createPost(post: Post): Promise<number> {
    const cs = new this.pg.helpers.ColumnSet(['title', 'body', 'url_link'], {table: 'posts'});
    const values = {
      title: post.title,
      body: post.body,
      url_link: post.link
    }
    const query = this.pg.helpers.insert(values, cs) + ' RETURNING id';
    const res = await this.connection.one(query);
    return res.id;
  }

  async getAllPosts(): Promise<Post[]> {
    return await this.connection.any({
      name: 'getAllPosts',
      text: `SELECT p.id, p.title, p.body, p.url_link link
      FROM posts p
      order by p.id DESC`,
    }).then((data: Post[]) => {
      return data;
    }).catch((error: any) => {
      console.log('ERROR:', error);
      return []
    });
  }

  async updateUserSettings(userSettings: (UserSettings & {userId: number})[]): Promise<boolean> {
    const cs = new this.pg.helpers.ColumnSet(['user_id', 'semester_id'], {table: 'user_settings'});
    const us = userSettings.map(x => {return {user_id: x.userId, semester_id: x.semesterId}});
    const query = this.pg.helpers.insert(us, cs) + ' ON CONFLICT (user_id) DO UPDATE SET semester_id=EXCLUDED.semester_id';
    const res = await this.connection.any(query);
    return res ? true : false;  
  }

  async createUsers(users: any): Promise<number[]> {
    const cs = new this.pg.helpers.ColumnSet(['email', 'roles', 'salt', 'password_hash'], {table: 'users'});
    const values = users.map((u: { email: any; roles: any; salt: any; password: any; }) => { return {
      email: u.email, 
      roles: u.roles,
      salt: u.salt,
      password_hash: u.password,
    }})
    const query = this.pg.helpers.insert(values, cs) + ' ON CONFLICT (email) DO UPDATE SET email=EXCLUDED.email RETURNING id';
    const res = await this.connection.many(query);
    return res.map((obj: { id: any; }) => obj.id);
  }

  async getSemesters(semesterId?: number): Promise<Semester[]> {
    var query = 'SELECT s.id, s.season, s.semester_year "year" FROM public.semester s'
    if (semesterId)
      query += ' WHERE s.id = $1'
    
      return this.connection.any(query, [semesterId])
      .then ((data: Semester[]) => {
        return data;
      }).catch((error: any) => {
        console.log('ERROR:', error)
      })
  }

  async getUserSettings(userId: number): Promise<UserSettings> {
    var query = `SELECT us.semester_id "semesterId"
    from user_settings us 
    where us.user_id = $1`;
  
    return this.connection.one(query, [userId])
    .then((data: UserSettings) => {
        return data;
    }).catch((error: any) => {
      console.log('ERROR:', error);
      return undefined;
    })
  }

  async updateUserPassword(userId: number, password: string, salt?: string): Promise<boolean> {
    const columns = salt ? ['salt', 'password_hash'] : ['password_hash'];
    const cs = new this.pg.helpers.ColumnSet(columns);
    const data = salt ? {salt, password_hash: password} : {password_hash: password}
    const condition = pgp.as.format(' WHERE id = $1', userId);
    const query = this.pg.helpers.update(data, cs, 'users') + condition;
    return this.connection.none(query).then((data: any) => {
      return true;
    }).catch((error: any) => {
      console.log(error)
      return false;
    });  
  }

  async getGroupTests(groupId: number, testDate: Date): Promise<UserTest[]> {
    var query = `select ut.user_id "userId", u.first_name "firstName", u.last_name "lastName", u.email, ut.test_date "testDate", ut.grade, ut.url_link "urlLink"
      from user_test ut 
      join users u 
      on ut.user_id = u.id
      join user_group ug 
      on ut.user_id = ug.user_id
      where ug.group_id = $1 and ut.test_date = to_timestamp(cast($2/1000 as bigint))
      order by u.last_name`;
    
    return this.connection.any(query, [groupId, testDate.getTime()])
    .then((data: UserTest[]) => {
        return data.map(userTest => {
          const floatGrade = parseFloat(userTest.grade.toString());
          userTest.grade = floatGrade;
          return userTest;
        })
    })
    .catch((error: any) => {
      console.log('ERROR:', error);
      return [];
    })
  }

  async setUserTestGrade(grade: number, userId: number, testDate: Date): Promise<boolean> {
    var query = `update user_test 
      set grade = $1
      where user_id = $2 and test_date = to_timestamp(cast($3/1000 as bigint))`
    return this.connection.none(query, [grade, userId, testDate.getTime()])
    .then((data: any) => {
      return true;
    })
    .catch((error: any) => {
      return false;
    })
  }

  async setUserQuestionGrade(userQuestionGrade: UserQuestionGrade): Promise<boolean> {
    const col1 = { name: 'user_id', prop: 'userId' };
    const col2 = { name: 'question_id', prop: 'questionId' };
    const col3 = { name: 'grade', cast: 'numeric(2,1)' };
    const cs = new this.pg.helpers.ColumnSet([col1, col2, col3], {table: 'user_question_grades'});

    const onConflict = ' ON CONFLICT(user_id, question_id) DO UPDATE SET ' +
    cs.assignColumns({from: 'EXCLUDED', skip: ['user_id', 'question_id']});

    const query = this.pg.helpers.insert(userQuestionGrade, cs) + onConflict;
    await this.connection.none(query);
    return true;
  }

  async getTestUserData(groupId: number, testDate: Date): Promise<TestUserData[]> {
    var query = `
      select u.id "userId", tq.question_name "questionName", tq.question_page "questionPage",
      tq.ordinal, tq.points, tq.question_weight "questionWeight", tq.id "questionId", uqg.grade,
      ut.url_link "url", ut.grade "overallGrade"
      from users u
      join user_group ug
      on u.id = ug.user_id 
      left join test_questions tq 
      on ug.group_id = tq.group_id
      left join user_question_grades uqg
      on tq.id = uqg.question_id and u.id = uqg.user_id
      left join user_test ut 
      on u.id = ut.user_id and tq.test_date = ut.test_date
      where ug.group_id = $1 and tq.test_date = to_timestamp(cast($2/1000 as bigint))
      order by tq.ordinal,uqg.grade
    `
    return this.connection.any(query, [groupId, testDate.getTime()])
    .then((data: TestUserData[]) => {
      return data
    })
    .catch((error: any) => {
      console.log('ERROR:', error);
      return [];
    }) 
  }

  async getTests(): Promise<Test[]> {
    var query = `select tq.test_date "testDate", tq.group_id "groupId", g.group_name "groupName"
    from test_questions tq
    join "groups" g 
    on tq.group_id = g.id 
    group by tq.test_date, tq.group_id, g.group_name`;
    return this.connection.any(query)
      .then((data: Test[]) => {
        return data
      })
      .catch((error: any) => {
        console.log('ERROR:', error);
        return [];
      }) 
  }

  async createGroup(groupName: string): Promise<number> {
    const cs = new this.pg.helpers.ColumnSet(['group_name'], {table: 'groups'});
    const query = this.pg.helpers.insert({group_name: groupName}, cs) + ' RETURNING id';
    const res: {id: number} = await this.connection.one(query);
    return res.id;
  }

  async getCourseIds(userId: number, semesterId?: number): Promise<number[]> {
    var values = [userId];
    var query = `select c.id from users u
                  join user_group ug
                  on u.id = ug.user_id
                  join courses c
                  on ug.group_id = c.group_id 
                  where u.id = $1`
    if (semesterId) {
      query += ' and c.semester_id = $2'
      values.push(semesterId);
    }
    return await this.connection.any({
      name: 'getCourseIds',
      text: query,
      values,
      rowMode: 'array'
    }).then((data: any) => {
        return data.flat();
    }).catch((error: any) => {
      console.log('ERROR:', error);
      return []
    }); 
  }

  async getFullPosts(groupIds: number[], postTypeIds: number[]): Promise<(Post & PostGroup)[]> {
    return await this.connection.any(`SELECT pg.post_id "postId", pg.group_id "groupId", pg.open_time "openTime", pg.close_time "closeTime",
             pg.active_start_time "activeStartTime", pg.active_end_time "activeEndTime", pg.post_type_id "postTypeId",
             p.title, p.body, p.url_link "link"
             FROM post_group pg
             join posts p 
             on p.id = pg.post_id
             where pg.group_id in ($1:csv) and pg.post_type_id in ($2:csv)
             order by pg.open_time DESC`, [groupIds, postTypeIds]
    ).then((data: (Post & PostGroup)[]) => {
      return data;
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
    const data = {first_name: user.firstName, last_name: user.lastName, roles: user.roles.join()}
    const condition = pgp.as.format(' WHERE id = $1', user.id);
    const query = this.pg.helpers.update(data, cs, 'users') + condition;
    return this.connection.none(query).then((data: any) => {
      return true;
    }).catch((error: any) => {
      console.log(error)
      return false;
    });  
  }

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
    var values: any[] = [courseId];
    var text: string = 'SELECT COUNT(course_id) FROM course_dates where course_id = $1'
    if (until) {
      values.push(Math.floor(until.getTime()/1000));
      text += ' and meeting <= to_timestamp($2)'
    }
    return await this.connection.one({
      name: 'getTotalCourseDays',
      text,
      values,
    }).then((data: {count: string}) => {
      return parseInt(data.count);
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

  async getGroups(userId?: number): Promise<Group[]> {
    var request: any = {
      name: `getGroups${userId}`,
      text: `SELECT g.id, g.group_name "name" FROM "groups" g order by g.id DESC`
    };
    if (userId) {
      request.text = `
        SELECT g.id, g.group_name "name" 
        FROM user_group ug
        left join "groups" g 
        on g.id = ug.group_id
        where user_id = $1
        order by g.id DESC
      `;
      request.values = [userId]
    }
    return await this.connection.any(request).then((data: Group[]) => {
        return data;
    }).catch((error: any) => {
      console.log('ERROR:', error);
      return []
    }); 
  }

  async getGroup(groupId: number): Promise<Group> {
    return this.connection.one(`
      SELECT id, group_name "name"
      FROM groups
      WHERE id = $1`, [groupId])
    .then((data: Group) => {
      return data;
    })
    .catch((error: any) => {
      return null
    })
  }

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

  async getUsers(groupIds?: number[]): Promise<User[]> {
    var query = 'select u.id, u.email, u.first_name "firstName", u.last_name "lastName", u.roles from users u'
    if (groupIds) {
      if (!groupIds.length) return [];
      query = `select u.id, u.email, u.first_name "firstName", u.last_name "lastName", u.roles 
                from user_group ug 
                inner join users u 
                on u.id = ug.user_id`
      query = query + ` where ug.group_id in (${groupIds.join(',')})`;
    }
    query = query + ' order by u.roles desc, u.last_name';
    return this.connection.any(query)
      .then((data: User[]) => {
        return data
      })
      .catch((error: any) => {
        console.log('ERROR:', error);
        return [];
      })
  }

  async signIn(userId: number, courseId: number, ip?: string) {
    return this.connection.none('INSERT INTO attendance (user_id, course_id, ip) VALUES ($1, $2, $3)', [userId, courseId, ip])
      .then((data: any) => { return true; })
      .catch((error: any) => {
        console.log('ERROR:', error);
        return false;
      });
  }

  async getUser(user: string | number): Promise<User | null> {
    const userOption: string = typeof(user) == 'string' ? 'email' : 'id';

    return await this.connection.any(
      `SELECT u.id, u.email, u.first_name "firstName", u.last_name "lastName", u.roles, u.salt, u.password_hash "password",
      ug.group_id FROM users u
      left join user_group ug 
      on u.id = ug.user_id
      WHERE u.${userOption} = $1`, [user]
    ).then((users: any[]) => {
      var u: User = {
        id: users[0].id,
        email: users[0].email,
        firstName: users[0].firstName,
        lastName: users[0].lastName,
        roles: users[0].roles.replaceAll(' ', '').split(','),
        groups: users.map(user => user.group_id),
        salt: users[0].salt,
        password: users[0].password,
      }
      return u;
    }).catch((error: any) => {
      console.log('ERROR:', error);
      return null
    }); 
  }

  async addUsers(users: User[]): Promise<User[]> {
    const cs = new this.pg.helpers.ColumnSet(['email', 'first_name', 'last_name', 'roles', 'salt', 'password_hash'], {table: 'users'});
    const values = users.map(u => { return {
      email: u.email, 
      first_name: u.firstName, 
      last_name: u.lastName, 
      roles: u.roles,
      salt: u.salt,
      password_hash: u.password,
    }})
    const query = this.pg.helpers.insert(values, cs) + ' RETURNING id, email, first_name as "firstName", last_name as "lastName", roles, salt, password_hash as password';
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

  async getUserCourses(userId: number, semesterId?: number): Promise<Course[]> {
    var values = [userId];

    var query = `SELECT 
    c.id, c.semester_id "semesterId", c.start_time "startTime", c.end_time "endTime",
    c.course_number "courseNumber", c.course_name "courseName", c.group_id "groupId"
    FROM users u
    join user_group ug
    on u.id = ug.user_id
    join courses c
    on ug.group_id = c.group_id
    where u.id = $1
    `
    
    if (semesterId) {
      query += ` and c.semester_id = $2`
      values.push(semesterId)
    }

    query += ` ORDER BY TO_TIMESTAMP(c.start_time, 'HH:MI:ss')`

    return await this.connection.any({
      name: 'getUserCourses',
      text: query,
      values
    }).then((data: any) => {
        return data;
    }).catch((error: any) => {
      console.log('ERROR:', error);
      return []
    }); 
  }

  async getCourses(semesterId?: number): Promise<Course[]> {
    var query = `SELECT 
    c.id, c.semester_id "semesterId", c.start_time "startTime", c.end_time "endTime",
    c.course_number "courseNumber", c.course_name "courseName", c.group_id "groupId"
    FROM courses c`
    
    if (semesterId)
      query += ` WHERE c.semester_id = $1`

    query += ` ORDER BY TO_TIMESTAMP(c.start_time, 'HH:MI:ss')`
    return this.connection.any(query, [semesterId])
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
    c.id, s.id "semesterId", s.season, s.semester_year "year", c.start_time "startTime", c.end_time "endTime",
    c.course_number "courseNumber", c.course_name "courseName", c.group_id "groupId"
    FROM courses c
    JOIN semester s
    on c.semester_id = s.id
    WHERE c.id = $1`, courseId)
      .then((data: Course) => {
        return data;
      })
      .catch((error: any) => {
        console.log('ERROR:', error);
      });
  }

  async createCourse(course: Course): Promise<number> {
    const cs = new this.pg.helpers.ColumnSet(['course_number', 'course_name', 'semester_id', 'start_time', 'end_time', 'group_id'], {table: 'courses'});
    const insertObj = {
      course_number: course.courseNumber,
      course_name: course.courseName,
      semester_id: course.semesterId,
      start_time: course.startTime,
      end_time: course.endTime,
      group_id: course.groupId,
    }

    const query = this.pg.helpers.insert(insertObj, cs) + ' RETURNING id';
    const res: {id: number} = await this.connection.one(query);
    return res.id;
  }

  async deleteCourse(courseId: number): Promise<boolean> {
    return this.connection.none('DELETE FROM courses WHERE id = $1', courseId)
    .then((data: any) => { return true;})
    .catch((error: any) => {
      console.log('ERROR:', error);
      return false;
    });
  };

  async deleteGroup(groupId: number): Promise<boolean> {
    return this.connection.none('DELETE FROM groups WHERE id = $1', [groupId])
    .then((data: any) => { return true;})
    .catch((error: any) => {
      console.log('ERROR:', error);
      return false;
    });
  };

  async addUsersToGroups(userGroups: UserGroups[]): Promise<boolean> {
    if(!userGroups.length) return false;
    const cs = new this.pg.helpers.ColumnSet(['user_id', 'group_id'], {table: 'user_group'});
    var values: {}[] = []
    userGroups.forEach(entry => {
      const uId = entry.userId
      entry.groupIds.forEach(gId => {
        values.push({user_id: uId, group_id: gId})
      })
    })
    if (values.length) {
      const query = this.pg.helpers.insert(values, cs) + ' ON CONFLICT DO NOTHING';
      const res = await this.connection.any(query);
      if (res) return true;
      return false;
    } else {
      return false
    }
  }

  async getCourseDates(courseId: number): Promise<Date[]> {
    return await this.connection.any({
      name: 'getCourseDates',
      text: 'SELECT meeting FROM course_dates WHERE course_id = $1 ORDER BY meeting',
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
    courses = courses.map((x:CourseDate) => {return {...x, course_id: x.courseId} })
    const query = this.pg.helpers.insert(courses, cs);
    await this.connection.none(query);
  }

  async deleteCourseDates(courseId: number): Promise<boolean> {
    var query = 'delete from course_dates where course_id = $1'
    return this.connection.none(query, [courseId])
    .then((data: any) => {
      return true;
    })
    .catch((error: any) => {
      return false;
    })
  }

  async deleteCourseDate(courseId: number, date: Date): Promise<boolean> {
    var query = 'delete from course_dates where course_id = $1 and meeting = $2'
    return this.connection.none(query, [courseId, date])
    .then((data: any) => {
      return true;
    })
    .catch((error: any) => {
      return false;
    })
  }

}

export default new DbClientPSQLImpl();