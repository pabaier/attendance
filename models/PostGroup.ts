export default interface PostGroup {
    postId?: number,
    groupId?: number,
    openTime?: Date,
    closeTime?: Date,
    activeStartTime?: Date,
    activeEndTime?: Date,
    postTypeId: number
}