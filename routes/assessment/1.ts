const b = {
    vars: () => {
        return [getRandomNumber(50, 100)]
    },
    text: `
            <h2>B Level Question</h2>
            <div class="col-6">
                Given the following series:<br>
                <div class="my-2 d-flex justify-content-center">
                    (1/2), (3/4), (5/8), (7/16), ...<br>
                </div>
                Where (1/2) is term 1, (3/4) is term 2, etc...<br>
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
    }
}

const c = {
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
    }
}

export default {
    b,
    c,
}

const getRandomNumber = (min: number, max: number) => {
    return min + Math.floor(Math.random() * (max - min + 1))
}