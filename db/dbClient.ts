import { Assignment, Course, CourseDate, User, UserGroups } from "../models";

export interface DbClient {
    connection: any;
    signIn(userId: number, courseId: number): Promise<boolean>;
    signInUsers(userCourseIds: {user_id: number, course_id: number}[]): Promise<boolean>;
    getUser(user: string | number): Promise<User | null>;
    updateUser(user: User): Promise<boolean>;
    getUsers(group?: string | null): Promise<User[] | null>;
    addUsers(users: User[]): Promise<User[]>;
    deleteUser(userId: number): Promise<boolean>;
    getLatestSignIn(userId: number): Promise<number | null>;
    getCourses(): Promise<Course[]>;
    getCourse(courseId: number): Promise<Course>;
    addCourse(course: Course): boolean;
    deleteCourse(courseId: number): boolean;
    addUsersToGroups(userGroups: UserGroups[]): Promise<{}[]>;
    setUserGroups(userGroups: UserGroups): Promise<boolean>;
    deleteUserFromGroup(groupName: string, userId: number): boolean;
    getCourseDates(courseId: number): Promise<Date[]>
    setCourseDates(courseDates: CourseDate[]): Promise<void>
    // getAssignments(courseId: number): Promise<(Course & Assignment)[]>
    getAssignments(courseId: number): Promise<Assignment[]>
    updateAssignment(assignment: Assignment): Promise<boolean>
    addAssignments(assignments: Assignment[]): Promise<{id: number}[]>
    addAssignmentToCourse(assignmentCourse: {assignment_id: number, course_id: number}[]): Promise<boolean>
    getGroups(userId: number): Promise<string[]>
    getTodaySignIn(userId: number, courseId: number): Promise<Date[]>;
    getTodaySignIns(courseId: number): Promise<User[]>;
    getTotalCourseDays(courseId: number, until?: Date): Promise<number>;
    getTotalUserSignIns(userId: number, courseId: number): Promise<number>;
    getUserSignInDates(userId: number, courseId: number): Promise<Date[]>;
}