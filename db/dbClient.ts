import { Course, User, UserGroups } from "../models";

export interface DbClient {
    connection: any;
    signIn(userId: number): boolean;
    getUser(user: string | number): Promise<User | null>;
    getUsers(group?: string | null): Promise<User[] | null>;
    addUsers(users: User[]): Promise<User[]>;
    deleteUser(userId: number): boolean;
    getLatestSignIn(userId: number): Promise<number | null>;
    getCourses(): Promise<Course[]>;
    addCourse(course: Course): boolean;
    deleteCourse(courseId: number): boolean;
    addUsersToGroups(userGroups: UserGroups[]): Promise<{}[]>;
}