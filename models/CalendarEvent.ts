export default interface CourseDate {
    title: string,
    start?: string,
    end?: string,
    url?: string,
    backgroundColor?: string,
    borderColor?: string,
    color?: string,
    textColor?: string
}

/*
    title: 'The Title', 
    start: '2022-08-12',
    end: '2022-08-24',              
    url: 'https://example.com',
    backgroundColor: '#D3D3D3',
    borderColor: '#D3D3D3',
    color: '#D3D3D3',
    textColor: '#000000'

events: [
    {
        title: 'The Title', 
        start: '2022-08-12',
        end: '2022-08-24',              
        url: 'https://docs.google.com/document/d/1m5UIKyugVaPzg8c4NkOeEVku_N_2559RPbbiOU4wkj0/edit?usp=sharing',
        // backgroundColor: '#D3D3D3',
        // borderColor: '#D3D3D3',
        color: '#D3D3D3',
        textColor: '#000000'
    },
    {
        title: 'Two',
        start: '2022-08-20',
        end: '2022-08-30',
        url: 'https://docs.google.com/document/d/1m5UIKyugVaPzg8c4NkOeEVku_N_2559RPbbiOU4wkj0/edit?usp=sharing'
    },
]
*/