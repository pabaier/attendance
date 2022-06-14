import { User } from "../models";

export interface DbClient {
    connection: any;
    signIn(userId: number): boolean;
    getUser(user: string | number): Promise<User | null>;
    getUsers(group?: string | null): Promise<User[] | null>;
    addUsers(users: User[]): Promise<any | null>;
}