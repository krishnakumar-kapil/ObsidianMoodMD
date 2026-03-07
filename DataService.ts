import { App, TFile } from "obsidian";

export interface SliderConfig {
	id: string;
	name: string;
	minLabel: string;
	maxLabel: string;
	color: string;
	defaultValue: number;
	reversed: boolean;
	max: number;
}

export interface TextBlockConfig {
	id: string;
	name: string;
	prompts: string;
}

export interface Emotion {
    id: string;
    label: string;
    type: "positive" | "negative" | "neutral" | "joy" | "sadness" | "anger" | "fear" | "disgust" | "surprise" | "power";
    need?: string;
    subEmotions?: Emotion[];
}

export interface MoodTrackerSettings {
	sliders: SliderConfig[];
	textBlocks: TextBlockConfig[];
	emotionViewMode: 'compact' | 'grid';
	emotionWheel: Emotion[];
}

export interface DayData {
    sliders: Record<string, number>;
    emotions: string[];
    textBlocks: Record<string, string>;
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

    async getTodayData(settings: MoodTrackerSettings, file?: TFile): Promise<DayData> {
        const targetFile = file ?? this.app.vault.getAbstractFileByPath(this.getTodayFileName());

        const defaultData: DayData = {
            sliders: {},
            emotions: [],
            textBlocks: {}
        };

        // Initialize with default values from settings
        settings.sliders.forEach(s => defaultData.sliders[s.id] = s.defaultValue ?? 5);
        settings.textBlocks.forEach(t => defaultData.textBlocks[t.id] = "");

        if (!(targetFile instanceof TFile)) {
            return defaultData;
        }

        const content = await this.app.vault.read(targetFile);
        return this.parseLogSection(content, settings) || defaultData;
    }

    parseLogSection(content: string, settings: MoodTrackerSettings): DayData | null {
        const sectionRegex = /## Daily Log\s*\n([\s\S]*?)(?=\n##|$)/i;
        const match = content.match(sectionRegex);
        if (!match) return null;

        const sectionContent = match[1];
        const data: DayData = {
            sliders: {},
            emotions: [],
            textBlocks: {}
        };

        // Parse sliders
        settings.sliders.forEach(slider => {
            const regex = new RegExp(`\\*\\*${slider.name}\\*\\*:\\s*(\\d+(\\.\\d+)?)`);
            const m = sectionContent.match(regex);
            data.sliders[slider.id] = m ? parseFloat(m[1]) : 5;
        });

        // Backward compatibility for old "Mood"
        if (!data.sliders['mood'] && sectionContent.match(/\*\*Mood\*\*:\s*(\d+(\.\d+)?)/)) {
            const m = sectionContent.match(/\*\*Mood\*\*:\s*(\d+(\.\d+)?)/);
            if (m) data.sliders['mood'] = parseFloat(m[1]);
        }

        // Parse emotions
        const emotionsMatch = sectionContent.match(/\*\*Emotions\*\*:\s*(.*)/);
        if (emotionsMatch) {
            data.emotions = emotionsMatch[1].split(',')
                .map(s => s.trim().replace(/^#/, ''))
                .filter(s => s.length > 0);
        }

        // Parse text blocks
        settings.textBlocks.forEach(block => {
            const regex = new RegExp(`\\*\\*${block.name}\\*\\*:\\s*([\\s\\S]*?)(?=\\n- \\*\\*|$)`);
            const m = sectionContent.match(regex);
            data.textBlocks[block.id] = m ? m[1].trim() : "";
        });

        // Backward compatibility for old "Gratitude"
        if (!data.textBlocks['gratitude'] && sectionContent.match(/\*\*Gratitude\*\*:\s*([\s\S]*?)(?=\n- \*\*|$)/)) {
            const m = sectionContent.match(/\*\*Gratitude\*\*:\s*([\s\S]*?)(?=\n- \*\*|$)/);
            if (m) data.textBlocks['gratitude'] = m[1].trim();
        }

        return data;
    }

    async saveTodayData(data: DayData, settings: MoodTrackerSettings, file?: TFile): Promise<void> {
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
        
        let newSection = `${logHeader}\n`;
        
        // Sliders
        settings.sliders.forEach(slider => {
            newSection += `- **${slider.name}**: ${data.sliders[slider.id] || 5}\n`;
        });

        // Emotions
        const emotionsString = data.emotions.map(e => `#${e}`).join(', ');
        newSection += `- **Emotions**: ${emotionsString}\n`;

        // Text blocks
        settings.textBlocks.forEach(block => {
            newSection += `- **${block.name}**: ${data.textBlocks[block.id] || ""}\n`;
        });

        if (content.includes(logHeader)) {
            const regex = /## Daily Log\s*\n([\s\S]*?)(?=\n##|$)/i;
             if (regex.test(content)) {
                 content = content.replace(regex, newSection.trim());
            } else {
                content = content.replace(logHeader, newSection.trim());
            }
        } else {
            content = content.trimEnd() + "\n\n" + newSection.trim();
        }

        await this.app.vault.modify(targetFile, content);
    }

    async getHistory(settings: MoodTrackerSettings, days: number = 30): Promise<{date: string, data: DayData}[]> {
        const files = this.app.vault.getMarkdownFiles();
        const history: {date: string, data: DayData}[] = [];
        
        // Sort files by name (date) descending
        files.sort((a, b) => b.name.localeCompare(a.name));
        
        // We only care about files that look like YYYY-MM-DD.md
        const dateRegex = /^\d{4}-\d{2}-\d{2}/;
        const targetFiles = files.filter(f => dateRegex.test(f.name)).slice(0, days);

        for (const file of targetFiles) {
            const content = await this.app.vault.read(file);
            const dayData = this.parseLogSection(content, settings);
            if (dayData) {
                history.push({
                    date: file.name.replace('.md', ''),
                    data: dayData
                });
            }
        }

        return history.reverse(); // Return in chronological order
    }
}