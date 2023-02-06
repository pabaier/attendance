import { TestQuestion } from "../models";

// B sum fraction series
const q1 = {
    vars: () => {
        return [getRandomNumber(50, 100)]
    },
    text: `
            <div class="col-6">
                Given the following series:<br>
                <div class="my-2 ms-3 lead">
                    (1&frasl;2), (3&frasl;4), (5&frasl;8), (7&frasl;16), ...<br>
                </div>
                Where (1&frasl;2) is term 1, (3&frasl;4) is term 2, etc...<br>
                What is term {1} as a fraction (write your answer in the format a/b)?
            </div>
            `,
    ans: (vars: number[]) => {
        var start = 1;
        var total = vars[0];
        var num = 1;
        var den = BigInt(2);
        while (start < total) {
            start += 1;
            num += 2;
            den *= BigInt(2)
        }
        return `${num.toString()}/${den.toString()}`;
    },
    check: function (vars: string, userAnswer?: string): boolean {
        if(!userAnswer) return false;
        var parsedVars = JSON.parse(vars);
        var intVars: number[] = parsedVars.map((x: any) => parseInt(x))
        var answer = this.ans(intVars)
        try {
            return userAnswer.trim() === answer
        } catch (error) {
            return false;
        }
    }
}

// C sum mod series
const q11 = {
    vars: () => {
        return [getRandomNumber(1000, 3000)]
    },
    text: `
            <div class="col-6">
                Given the following series:<br>
                <div class="my-2 ms-3">
                    0, 1, 2, 3, 0, 1, 2, 3, 0, 1, 2, 3,...<br>
                </div>
                Where term 1 is the first 0, term 2 is the first 1, etc...<br>
                What is the sum of the first {1} terms (including term {1})?
            </div>
            `,
    ans: (vars: number[]) => {
        var i = 0;
        var end = vars[0];
        var sum = 0;
        while (i < end + 1) {
            sum += i % 4;
            i++
        }
        return sum;
    },
    check: function (vars: string, userAnswer?: string): boolean {
        if(!userAnswer) return false;
        var parsedVars = JSON.parse(vars);
        var intVars: number[] = parsedVars.map((x: any) => parseInt(x))
        var answer = this.ans(intVars)
        try {
            return parseInt(userAnswer.trim()) === answer
        } catch (error) {
            return false;
        }
    }
}

// C sum range
const q2 = {
    vars: () => {
        const num1 = getRandomNumber(1000, 2000);
        const num2 = getRandomNumber(num1 + 500, 3000);
        return [num1, num2]
    },
    text: 'What is the sum of all consecutive integers between {1} and {2} (including {1} and {2})?',
    ans: (vars: number[]) => {
        var sum = 0;
        var start = vars[0];
        var total = vars[1] - vars[0] + 1;
        var counter = 0;
        while (counter < total) {
            sum += start;
            start += 1
            counter += 1
        }
        return sum;
    },
    check: function (vars: string, userAnswer?: string): boolean {
        if(!userAnswer) return false;
        var parsedVars = JSON.parse(vars);
        var intVars: number[] = parsedVars.map((x: any) => parseInt(x))
        var answer = this.ans(intVars)
        try {
            return parseInt(userAnswer.trim()) === answer
        } catch (error) {
            return false;
        }
    }
}

// A sum pyramid
const q3 = {
    vars: () => {
        const num1 = getRandomNumber(500, 700);
        return [num1]
    },
    text: `
            <div class="col-8">
                Given the following pattern:<br>
                <div class="my-2 ms-3">
                    1<br>
                    1 &ensp; 2 <br>
                    1 &ensp; 2 &ensp; 3<br>
                    1 &ensp; 2 &ensp; 3 &ensp; 4<br>
                    1 &ensp; 2 &ensp; 3 &ensp; 4 &ensp; 5<br>
                    ...

                </div>
                Where the top line is line 1 and the second line is line 2, etc...<br>
                What is the sum of all the numbers up to line {1} (including line {1})?<br>
                For example, the sum up to line 2 is 4 (1 + (1 + 2)) and the sum up line 3 is 10 (1 + (1 + 2) + (1 + 2 + 3))
            </div>
            `,
    ans: (vars: number[]) => {
        var n = vars[0];
        var sum = 0
        var i = 1
        var j = 1
        while (i <= n) {
            while (j <= i) {
                sum += j
                j ++
            }       
            j = 1
            i ++
        }
        return sum;
    },
    check: function (vars: string, userAnswer?: string): boolean {
        if(!userAnswer) return false;
        var parsedVars = JSON.parse(vars);
        var intVars: number[] = parsedVars.map((x: any) => parseInt(x))
        var answer = this.ans(intVars)
        try {
            return parseInt(userAnswer.trim()) === answer
        } catch (error) {
            return false;
        }
    }
}

// D sum from 1 - n
const q4 = {
    vars: () => {
        const num1 = getRandomNumber(100, 300);
        return [num1]
    },
    text: `What is the sum of all numbers from 1 to {1} (not including {1})?`,
    ans: (vars: number[]) => {
        var n = vars[0];
        var sum = 0
        var i = 1
        while (i < n) {
            sum += i
            i ++
        }
        return sum;
    },
    check: function (vars: string, userAnswer?: string): boolean {
        if(!userAnswer) return false;
        var parsedVars = JSON.parse(vars);
        var intVars: number[] = parsedVars.map((x: any) => parseInt(x))
        var answer = this.ans(intVars)
        try {
            return parseInt(userAnswer.trim()) === answer
        } catch (error) {
            return false;
        }
    }
}

// Plus: sum odd numbers between
const q5: TestQuestion = {
    vars: () => {
        const num1 = getRandomNumber(500, 1000);
        return [num1];
    },
    text: `What is the sum of all odd numbers from 1 to {1} (including {1})?`,
    ans: (vars: number[]) => {
        var n = vars[0];
        var sum = 0;
        var i = 1;
        while (i <= n) {
            sum += i % 2 == 0 ? 0 : i;
            i++;
        }
        return sum;
    },
    check: function (vars: string, userAnswer?: string): boolean {
        if(!userAnswer) return false;
        var parsedVars = JSON.parse(vars);
        var intVars: number[] = parsedVars.map((x: any) => parseInt(x))
        var answer = this.ans(intVars)
        try {
            return parseInt(userAnswer.trim()) === answer
        } catch (error) {
            return false;
        }
    }
}


export default {
    q1,
    q2,
    q3,
    q4,
    q5,
    q11,
}

const getRandomNumber = (min: number, max: number) => {
    return min + Math.floor(Math.random() * (max - min + 1))
}