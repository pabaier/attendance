import { Course } from '../models';

export const makeCourseName = (course: Course) => {
    return `${course.course_number} ${course.semester}-${course.course_year} ${course.start_time}`
}

export const makeUTCDateString = (original: Date): string => {
    return (new Date(original.getTime() - original.getTimezoneOffset() * 60000).toISOString()).slice(0, -1);
}

export const calendarEventColors = [{
        meeting: '#0d6efd',
        assignment: ['#569afe', '#86b7fe']
    }, {
        meeting: '#fd7e14',
        assignment: ['#fea55b', '#febf8a']
    }, {
        meeting: '#20c997',
        assignment: ['#63d9b6', '#90e4cb']
    }, {
        meeting: '#0dcaf0',
        assignment: ['#56daf5', '#86e5f8']
    }, {
        meeting: '#6f42c1',
        assignment: ['#9a7bd4', '#b7a1e0']
    }, {
        meeting: '#ffc107',
        assignment: ['#ffd451', '#ffe083']
    }, {
        meeting: '#198754',
        assignment: ['#5eab87', '#8cc3aa']
    }, {
        meeting: '#dc3545',
        assignment: ['#e7727d', '#ee9aa2']
    }
]