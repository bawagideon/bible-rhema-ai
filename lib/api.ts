import { SermonData } from '@/components/studio/sermon-builder';

export interface SavedSermon {
    id: string;
    title: string;
    content_json: SermonData;
    created_at: string;
}

export async function saveSermon(sermon: SermonData): Promise<{ success: boolean; data?: any; error?: any }> {
    try {
        const response = await fetch('/api/sermons', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(sermon),
        });

        const result = await response.json();
        return result;
    } catch (error) {
        console.error("Error saving sermon:", error);
        return { success: false, error };
    }
}

export async function fetchSermons(): Promise<{ success: boolean; data?: SavedSermon[]; error?: any }> {
    try {
        const response = await fetch('/api/sermons');
        const result = await response.json();
        return result;
    } catch (error) {
        console.error("Error fetching sermons:", error);
        return { success: false, error, data: [] };
    }
}

export async function generateSermonContent(topic: string, context: string[] = [], userSources: string[] = []): Promise<{ success: boolean; content: string }> {
    try {
        const response = await fetch('/api/studio/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                title: topic,
                scripture: context[0] || "2 Corinthians 4:17",
                tone: "Theological",
                context: context.map((c, i) => ({ id: `c-${i}`, label: `Context ${i + 1}`, content: c })),
                notes: userSources.join("\n")
            }),
        });

        const result = await response.json();
        if (result.success && result.content) {
            return { success: true, content: result.content };
        }
        throw new Error(result.error || "Generation returned empty content");
    } catch (error) {
        console.error("AI Generation Error:", error);
        return {
            success: false,
            content: `
            <h2>${topic}</h2>
            <p>Begin with the core scripture passage for this study.</p>
            <blockquote>“The grass withers, the flower fades, but the word of our God will stand forever.” — Isaiah 40:8</blockquote>
            <h3>I. Biblical Foundation</h3>
            <p>Ground your congregation in the timeless truth of God's Word...</p>
            `
        };
    }
}
