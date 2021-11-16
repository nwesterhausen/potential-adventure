export class Dwarf {    
    filename: string;
    Name: string = "";
    TranslatedName: string = "";
    Profession: string = "";
    Arrival: string = "";
    Dieties: string[] = [];
    Birthday: string = "";
    Dream: string = "";
    Quote: string = "";
    filecontent: string[] = [];
    MemberOf: string[] = [];
    PassingAcquaintance: string[] = [];
    Friends: string[] = [];
    Lovers: string[] = [];
    Pets: string[] = [];

    constructor(name: string) {
        this.filename = `${name}.md`;
    }

    generateHeader(): string {
        return `---
Name: ${this.Name}
TranslatedName: ${this.TranslatedName}
Profession: ${this.Profession}  
Arrival: ${this.Arrival}
Birthday: ${this.Birthday}
Portrait:
JoinedAt: 
Lovers: ${JSON.stringify(this.Lovers)}
Spouses: []
KindredSpirits: []
CloseFriends: []
Friends: ${JSON.stringify(this.Friends)}
FriendlyTerms: []
LongtermAcquaintance: []
PassingAcquaintance: ${JSON.stringify(this.PassingAcquaintance)}
Grudges: []
MemberOf: ${JSON.stringify(this.MemberOf)}
Dream: ${this.Dream}
Deities: ${JSON.stringify(this.Dieties)}
Pets: ${JSON.stringify(this.Pets)}
Quote: ${this.Quote}
---\n`
    }

    toMarkdown(): string {
        let fullContent = [this.generateHeader()].concat(this.filecontent);
        return fullContent.join("\n");
    }
}