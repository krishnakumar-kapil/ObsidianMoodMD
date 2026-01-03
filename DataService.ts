import { App, TFile } from "obsidian";

export interface DayData {
    mood: number; // 1-5
    workoutType: string;
    workoutDuration: number; // minutes
    gratitude: string;
}

export class DataService {
    app: App;

    constructor(app: App) {
        this.app = app;
    }

    getTodayFileName(): string {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}.md`;
    }

    async getTodayData(): Promise<DayData> {
        const filename = this.getTodayFileName();
        const file = this.app.vault.getAbstractFileByPath(filename);

        const defaultData: DayData = {
            mood: 3,
            workoutType: "",
            workoutDuration: 0,
            gratitude: ""
        };

        if (!(file instanceof TFile)) {
            return defaultData;
        }

        const cache = this.app.metadataCache.getFileCache(file);
        const frontmatter = cache?.frontmatter;
        
        // Read file content for gratitude
        const content = await this.app.vault.read(file);
        const gratitudeMatch = content.match(/## Gratitude\n([\s\S]*?)(?=\n##|$)/);
        const gratitude = gratitudeMatch ? gratitudeMatch[1].trim() : "";

        return {
            mood: frontmatter?.mood ?? 3,
            workoutType: frontmatter?.workoutType ?? "",
            workoutDuration: frontmatter?.workoutDuration ?? 0,
            gratitude: gratitude
        };
    }

    async saveTodayData(data: DayData): Promise<void> {
        const filename = this.getTodayFileName();
        let file = this.app.vault.getAbstractFileByPath(filename);

        if (!file) {
            file = await this.app.vault.create(filename, "");
        }

        if (file instanceof TFile) {
            // Update Frontmatter
            await this.app.fileManager.processFrontMatter(file, (frontmatter) => {
                frontmatter.mood = data.mood;
                frontmatter.workoutType = data.workoutType;
                frontmatter.workoutDuration = data.workoutDuration;
            });

            // Update Body (Gratitude)
            // We read again to ensure we have the latest content including the frontmatter change
            let content = await this.app.vault.read(file);
            const gratitudeHeader = "## Gratitude";
            const newGratitudeSection = `${gratitudeHeader}\n${data.gratitude}`;

            // Check if ## Gratitude exists
            if (content.includes(gratitudeHeader)) {
                // Regex to find ## Gratitude and replace up to the next heading or end of string
                // Note: This regex assumes ## headers.
                const regex = /## Gratitude\n([\s\S]*?)(?=\n##|$)/;
                if (regex.test(content)) {
                     content = content.replace(regex, newGratitudeSection);
                } else {
                    // Header exists but maybe inline or weird formatting? 
                    // Fallback: replace the header line itself and append?
                    // Simple replace for now
                    content = content.replace(gratitudeHeader, newGratitudeSection);
                }
            } else {
                // Append section to the end
                // Ensure there's a newline before it
                content = content.trimEnd() + "\n\n" + newGratitudeSection;
            }
            
            await this.app.vault.modify(file, content);
        }
    }
}
