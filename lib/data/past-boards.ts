// Executive and junior e-boards from before CQG moved to calendar-year executive
// boards and Internal Membership (Fall 2024). Each board covers one academic
// year; `year` is the calendar year it started in. A person with no `linkedin`
// has no profile we could find, so they show as a plain, non-clickable name.
export interface PastPerson {
    name: string;
    tag?: string;
    linkedin?: string;
}

export interface PastBoard {
    /** Header, e.g. "AY 2022–2023". The page adds "Executive Board" / "Junior E-Board". */
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
            { name: "Michelle Lu", tag: "VP / Treasurer", linkedin: li("michelle-lu-1b60541ab") },
            { name: "Zach Geddes", linkedin: li("zgeddes") },
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
            { name: "Thomas Tran", tag: "Co-President · Head of Education", linkedin: li("thomas-tran-2022") },
            { name: "Collin Wang", tag: "Co-President · Research", linkedin: li("collin-w-056029103") },
            { name: "Mikhaela Diaz", tag: "Co-President", linkedin: li("mikhaeladiaz") },
            { name: "Joseph O'Connor", tag: "Co-President · Head of Research", linkedin: li("joseph-o-connor") },
            { name: "Yang Hsu", tag: "Events", linkedin: li("yang-hsu-1a3b1719a") },
            { name: "Zach Geddes", tag: "Events", linkedin: li("zgeddes") },
            { name: "Jesse Zhong", tag: "Events", linkedin: li("jessezhong") },
            { name: "Lauren Lee", tag: "Social Media · Funding", linkedin: li("lauren-l-572842191") },
            { name: "Michelle Lu", tag: "Funding", linkedin: li("michelle-lu-1b60541ab") },
            { name: "Thomas Chen", tag: "Tech", linkedin: li("thomas-s-chen") },
            { name: "Berkley Fang", tag: "Education", linkedin: li("berkleyfang") },
            { name: "Manvir Bhandal", tag: "Education", linkedin: li("manvirbhandal") },
            { name: "Eduardo Liam Santa Cruz", tag: "Research", linkedin: li("eduardo-liam-santa-cruz-8a9101191") },
            { name: "Kevin Jiang", tag: "Research", linkedin: li("kevinfjiang") },
            { name: "Anthony Ma", tag: "Research", linkedin: li("anthony-ma-50b56b1b5") },
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
            { name: "Collin Wang", tag: "President (Spring 2021)", linkedin: li("collin-w-056029103") },
            { name: "Thomas Tran", tag: "President (Spring 2021)", linkedin: li("thomas-tran-2022") },
            { name: "Mikhaela Diaz", tag: "President (Spring 2021)", linkedin: li("mikhaeladiaz") },
        ],
        junior: [
            { name: "Lauren Lee", tag: "Fall 2020 Jr · Spring 2021 Funding", linkedin: li("lauren-l-572842191") },
            { name: "Manvir Bhandal", tag: "Fall 2020 Jr · Spring 2021 Education", linkedin: li("manvirbhandal") },
            { name: "Michelle Lu", tag: "Fall 2020 Jr · Spring 2021 Funding", linkedin: li("michelle-lu-1b60541ab") },
            { name: "Yang Hsu", tag: "Fall 2020 Jr · Spring 2021 Events", linkedin: li("yang-hsu-1a3b1719a") },
            { name: "Berkley Fang", tag: "Fall 2020 Jr · Spring 2021 Events", linkedin: li("berkleyfang") },
            { name: "Zach Geddes", tag: "Fall 2020 Jr · Spring 2021 Events", linkedin: li("zgeddes") },
            { name: "Jeffrey Huang", tag: "Fall 2020 Jr · Spring 2021 Events", linkedin: li("jeffrey-huang2131") },
            { name: "Thomas Chen", tag: "Fall 2020 Jr · Spring 2021 Tech", linkedin: li("thomas-s-chen") },
            { name: "Kevin Jiang", tag: "Fall 2020 Jr · Spring 2021 Research", linkedin: li("kevinfjiang") },
            { name: "Eduardo Liam Santa Cruz", tag: "Fall 2020 Jr · Spring 2021 Research", linkedin: li("eduardo-liam-santa-cruz-8a9101191") },
            { name: "Jesse Zhong", tag: "Fall 2020 Jr · Spring 2021 Education", linkedin: li("jessezhong") },
        ],
    },
    {
        label: "AY 2019–2020",
        year: 2019,
        exec: [
            { name: "Gleb Vizitiv", tag: "Co-President", linkedin: li("gleb-vizitiv-208916140") },
            { name: "Oliver Jin Wang", tag: "Co-President", linkedin: li("oliver-wang-455904168") },
            { name: "Joseph O'Connor", tag: "VP · Co-President (Spring 2020)", linkedin: li("joseph-o-connor") },
            { name: "Jack Briody", tag: "VP · Co-President (Spring 2020)", linkedin: li("jack-briody-463816149") },
            { name: "Nicolae Lari", tag: "VP", linkedin: li("nicolae-lari") },
            { name: "Mikaela Zhang", tag: "VP", linkedin: li("mikaela-zhang") },
            { name: "Sian Lee Kitt", tag: "VP · Co-President (Spring 2020)", linkedin: li("sian-lee-kitt-35a311163") },
            { name: "Rodolfo Raimundo", tag: "VP", linkedin: li("rodolfo-raimundo") },
            { name: "Thomas Chadrycki", tag: "VP · Education Co-Head", linkedin: li("thomas-chadryck") },
            { name: "Felipe Grabowsky", tag: "VP", linkedin: li("felipe-marujo-grabowsky-9bab09145") },
            { name: "Connor Goggins", tag: "Treasurer", linkedin: li("cgoggins") },
            { name: "Frank Ruta", tag: "Research Co-Head", linkedin: li("flruta") },
            { name: "Eric Yuan", tag: "Research Co-Head", linkedin: li("eric-nyc") },
            { name: "Nico Winata", tag: "Education Co-Head", linkedin: li("nicowinata") },
        ],
        junior: [
            { name: "Mikhaela Diaz", tag: "Social Media", linkedin: li("mikhaeladiaz") },
            { name: "Victoria (Yiran) Zhou", tag: "Marketing / Branding", linkedin: li("z-yiran") },
            { name: "HJ Hong", tag: "Campus Outreach", linkedin: li("hj-hong") },
            { name: "Sara (Yiyang) Zhou", tag: "Funding", linkedin: li("yiyangzhou") },
            { name: "Hui Lu", tag: "Events" },
            { name: "Jerry Zhang", tag: "Events" },
            { name: "Eilam Lehrman", tag: "Tech / Website", linkedin: li("eilam-lehrman-92566b17b") },
            { name: "Alex Wang", tag: "Research", linkedin: li("alex-wang-04166a103") },
            { name: "Michael Grandel", tag: "Research", linkedin: li("michaelgrandel7") },
            { name: "Collin Wang", tag: "Research", linkedin: li("collin-w-056029103") },
            { name: "Eric Wu", tag: "Education", linkedin: li("eric-j-wu") },
            { name: "Thomas Tran", tag: "Education", linkedin: li("thomas-tran-2022") },
        ],
    },
];
