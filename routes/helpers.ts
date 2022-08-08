import { Course } from '../models';

export const makeCourseName = (course: Course) => {
    return `${course.course_number} ${course.semester}-${course.course_year} ${course.start_time}`
}