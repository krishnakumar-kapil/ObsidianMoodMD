import { App, TFile, MarkdownView } from "obsidian";

export interface DayData {
    mood: number; // 0-10
    emotions: string[];
    gratitude: string;
}

export class DataService {
    app: App;
    // We might need to know *which* file we are in if we are rendering inside a note.
    // For now, we default to "Today", but for a code block, we should probably prefer the current active file
    // if it matches the context. However, for a "Daily Tracker", targeting today's daily note is standard.
    // Let's stick to "Today's Note" logic for consistency, or allow passing a file.
    
    constructor(app: App) {
        this.app = app;
    }

    getTodayFileName(): string {
        // This is a simple implementation. In a real plugin, we might check Daily Notes settings.
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}.md`;
    }

    async getTodayData(file?: TFile): Promise<DayData> {
        const targetFile = file ?? this.app.vault.getAbstractFileByPath(this.getTodayFileName());

        const defaultData: DayData = {
            mood: 5,
            emotions: [],
            gratitude: ""
        };

        if (!(targetFile instanceof TFile)) {
            return defaultData;
        }

        const content = await this.app.vault.read(targetFile);
        return this.parseLogSection(content) || defaultData;
    }

    parseLogSection(content: string): DayData | null {
        const logHeader = "## Daily Log";
        if (!content.includes(logHeader)) return null;

        // Extract the section
        const sectionRegex = /## Daily Log\n([\s\S]*?)(?=\n##|$)/;
        const match = content.match(sectionRegex);
        if (!match) return null;

        const sectionContent = match[1];
        
        // Parse individual lines
        // Expected format:
        // - **Mood**: 7
        // - **Emotions**: #Happy, #Tired
        // - **Workout**: Running (30 mins)
        // - **Gratitude**: Text...

                const moodMatch = sectionContent.match(/\*\*Mood\*\*:\s*(\d+(\.\d+)?)/);
                const emotionsMatch = sectionContent.match(/\*\*Emotions\*\*:\s*(.*)/);
                const gratitudeMatch = sectionContent.match(/\*\*Gratitude\*\*:\s*([\s\S]*?)(?=\n- \*\*|$)/); 
                
                // Helper for emotions: "#Tag, #Tag"
                let emotions: string[] = [];
                if (emotionsMatch) {
                    emotions = emotionsMatch[1].split(',')
                        .map(s => s.trim().replace(/^#/, ''))
                        .filter(s => s.length > 0);
                }
        
                let gratitude = "";
                if (gratitudeMatch) {
                    gratitude = gratitudeMatch[1].trim();
                }
        
                return {
                    mood: moodMatch ? parseFloat(moodMatch[1]) : 5,
                    emotions: emotions,
                    gratitude: gratitude
                };    }

    async saveTodayData(data: DayData, file?: TFile): Promise<void> {
        let targetFile = file;
        
        if (!targetFile) {
             const filename = this.getTodayFileName();
             const abstractFile = this.app.vault.getAbstractFileByPath(filename);
             if (!abstractFile) {
                 targetFile = await this.app.vault.create(filename, "");
             } else if (abstractFile instanceof TFile) {
                 targetFile = abstractFile;
             }
        }

        if (!targetFile || !(targetFile instanceof TFile)) return;

        let content = await this.app.vault.read(targetFile);
        const logHeader = "## Daily Log";
        
        // Construct the new section
        const emotionsString = data.emotions.map(e => `#${e}`).join(', ');

        const newSection = `${logHeader}
- **Mood**: ${data.mood}
- **Emotions**: ${emotionsString}
- **Gratitude**: ${data.gratitude}
`;

        if (content.includes(logHeader)) {
            const regex = /## Daily Log\n([\s\S]*?)(?=\n##|$)/;
             if (regex.test(content)) {
                 content = content.replace(regex, newSection.trim());
            } else {
                // Fallback replace header
                content = content.replace(logHeader, newSection.trim());
            }
        } else {
            content = content.trimEnd() + "\n\n" + newSection.trim();
        }

        await this.app.vault.modify(targetFile, content);
    }
}