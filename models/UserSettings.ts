export default interface UserSettings {
    semesterId: number,
    assessment?: {
        id?: number,
        verified: boolean,
        expires?: Date,
    }
}