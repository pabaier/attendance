export interface DbClient {
    connection: any;
    signIn(userName: string): boolean;
    getUserId(userEmail: string): Promise<number | null>;
}