// Executive and junior e-boards from before CQG moved to calendar-year executive
// boards and Internal Membership (Fall 2024). Each board covers one academic
// year; `year` is the calendar year it started in. Executive cards show the person's
// highest title only; junior e-board members are listed by name. A person with no `linkedin`
// has no profile we could find, so they show as a plain, non-clickable name.
export interface PastPerson {
    name: string;
    tag?: string;
    linkedin?: string;
}

export interface PastBoard {
    /** Date heading for the board, e.g. "AY 2022–2023". */
    label: string;
    year: number;
    exec: PastPerson[];
    junior: PastPerson[];
}

const li = (path: string) => `https://www.linkedin.com/in/${path}`;

export const pastBoards: PastBoard[] = [
    {
        label: "AY 2022–2023",
        year: 2022,
        exec: [
            { name: "Yang Hsu", tag: "Co-President", linkedin: li("yang-hsu-1a3b1719a") },
            { name: "Lauren Lee", tag: "Co-President", linkedin: li("lauren-l-572842191") },
            { name: "Berkley Fang", tag: "VP", linkedin: li("berkleyfang") },
            { name: "Michelle Lu", tag: "VP", linkedin: li("michelle-lu-1b60541ab") },
            { name: "Zach Geddes", tag: "Head of Events", linkedin: li("zgeddes") },
        ],
        junior: [
            { name: "William Vietor", linkedin: li("william-vietor") },
            { name: "Karina Dovgodko", linkedin: li("karinadovgodko") },
            { name: "Aryan Jain", linkedin: li("aryanjain3") },
            { name: "Caroline Sun" },
            { name: "Akash Kumar", linkedin: li("akash-kumar-86083022b") },
            { name: "Iman Anwarzai", linkedin: li("ianwarzai") },
            { name: "Chris Chang", linkedin: li("chrischang314") },
        ],
    },
    {
        label: "AY 2021–2022",
        year: 2021,
        exec: [
            { name: "Thomas Tran", tag: "Co-President", linkedin: li("thomas-tran-2022") },
            { name: "Collin Wang", tag: "Co-President", linkedin: li("collin-w-056029103") },
            { name: "Mikhaela Diaz", tag: "Co-President", linkedin: li("mikhaeladiaz") },
            { name: "Joseph O'Connor", tag: "Co-President", linkedin: li("joseph-o-connor") },
            { name: "Yang Hsu", tag: "Co-Head of Events", linkedin: li("yang-hsu-1a3b1719a") },
            { name: "Zach Geddes", tag: "Co-Head of Events", linkedin: li("zgeddes") },
            { name: "Jesse Zhong", tag: "Co-Head of Events", linkedin: li("jessezhong") },
            { name: "Lauren Lee", tag: "Co-Head of Funding", linkedin: li("lauren-l-572842191") },
            { name: "Michelle Lu", tag: "Co-Head of Funding", linkedin: li("michelle-lu-1b60541ab") },
            { name: "Thomas Chen", tag: "Head of Tech", linkedin: li("thomas-s-chen") },
            { name: "Berkley Fang", tag: "Co-Head of Education", linkedin: li("berkleyfang") },
            { name: "Manvir Bhandal", tag: "Co-Head of Education", linkedin: li("manvirbhandal") },
            { name: "Eduardo Liam Santa Cruz", tag: "Co-Head of Research", linkedin: li("eduardo-liam-santa-cruz-8a9101191") },
            { name: "Kevin Jiang", tag: "Co-Head of Research", linkedin: li("kevinfjiang") },
            { name: "Anthony Ma", tag: "Co-Head of Research", linkedin: li("anthony-ma-50b56b1b5") },
        ],
        junior: [
            { name: "Zhaoyang Liu", linkedin: li("zhaoyangliu") },
            { name: "Roshun Sunder", linkedin: li("roshunsunder") },
            { name: "Jialu (Mike) Xu", linkedin: li("jialu-xu-mike") },
            { name: "Alex Chung", linkedin: li("alex-chung7") },
            { name: "Erinn Sun", linkedin: li("erinn-sun") },
            { name: "Caroline Sun" },
            { name: "William Vietor", linkedin: li("william-vietor") },
            { name: "Akash Kumar", linkedin: li("akash-kumar-86083022b") },
            { name: "Chris Chang", linkedin: li("chrischang314") },
            { name: "Karina Dovgodko", linkedin: li("karinadovgodko") },
            { name: "Aryan Jain", linkedin: li("aryanjain3") },
            { name: "Iman Anwarzai", linkedin: li("ianwarzai") },
            { name: "Luyun Lin", linkedin: li("luyun-lin-90a371128") },
        ],
    },
    {
        label: "AY 2020–2021",
        year: 2020,
        exec: [
            { name: "Sian Lee Kitt", tag: "Co-President", linkedin: li("sian-lee-kitt-35a311163") },
            { name: "Jack Briody", tag: "Co-President", linkedin: li("jack-briody-463816149") },
            { name: "Joseph O'Connor", tag: "Co-President", linkedin: li("joseph-o-connor") },
            { name: "Collin Wang", tag: "Co-President", linkedin: li("collin-w-056029103") },
            { name: "Thomas Tran", tag: "Co-President", linkedin: li("thomas-tran-2022") },
            { name: "Mikhaela Diaz", tag: "Co-President", linkedin: li("mikhaeladiaz") },
        ],
        junior: [
            { name: "Lauren Lee", linkedin: li("lauren-l-572842191") },
            { name: "Manvir Bhandal", linkedin: li("manvirbhandal") },
            { name: "Michelle Lu", linkedin: li("michelle-lu-1b60541ab") },
            { name: "Yang Hsu", linkedin: li("yang-hsu-1a3b1719a") },
            { name: "Berkley Fang", linkedin: li("berkleyfang") },
            { name: "Zach Geddes", linkedin: li("zgeddes") },
            { name: "Jeffrey Huang", linkedin: li("jeffrey-huang2131") },
            { name: "Thomas Chen", linkedin: li("thomas-s-chen") },
            { name: "Kevin Jiang", linkedin: li("kevinfjiang") },
            { name: "Eduardo Liam Santa Cruz", linkedin: li("eduardo-liam-santa-cruz-8a9101191") },
            { name: "Jesse Zhong", linkedin: li("jessezhong") },
        ],
    },
    {
        label: "AY 2019–2020",
        year: 2019,
        exec: [
            { name: "Gleb Vizitiv", tag: "Co-President", linkedin: li("gleb-vizitiv-208916140") },
            { name: "Oliver Jin Wang", tag: "Co-President", linkedin: li("oliver-wang-455904168") },
            { name: "Joseph O'Connor", tag: "Co-President", linkedin: li("joseph-o-connor") },
            { name: "Jack Briody", tag: "Co-President", linkedin: li("jack-briody-463816149") },
            { name: "Nicolae Lari", tag: "VP", linkedin: li("nicolae-lari") },
            { name: "Mikaela Zhang", tag: "VP", linkedin: li("mikaela-zhang") },
            { name: "Sian Lee Kitt", tag: "Co-President", linkedin: li("sian-lee-kitt-35a311163") },
            { name: "Rodolfo Raimundo", tag: "VP", linkedin: li("rodolfo-raimundo") },
            { name: "Thomas Chadrycki", tag: "VP", linkedin: li("thomas-chadryck") },
            { name: "Felipe Grabowsky", tag: "VP", linkedin: li("felipe-marujo-grabowsky-9bab09145") },
            { name: "Connor Goggins", tag: "Treasurer", linkedin: li("cgoggins") },
            { name: "Frank Ruta", tag: "Co-Head of Research", linkedin: li("flruta") },
            { name: "Eric Yuan", tag: "Co-Head of Research", linkedin: li("eric-nyc") },
            { name: "Nico Winata", tag: "Head of Education", linkedin: li("nicowinata") },
        ],
        junior: [
            { name: "Mikhaela Diaz", linkedin: li("mikhaeladiaz") },
            { name: "Victoria (Yiran) Zhou", linkedin: li("z-yiran") },
            { name: "HJ Hong", linkedin: li("hj-hong") },
            { name: "Sara (Yiyang) Zhou", linkedin: li("yiyangzhou") },
            { name: "Hui Lu" },
            { name: "Jerry Zhang" },
            { name: "Eilam Lehrman", linkedin: li("eilam-lehrman-92566b17b") },
            { name: "Alex Wang", linkedin: li("alex-wang-04166a103") },
            { name: "Michael Grandel", linkedin: li("michaelgrandel7") },
            { name: "Collin Wang", linkedin: li("collin-w-056029103") },
            { name: "Eric Wu", linkedin: li("eric-j-wu") },
            { name: "Thomas Tran", linkedin: li("thomas-tran-2022") },
        ],
    },
];
