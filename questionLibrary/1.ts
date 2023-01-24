const q1 = {
    vars: () => {
        return [1]
    },
    text: `
            <div class="col-6">
                Test
            </div>
            `,
    ans: (vars: number[]) => {
        return 1;
    }
}

const q2 = {
    vars: () => {
        return [1,2]
    },
    text: 'Test 2',
    ans: (vars: number[]) => {
        return 2;
    }
}

const q3 = {
    vars: () => {
        return [3]
    },
    text: `
            <div class="col-8">
                Test 3
            </div>
            `,
    ans: (vars: number[]) => {
        return 3;
    }
}

const q4 = {
    vars: () => {
        return [4]
    },
    text: `Test 4`,
    ans: (vars: number[]) => {
        return 4;
    }
}


export default {
    q1,
    q2,
    q3,
    q4,
}