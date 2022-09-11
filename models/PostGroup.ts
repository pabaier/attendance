export default interface PostGroup {
    postId?: number,
    groupId?: number,
    openTime: Date,
    closeTime: Date,
    visible: boolean,
    title: string,
    body: string,
    link: string,
}