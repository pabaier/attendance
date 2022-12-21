import { DbClient } from '../db/dbClient';
import { Course } from '../models';

export const makeCourseName = (course: Course) => {
    return `${course.courseNumber} - ${course.startTime}`
}

export const makeUTCDateString = (original: Date): string => {
    return (new Date(original.getTime() - original.getTimezoneOffset() * 60000).toISOString()).slice(0, -1);
}

export const calendarEventColors = [{
        meeting: '#26547C',
        assignment: ['#6787a3', '#93aabe'],
        present: '#ACF39D',
        absent: '#C14953'
    }, {
        meeting: '#FF8427',
        assignment: ['#ffa968', '#ffc293'],
        present: '#AAFAC8',
        absent: '#C76D7E'
    }, {
        meeting: '#20c997',
        assignment: ['#63d9b6', '#90e4cb'],
        present: '#26532B',
        absent: '#CE4760'
    }, {
        meeting: '#0dcaf0',
        assignment: ['#56daf5', '#86e5f8'],
        present: '#3F4B3B',
        absent: '#FF6978'
    }, {
        meeting: '#6f42c1',
        assignment: ['#9a7bd4', '#b7a1e0'],
        present: '#273B09',
        absent: '#AC3931'
    }, {
        meeting: '#ffc107',
        assignment: ['#ffd451', '#ffe083'],
        present: '#313628',
        absent: '#DE3C4B'
    }, {
        meeting: '#198754',
        assignment: ['#5eab87', '#8cc3aa'],
        present: '#0E3B43',
        absent: '#A53F2B'
    }, {
        meeting: '#dc3545',
        assignment: ['#e7727d', '#ee9aa2'],
        present: '#C1D7AE',
        absent: '#220901'
    }
]

export const signIn = async (dbClient: DbClient, userId: number, courseId: number, ip?: string): Promise<({alreadySignedIn: boolean, success: boolean})> => {
    const signedIn = await dbClient.getTodaySignIn(userId, courseId)
    var success = false;

    if (!signedIn.length) {
        success = await dbClient.signIn(userId, courseId, ip)
    }

    return {
        alreadySignedIn: signedIn.length > 0,
        success
    };
}

export const getPresentAbsentDates = (signInDates: Date[], courseDates: Date[]): {present: Date[], absent: Date[]} => {
    var results: {present: Date[], absent: Date[]} = {present: [], absent:[]}
    return courseDates.reduce((res, currentDate) => {
        var present = signInDates.some(signInDate => {
            return signInDate.getFullYear() == currentDate.getFullYear() &&
            signInDate.getMonth() == currentDate.getMonth() &&
            signInDate.getDate() == currentDate.getDate()
        });
        if (present) {
            res.present.push(currentDate)
        } else {
            res.absent.push(currentDate)
        }
        return res;
    }, results)
}

export const makePresentAbsentCalendarDates = (presentDates: Date[], absentDates: Date[], index:number = 0) => {
    const presentCalendarEvents = presentDates.map(date => {
        return {
            title: 'Present',
            start: date.toISOString(),
            end: undefined,
            url: undefined,
            backgroundColor: calendarEventColors[index].present,
            textColor: undefined,
        }
     })

     const absentCalendarEvents = absentDates.map(date => {
        return {
            title: 'Absent',
            start: date.toISOString(),
            end: undefined,
            url: undefined,
            backgroundColor: calendarEventColors[index].absent,
            textColor: undefined,
        }
     })

    return {presentCalendarEvents, absentCalendarEvents}
}

export const numberToGrade = (numberGrade: number) => {
    if(numberGrade > 3.85) return 'A'
    if(numberGrade > 3.5) return 'A-'
    if(numberGrade > 3.15) return 'B+'
    if(numberGrade > 2.85) return 'B'
    if(numberGrade > 2.5) return 'B-'
    if(numberGrade > 2.15) return 'C+'
    if(numberGrade > 1.85) return 'C'
    if(numberGrade > 1.5) return 'C-'
    if(numberGrade > 1.15) return 'D+'
    if(numberGrade > 0.85) return 'D'
    if(numberGrade > 0.5) return 'D-'
    return 'F'
}