import { User } from "../models";

export interface DbClient {
    connection: any;
    signIn(userId: number): boolean;
    getUser(userEmail: string): Promise<User | null>;
    getUsers(group?: string | null): Promise<User[] | null>;
    addUsers(users: User[]): Promise<any | null>;
}