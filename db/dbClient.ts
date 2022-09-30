import { Assignment, Course, CourseDate, User, PostGroup, UserGroups, Group, Test, UserQuestionGrade, TestUserData } from "../models";

export interface DbClient {
    connection: any;
    signIn(userId: number, courseId: number): Promise<boolean>;
    signInUsers(userCourseIds: {user_id: number, course_id: number}[]): Promise<boolean>;
    getUser(user: string | number): Promise<User | null>;
    updateUser(user: User): Promise<boolean>;
    getUsers(group?: number | null): Promise<User[] | null>;
    addUsers(users: User[]): Promise<User[]>;
    deleteUser(userId: number): Promise<boolean>;
    getLatestSignIn(userId: number): Promise<number | null>;
    getCourses(): Promise<Course[]>;
    getCourse(courseId: number): Promise<Course>;
    createCourse(course: Course): Promise<number>;
    deleteCourse(courseId: number): boolean;
    addUsersToGroups(userGroups: UserGroups[]): Promise<{}[]>;
    setUserGroups(userGroups: UserGroups): Promise<boolean>;
    deleteUserFromGroup(groupName: string, userId: number): boolean;
    getCourseDates(courseId: number): Promise<Date[]>
    setCourseDates(courseDates: CourseDate[]): Promise<void>
    // getAssignments(courseId: number): Promise<(Course & Assignment)[]>
    getAssignments(courseId: number): Promise<Assignment[]>
    getUserAssignments(userId: number): Promise<Assignment[]>
    updateAssignment(assignment: Assignment): Promise<boolean>
    addAssignments(assignments: Assignment[]): Promise<{id: number}[]>
    addAssignmentToCourse(assignmentCourse: {assignment_id: number, course_id: number}[]): Promise<boolean>
    getGroups(userId: number): Promise<Group[]>
    getTodaySignIn(userId: number, courseId: number): Promise<Date[]>;
    getTodaySignIns(courseId: number): Promise<User[]>;
    getTotalCourseDays(courseId: number, until?: Date): Promise<number>;
    getTotalUserSignIns(userId: number, courseId: number): Promise<number>;
    getUserSignInDates(userId: number, courseId: number): Promise<Date[]>;
    getPosts(groupId: number): Promise<PostGroup[]>;
    getCourseIds(userId: number): Promise<number[]>;
    createGroup(groupName: string): Promise<number>;
    getTests(): Promise<Test[]>;
    getTestUserData(groupId: number, testDate: Date): Promise<TestUserData[]>;
    setUserQuestionGrade(userQuestionGrade: UserQuestionGrade): Promise<boolean>;
}