import { Course } from '../models';

export const makeCourseName = (course: Course) => {
    return `${course.course_number} ${course.semester}-${course.course_year} ${course.start_time}`
}

export const makeUTCDateString = (original: Date): string => {
    return (new Date(original.getTime() - original.getTimezoneOffset() * 60000).toISOString()).slice(0, -1);
}