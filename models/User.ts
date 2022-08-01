export default interface User {
    id?: number,
    email: string,
    first_name: string,
    last_name: string,
    roles: string | string[],
    groups: string,
}