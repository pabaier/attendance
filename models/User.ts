export default interface User {
    id?: number,
    email: string,
    firstName: string,
    lastName: string,
    password?: string,
    salt?: string,
    roles: string | string[],
    groups: number[],
}