import { Course, CourseDate, User, PostGroup, UserGroups, Group, Test, UserQuestionGrade, TestUserData, UserTest, UserSettings, Semester, Post, PostType } from "../models";

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
    getUserCourses(userId: number, semesterId?: number): Promise<Course[]>;
    deleteGroup(groupId: number): Promise<boolean>;
    addUsersToGroups(userGroups: UserGroups[]): Promise<boolean>;
    setUserGroups(userGroups: UserGroups): Promise<boolean>;
    deleteUserFromGroup(groupName: string, userId: number): boolean;
    
    getCourses(semesterId?: number): Promise<Course[]>;
    getCourse(courseId: number): Promise<Course>;
    createCourse(course: Course): Promise<number>;
    deleteCourse(courseId: number): Promise<boolean>;
    
    getCourseDates(courseId: number): Promise<Date[]>
    setCourseDates(courseDates: CourseDate[]): Promise<void>
    deleteCourseDates(courseId: number): Promise<boolean>;
    deleteCourseDate(courseId: number, date: Date): Promise<boolean>;

    getGroups(userId?: number): Promise<Group[]>;
    createGroup(groupName: string): Promise<number>;
    getGroup(groupId: number): Promise<Group>;
    
    getTodaySignIn(userId: number, courseId: number): Promise<Date[]>;
    getTodaySignIns(courseId: number): Promise<User[]>;
    getTotalCourseDays(courseId: number, until?: Date): Promise<number>;
    getTotalUserSignIns(userId: number, courseId: number): Promise<number>;
    getUserSignInDates(userId: number, courseId: number): Promise<Date[]>;
    getCourseIds(userId: number, semesterId?: number): Promise<number[]>;
    getTests(): Promise<Test[]>;
    getTestUserData(groupId: number, testDate: Date): Promise<TestUserData[]>;
    setUserQuestionGrade(userQuestionGrade: UserQuestionGrade): Promise<boolean>;
    setUserTestGrade(grade: number, userId: number, testDate: Date): Promise<boolean>;
    getGroupTests(groupId: number, testDate: Date): Promise<UserTest[]>;
    updateUserPassword(userId: number, password: string, salt?: string): Promise<boolean>;
    getUserSettings(userId: number): Promise<UserSettings>;
    createUsers(users: any, ): Promise<number[]>;
    updateUserSettings(userSettings: (UserSettings & {userId: number})[]): Promise<boolean>;
    
    getSemesters(semesterId?: number): Promise<Semester[]>;
    updateSemester(userId: number, semesterId:number): Promise<boolean>;

    getAllPosts(): Promise<Post[]>;
    getFullPosts(groupIds: number[], postTypeIds: number[]): Promise<(Post & PostGroup)[]>
    createPost(post: Post): Promise<number>;
    updatePost(post: Post): Promise<boolean>;
    deletePost(postId: number): Promise<boolean>;
    createPostGroup(postGroup: PostGroup): Promise<boolean>;
    getPostGroups(postTypeIds: number[]): Promise<PostGroup[]>;
    deletePostGroup(groupId: number, postId: number, postTypeId: number): Promise<boolean>;
    updatePostGroup(oldIds: {groupId: number, postId: number, postTypeId: number}, postGroup: PostGroup): Promise<boolean>;
    getPostTypes(): Promise<PostType[]>;
}