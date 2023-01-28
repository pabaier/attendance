export default interface TestQuestion {
    vars(): any[],
    text: string,
    ans(vars: any[]): any,
    check(vars: string, userAnswer?: string): boolean,
}