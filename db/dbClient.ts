import { Course, User } from "../models";

export interface DbClient {
    connection: any;
    signIn(userId: number): boolean;
    getUser(user: string | number): Promise<User | null>;
    getUsers(group?: string | null): Promise<User[] | null>;
    addUsers(users: User[]): Promise<any | null>;
    deleteUser(userId: number): boolean;
    getLatestSignIn(userId: number): Promise<number | null>;
    getCourses(): Promise<Course[]>;
    addCourse(course: Course): boolean;
    deleteCourse(courseId: number): boolean;
}