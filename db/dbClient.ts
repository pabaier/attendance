import { Assignment, Course, CourseDate, User, PostGroup, UserGroups, Group, Test, UserQuestionGrade, TestUserData, UserTest, UserSettings, Semester, Post, AssignmentGroup, AnnouncementGroup } from "../models";

export interface DbClient {
    connection: any;
    signIn(userId: number, courseId: number, ip?: string): Promise<boolean>;
    signInUsers(userCourseIds: {user_id: number, course_id: number}[]): Promise<boolean>;
    getUser(user: string | number): Promise<User | null>;
    updateUser(user: User): Promise<boolean>;
    getUsers(group?: number[]): Promise<User[]>;
    addUsers(users: User[]): Promise<User[]>;
    deleteUser(userId: number): Promise<boolean>;
    getLatestSignIn(userId: number): Promise<number | null>;
    getCourses(semesterId?: number): Promise<Course[]>;
    getUserCourses(userId: number, semesterId?: number): Promise<Course[]>;
    getCourse(courseId: number): Promise<Course>;
    createCourse(course: Course): Promise<number>;
    deleteCourse(courseId: number): Promise<boolean>;
    deleteGroup(groupId: number): Promise<boolean>;
    addUsersToGroups(userGroups: UserGroups[]): Promise<boolean>;
    setUserGroups(userGroups: UserGroups): Promise<boolean>;
    deleteUserFromGroup(groupName: string, userId: number): boolean;
    getCourseDates(courseId: number): Promise<Date[]>
    setCourseDates(courseDates: CourseDate[]): Promise<void>
    getAssignments(groupIds: number[]): Promise<Assignment[]>
    getUserAssignments(userId: number, groupIds?: number[]): Promise<Assignment[]>
    updateAssignment(assignment: Assignment): Promise<boolean>
    addAssignments(assignments: Assignment[]): Promise<{id: number}[]>
    addAssignmentToCourse(assignmentCourse: {assignment_id: number, course_id: number}[]): Promise<boolean>
    getGroups(userId?: number): Promise<Group[]>
    getTodaySignIn(userId: number, courseId: number): Promise<Date[]>;
    getTodaySignIns(courseId: number): Promise<User[]>;
    getTotalCourseDays(courseId: number, until?: Date): Promise<number>;
    getTotalUserSignIns(userId: number, courseId: number): Promise<number>;
    getUserSignInDates(userId: number, courseId: number): Promise<Date[]>;
    getAllPosts(): Promise<Post[]>;
    getPosts(groupId: number): Promise<PostGroup[]>;
    getCourseIds(userId: number, semesterId?: number): Promise<number[]>;
    createGroup(groupName: string): Promise<number>;
    getTests(): Promise<Test[]>;
    getTestUserData(groupId: number, testDate: Date): Promise<TestUserData[]>;
    setUserQuestionGrade(userQuestionGrade: UserQuestionGrade): Promise<boolean>;
    setUserTestGrade(grade: number, userId: number, testDate: Date): Promise<boolean>;
    getGroupTests(groupId: number, testDate: Date): Promise<UserTest[]>;
    updateUserPassword(userId: number, password: string, salt?: string): Promise<boolean>;
    getUserSettings(userId: number): Promise<UserSettings>;
    getSemesters(semesterId?: number): Promise<Semester[]>;
    createUsers(users: any, ): Promise<number[]>;
    updateUserSettings(userSettings: (UserSettings & {userId: number})[]): Promise<boolean>;
    createPost(post: Post): Promise<number>;
    updatePost(post: Post): Promise<boolean>;
    deletePost(postId: number): Promise<boolean>;
    createAssignmentGroup(assignmentGroup: AssignmentGroup): Promise<boolean>;
    getAssignmentGroups(): Promise<AssignmentGroup[]>;
    deleteAssignment(groupId: number, postId: number): Promise<boolean>;
    updateAssignmentGroup(oldIds: {groupId: number, postId: number}, assignmentGroup: AssignmentGroup): Promise<boolean>;
    getAnnouncementGroups(): Promise<AnnouncementGroup[]>;
    createAnnouncementGroup(announcementGroup: AnnouncementGroup): Promise<boolean>;
    deleteAnnouncement(groupId: number, postId: number): Promise<boolean>;
    updateAnnouncementGroup(oldIds: {groupId: number, postId: number}, announcementGroup: AnnouncementGroup): Promise<boolean>;
}