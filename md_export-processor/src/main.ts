import { group } from 'console';
import fs from 'fs';
import path from 'path';
import * as readline from 'readline';
import * as readlineSync from 'readline-sync';
import {Dwarf} from './Dwarf';
const colors = require("colors/safe")

/// SETTINGS
const IN = "md_export.md";
const DATE = getDate();
const DEST = `dwarves-${DATE}`;
const OUT = path.join(process.cwd(), DEST);

/// REGEX
const DWARF_HEADER_CAPTURE = new RegExp(/###   (?<firstname>\S+) (?<lastname>\S+), "\S+ (?<trname>\S+)", (?<profession>.+)/);
const DWARF_QUOTE_CAPTURE = new RegExp(/^(?<quote>".+")/);
const DWARF_ARRIVAL_CAPTURE = new RegExp(/(She|He|They) arrived at (?<fort>.+) on the (?<day>\d+)(nd|rd|th|st) of (?<month>\S+) in the year (?<year>\d+)/);
const DWARF_MEMBERSHIP_CAPTURE = new RegExp(/a member of (?<membership>[^.]+)./g);
const DWARF_BIRTHDAY_CAPTURE = new RegExp(/born on the (?<day>\d+)(nd|rd|th|st) of (?<month>\S+) in the year (?<year>\d+)/);
const DWARF_DREAM_CAPTURE = new RegExp(/dreams of (?<dream>[^.]+)./);
const RELATIONSHIP_WORSHIP_CAPTURE = new RegExp(/Worship: "(?<name>.+)"/);
const RELATIONSHIP_ACQUAINTANCE_CAPTURE = new RegExp(/AcquaintancePassing: "(?<name>.+)"/);
const RELATIONSHIP_FRIEND_CAPTURE = new RegExp(/Friend: "(?<name>.+)"/);
const RELATIONSHIP_LOVER_CAPTURE = new RegExp(/Lover: "(?<name>.+)"/);
const RELATIONSHIP_PET_CAPTURE = new RegExp(/Pet: "(?<name>.+)"/);

const MONTH = [
    "Granite",
    "Slate",
    "Felsite",
    "Hematite",
    "Malachite",
    "Galena",
    "Limestone",
    "Sandstone",
    "Timber",
    "Moonstone",
    "Opal",
    "Obsidian",
]


// 2nd of Timber in the year 700
function transformDateToIso(day: string, month: string, year: string): string {
    return transformDateString(`${year}-${MONTH.indexOf(month)+1}-${day}`);
}

function transformIsoToLongDate(date: string) {
    /// YYYY - MM - DD
    let darr = date.split("-");
    let day = parseInt(darr[2]);
    switch (day) {
        case 1:
        case 21:
            darr[2] = `${day}st`;
            break;
        case 2:
        case 22:
            darr[2] = `${day}nd`;
            break;
        case 3:
        case 23:
            darr[2] = `${day}rd`; 
            break;
        default:
            darr[2] = `${day}th`; 
    }
    return `${darr[2]} of ${MONTH[parseInt(darr[1])-1]} in the year ${parseInt(darr[0])}`;
}

function transformDateString(date: string) {
    let darr = date.split('-');
    while (darr[0].length < 4) {
        darr[0] = "0" + darr[0];
    }
    while (darr.length < 3) {
        darr.push("0");
    }
    while (darr[1].length < 2) {
        darr[1] = "0" + darr[1];
    }
    if (darr[1] === "00") {
        darr[1] = "01";
    }
    while (darr[2].length < 2) {
        darr[2] = "0" + darr[2];
    }
    if (darr[2] === "00") {
        darr[2] = "01";
    }
    let pdate = darr.join("-");
    return pdate;
}

function getDate(): string {
    let date = readlineSync.question(`What is the in-game date for this export (YYYY-MM-DD)?`);
    return transformDateString(date);
}

function transformStrTitleCase(str: string): string {
    return str.replace(
        /\w\S*/g,
        function (txt) {
            return txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase();
        }
    );
}

function generateInfoJson(deities: string[], groups: string[]) {
    return `{
    "tags": ["dwarf"],
    "permalink": false,
    "date": "${DATE}",
    "deities": ${JSON.stringify(deities)},
    "groups": ${JSON.stringify(groups)}
}`
}

console.log("Parsed date: " + colors.green(DATE) + ", " + colors.magenta(transformIsoToLongDate(DATE)));

if (!fs.existsSync(OUT))
{
    fs.mkdirSync(OUT);
} else {
    console.log(colors.bgRed("Out directory already exists and will get clobbered!"))
    if (!readlineSync.keyInYNStrict(colors.red(`Clobber ${DEST}? (y/n)`))) {
        process.exit(1);
    }
}

const READER = readline.createInterface({
    input: fs.createReadStream(IN)
})

let dwarf: Dwarf;
let counter = 0;
let dwarfGroups: string[] = [], deities: string[] = [];
READER.on("line", line => {    
    let capture = line.match(DWARF_HEADER_CAPTURE);
    if (capture && capture.groups) {
        if (dwarf && dwarf.Name !== "") {
            // flush
            fs.writeFileSync(path.join(OUT, dwarf.filename), dwarf.toMarkdown());
            counter ++;
        }
        dwarf = new Dwarf(capture.groups.firstname);
        dwarf.Name = capture.groups.firstname+" "+capture.groups.lastname;
        dwarf.TranslatedName = capture.groups.trname;
        dwarf.Profession = transformStrTitleCase(capture.groups.profession);
        console.log(colors.brightBlue(dwarf.Name) + ", "+colors.yellow(dwarf.Profession));
    }
    if (dwarf && dwarf.Name !== "")
    {
        let cleanLine = line.replace(/ +(?= )/g,'');
        let cap = cleanLine.match(DWARF_ARRIVAL_CAPTURE);
        if (cap && cap.groups) {
            dwarf.Arrival = transformDateToIso(cap.groups.day, cap.groups.month, cap.groups.year)
        }
        cap = cleanLine.match(DWARF_BIRTHDAY_CAPTURE);
        if (cap && cap.groups) {
            dwarf.Birthday = transformDateToIso(cap.groups.day, cap.groups.month, cap.groups.year)
        }
        cap = cleanLine.match(DWARF_QUOTE_CAPTURE);
        if (cap && cap.groups) {
            dwarf.Quote = cap.groups.quote;
        }
        cap = cleanLine.match(DWARF_DREAM_CAPTURE);
        if (cap && cap.groups) {
            dwarf.Dream = cap.groups.dream;
        }
        cap = cleanLine.match(RELATIONSHIP_WORSHIP_CAPTURE);
        if (cap && cap.groups) {
            dwarf.Dieties.push(cap.groups.name);
            if (deities.indexOf(cap.groups.name) == -1) {
                deities.push(cap.groups.name);
            }
        }
        cap = cleanLine.match(RELATIONSHIP_ACQUAINTANCE_CAPTURE);
        if (cap && cap.groups) {
            dwarf.PassingAcquaintance.push(cap.groups.name);
        }
        cap = cleanLine.match(RELATIONSHIP_FRIEND_CAPTURE);
        if (cap && cap.groups) {
            dwarf.Friends.push(cap.groups.name);
        }
        cap = cleanLine.match(RELATIONSHIP_LOVER_CAPTURE);
        if (cap && cap.groups) {
            dwarf.Lovers.push(cap.groups.name);
        }
        cap = cleanLine.match(RELATIONSHIP_PET_CAPTURE);
        if (cap && cap.groups) {
            dwarf.Pets.push(cap.groups.name);
        }
        let gcap = cleanLine.matchAll(DWARF_MEMBERSHIP_CAPTURE);
        let gcaparr = Array.from(gcap, m => m[1]);
        if (gcaparr.length) {
            for (const match of gcaparr) {
              dwarf.MemberOf.push(match.trim())
              if (dwarfGroups.indexOf(match.trim()) == -1) {
                dwarfGroups.push(match.trim());
              }
            }
        }
        dwarf.filecontent.push(cleanLine);
    }
})

READER.on("close", () => {
    console.log("Processed "+colors.cyan(counter)+" dwarves.")
    console.log(deities.length + colors.green(" worshipped deities."))
    console.log(dwarfGroups.length + colors.green(" separate groups (govt/religion/guild)."))
    fs.writeFileSync(path.join(OUT, `${DEST}.json`), generateInfoJson(deities, dwarfGroups));
})