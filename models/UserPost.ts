export default interface UserPost {
    id?: number,
    userId: number,
    openTime: Date,
    closeTime: Date,
    visible: boolean,
    title: string,
    body: string,
    link: string,
}