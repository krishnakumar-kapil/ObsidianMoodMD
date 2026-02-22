export interface Emotion {
    id: string;
    label: string;
    type: "positive" | "negative" | "neutral";
    need?: string;
    subEmotions?: Emotion[];
}

export const EMOTION_WHEEL: Emotion[] = [
    {
        id: "joy",
        label: "Joyful",
        type: "positive",
        need: "Connection",
        subEmotions: [
            { id: "happy", label: "Happy", type: "positive", need: "Connection" },
            { id: "excited", label: "Excited", type: "positive", need: "Stimulation" },
            { id: "grateful", label: "Grateful", type: "positive", need: "Appreciation" },
            { id: "relaxed", label: "Relaxed", type: "positive", need: "Rest" },
            { id: "proud", label: "Proud", type: "positive", need: "Recognition" },
        ]
    },
    {
        id: "sadness",
        label: "Sad",
        type: "negative",
        need: "Compassion",
        subEmotions: [
            { id: "lonely", label: "Lonely", type: "negative", need: "Connection" },
            { id: "hurt", label: "Hurt", type: "negative", need: "Safety" },
            { id: "disappointed", label: "Disappointed", type: "negative", need: "Understanding" },
            { id: "bored", label: "Bored", type: "negative", need: "Purpose" },
        ]
    },
    {
        id: "anger",
        label: "Angry",
        type: "negative",
        need: "Respect",
        subEmotions: [
            { id: "frustrated", label: "Frustrated", type: "negative", need: "Autonomy" },
            { id: "annoyed", label: "Annoyed", type: "negative", need: "Space" },
            { id: "resentful", label: "Resentful", type: "negative", need: "Justice" },
        ]
    },
    {
        id: "fear",
        label: "Fearful",
        type: "negative",
        need: "Safety",
        subEmotions: [
            { id: "anxious", label: "Anxious", type: "negative", need: "Certainty" },
            { id: "overwhelmed", label: "Overwhelmed", type: "negative", need: "Support" },
            { id: "confused", label: "Confused", type: "negative", need: "Clarity" },
        ]
    },
    {
        id: "power",
        label: "Powerful",
        type: "positive",
        need: "Competence",
        subEmotions: [
            { id: "confident", label: "Confident", type: "positive", need: "Competence" },
            { id: "focused", label: "Focused", type: "positive", need: "Achievement" },
            { id: "energetic", label: "Energetic", type: "positive", need: "Vitality" },
        ]
    }
];

// Flat list for backward compatibility and easy lookup
export const EMOTIONS = EMOTION_WHEEL.reduce((acc, curr) => {
    acc.push({ id: curr.id, label: curr.label, type: curr.type });
    if (curr.subEmotions) {
        curr.subEmotions.forEach(sub => acc.push({ id: sub.id, label: sub.label, type: sub.type }));
    }
    return acc;
}, [] as { id: string, label: string, type: string }[]);
