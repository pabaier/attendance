export default interface UserSettings {
    semesterId: number,
    assessment?: {
        id?: string,
        verified: boolean,
        expires?: Date,
    }
}