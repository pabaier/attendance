export default interface UserAssessment {
    userId: number,
    assessmentId: number,
    grade?: string,
    comment?: string,
    start?: Date,
    end?: Date,
}