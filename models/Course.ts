export default interface Course {
    id?: number,
	courseNumber: string,
	courseName?: string,
	semesterId: number,
	season: string,
	year: number,
	startTime: string,
	endTime: string,
	groupId: number
}