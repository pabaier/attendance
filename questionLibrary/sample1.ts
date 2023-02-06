import { TestQuestion } from "../models";

// sequence
const q6: TestQuestion = {
    vars: () => {
        return [getRandomNumber(100, 200)]
    },
    text: `
            <div class="col-6">
                Given the following series:<br>
                <div class="my-2 ms-3 lead">
                    (3&frasl;3), (4&frasl;6), (5&frasl;9), (6&frasl;12), ...<br>
                </div>
                Where (3&frasl;3) is term 1, (4&frasl;6) is term 2, etc...<br>
                What is term {1} as a fraction (write your answer in the format a/b)?
            </div>
            `,
    ans: (vars: number[]) => {
        var start = 1;
        var total = vars[0];
        var num = 3;
        var den = 3;
        while (start < total) {
            start += 1;
            num += 1;
            den += 3
        }
        return `${num.toString()}/${den.toString()}`;
    },

    check: function(vars, userAnswer): boolean {
        if(!userAnswer) return false;
        var parsedVars = JSON.parse(vars);
        var intVars: number[] = parsedVars.map((x: any) => parseInt(x))
        var answer = this.ans(intVars)
        try {
            var parsedUserAnswer = userAnswer.trim().split('/').map((x) => parseInt(x.trim()))
            var parsedAnswer = answer.split('/').map((x: string) => parseInt(x))
            return parsedUserAnswer[0] === parsedAnswer[0] && parsedUserAnswer[1] === parsedAnswer[1];
        } catch {
            return false;
        }
    },
}

// interest
const q7: TestQuestion = {
    vars: () => {
        const initBalance = getRandomNumber(1000, 2000);
        const years = getRandomNumber(40, 70);
        const apr = getRandomNumber(2, 20);
        return [initBalance, years, apr]
    },
    text: `
        You work for a big bank on the accounts team. You are assigned the task
        of developing a program that projects how much money will be in a client's account
        after a certain number of years, taking into consideration a yearly interest. All accounts
        get a yearly interest based on an annual percentage rate (APR) of the balance in their account.
        For one year of interest, the new balance is calculated by multiplying the existing balance
        by one plus the APR (as a decimal). For example, after one year, the balance of an account with
        and initial balance of $100 and a 5% APR would be $105 (100 * (1 + .05)).
        <br>
        Given an initial balance of {1}, what is the account balance after {2} years and an APR of {3}%?`,

    ans: (vars: number[]) => {
        const initBalance = vars[0]
        const years = vars[1]
        const apr = 1 + (vars[2] / 100)
        var count = 0;
        var balance = initBalance;
        while (count < years) {
            balance = balance * apr
            count++
        }
        return balance;
    },

    check: function (vars: string, userAnswer?: string): boolean {
        if(!userAnswer) return false;
        var parsedVars = JSON.parse(vars);
        var intVars = parsedVars.map((x: any) => parseInt(x))
        var answer = this.ans(intVars)
        try {
            var userAnswerParse = parseFloat(userAnswer);
            var res = Math.abs(userAnswerParse - answer) < 0.01
            return Math.abs(userAnswerParse - answer) < 0.01
        } catch (error) {
            return false;
        }
    }
}

// factorial
const q8: TestQuestion = {
    vars: () => {
        const num1 = getRandomNumber(20, 25);
        return [num1]
    },
    text: `
            <div class="col-8">
            The factorial of an integer n, denoted by n!, is the product of all positive integers less than or equal to n.<br>
            For example, 3! = 3 * 2 * 1<br>
            Compute {1}! 
            </div>
            `,
    ans: (vars: number[]) => {
        var n = vars[0];
        var fact = BigInt(1)
        var i = 1
        while (i <= n) {
            fact = fact * BigInt(i)
            i += 1
        }
        return fact;
    },

    check: function (vars, userAnswer) {
        if(!userAnswer) return false;
        var num = JSON.parse(vars)
        var ans = this.ans(num)
        try {
            return ans === BigInt(userAnswer.trim());
        } catch (error) {
            return false;
        }
    },
}

// multiplication loop
const q9: TestQuestion = {
    vars: () => {
        const num1 = getRandomNumber(100, 300);
        const num2 = getRandomNumber(100, 300);
        return [num1, num2]
    },
    text: `
        Multiplication is repetative adding. For example, 3 * 7 is 3 + 3 + 3 +,... seven times.<br>
        Using a for loop, calculate the product of {1} * {2}.
    `,
    ans: (vars: number[]) => {
        var n = vars[0];
        var sum = 0
        var i = 1
        while (i <= n) {
            sum += i
            i ++
        }
        return sum;
    },
    check: function (vars, userAnswer) {
        if(!userAnswer) return false;
        var nums = JSON.parse(vars);
        try {
            return parseInt(userAnswer.trim()) === nums[0] * nums[1]
        } catch (error) {
            return false;
        }
    },
}

// find the average of all numbers in given range - plus 1
const q10: TestQuestion = {
    vars: () => {
        const num1 = getRandomNumber(100, 300);
        const num2 = getRandomNumber(num1 + 1, 500);
        return [num1, num2];
    },
    text: `What is the average of all numbers from {1} to {2} (including {1} but excluding {2})?`,
    ans: (vars: number[]) => {
        var total = vars[1] - vars[0];
        var sum = 0
        var i = 0
        while (i < total) {
            sum += vars[0] + i
            i ++
        }
        return sum / total;
    },
    check: function (vars, userAnswer) {
        if(!userAnswer) return false;
        var inputs = JSON.parse(vars);
        var answer = this.ans(inputs);
        try {
            return answer === parseFloat(userAnswer.trim())
        } catch (error) {
            return false;
        }
    },
}

export default {
    q6, q7, q8, q9, q10
}

const getRandomNumber = (min: number, max: number) => {
    return min + Math.floor(Math.random() * (max - min + 1))
}