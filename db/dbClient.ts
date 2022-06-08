import { UserInfo } from "../models";

export interface DbClient {
    connection: any;
    signIn(userId: number): boolean;
    getUser(userEmail: string): Promise<UserInfo | null>;
}