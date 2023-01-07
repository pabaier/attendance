export default interface UserQuestion {
    assessmentId: number,
    questionId: number,
    userId: number,
    userAnswer?: string,
    variables: string,
    questionAnswer: string,
    code?: string,
    attempts: number,
}