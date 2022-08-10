import { Assignment, Course, CourseDate, User, UserGroups } from "../models";

export interface DbClient {
    connection: any;
    signIn(userId: number): boolean;
    getUser(user: string | number): Promise<User | null>;
    getUsers(group?: string | null): Promise<User[] | null>;
    addUsers(users: User[]): Promise<User[]>;
    deleteUser(userId: number): boolean;
    getLatestSignIn(userId: number): Promise<number | null>;
    getCourses(): Promise<Course[]>;
    getCourse(courseId: number): Promise<Course>;
    addCourse(course: Course): boolean;
    deleteCourse(courseId: number): boolean;
    addUsersToGroups(userGroups: UserGroups[]): Promise<{}[]>;
    deleteUserFromGroup(groupName: string, userId: number): boolean;
    getCourseDates(courseId: number): Promise<CourseDate[]>
    setCourseDates(courseDates: CourseDate[]): Promise<void>
    // getAssignments(courseId: number): Promise<(Course & Assignment)[]>
    getAssignments(courseId: number): Promise<Assignment[]>
    updateAssignment(assignment: Assignment): Promise<boolean>
    addAssignments(assignments: Assignment[]): Promise<{id: number}[]>
    addAssignmentToCourse(assignmentCourse: {assignment_id: number, course_id: number}[]): Promise<boolean>
}