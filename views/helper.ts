var ejs = require('ejs');

export const renderFile = ( file: string, options: object ) => {
    var htmlResult = ''
    ejs.renderFile(file, options , function (err: any, html: any) {
        htmlResult = html;
    })

    return htmlResult;
}