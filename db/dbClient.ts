export interface DbClient {
    connection: any;
    signIn(userId: number): boolean;
    getUserId(userEmail: string): Promise<number | null>;
}