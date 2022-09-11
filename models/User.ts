export default interface User {
    id?: number,
    email: string,
    firstName: string,
    lastName: string,
    roles: string | string[],
    groups: number[],
}