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
        label: "Happy",
        type: "positive",
        subEmotions: [
            { id: "content", label: "Content", type: "positive" },
            { id: "accepted", label: "Accepted", type: "positive" },
            { id: "peaceful", label: "Peaceful", type: "positive" },
            { id: "aroused", label: "Aroused", type: "positive" },
            { id: "free", label: "Free", type: "positive" },
            { id: "curious", label: "Curious", type: "positive" },
            { id: "confident", label: "Confident", type: "positive" },
            { id: "valued", label: "Valued", type: "positive" },
            { id: "courageous", label: "Courageous", type: "positive" },
            { id: "intimate", label: "Intimate", type: "positive" },
            { id: "hopeful", label: "Hopeful", type: "positive" },
        ]
    },
    {
        id: "sadness",
        label: "Sad",
        type: "negative",
        subEmotions: [
            { id: "lonely", label: "Lonely", type: "negative" },
            { id: "vulnerable", label: "Vulnerable", type: "negative" },
            { id: "guilty", label: "Guilty", type: "negative" },
            { id: "hurt", label: "Hurt", type: "negative" },
            { id: "embarassed_sad", label: "Embarassed", type: "negative" },
            { id: "disappointed_sad", label: "Disappointed", type: "negative" },
            { id: "ashamed", label: "Ashamed", type: "negative" },
        ]
    },
    {
        id: "anger",
        label: "Angry",
        type: "negative",
        subEmotions: [
            { id: "humiliated", label: "Humiliated", type: "negative" },
            { id: "aggressive", label: "Aggressive", type: "negative" },
            { id: "distant", label: "Distant", type: "negative" },
            { id: "resentful", label: "Resentful", type: "negative" },
            { id: "disrespected", label: "Disrespected", type: "negative" },
            { id: "furious", label: "Furious", type: "negative" },
            { id: "jealous", label: "Jealous", type: "negative" },
            { id: "provoked", label: "Provoked", type: "negative" },
            { id: "numb", label: "Numb", type: "negative" },
        ]
    },
    {
        id: "fear",
        label: "Fearful",
        type: "negative",
        subEmotions: [
            { id: "insecure", label: "Insecure", type: "negative" },
            { id: "rejected", label: "Rejected", type: "negative" },
            { id: "threatened", label: "Threatened", type: "negative" },
            { id: "helpless", label: "Helpless", type: "negative" },
            { id: "overwhelmed", label: "Overwhelmed", type: "negative" },
            { id: "worried", label: "Worried", type: "negative" },
            { id: "worthless", label: "Worthless", type: "negative" },
        ]
    },
    {
        id: "disgust",
        label: "Disgusted",
        type: "negative",
        subEmotions: [
            { id: "disappointed_disgust", label: "Disappointed", type: "negative" },
            { id: "judgemental", label: "Judgemental", type: "negative" },
            { id: "embarassed_disgust", label: "Embarassed", type: "negative" },
            { id: "hesitant", label: "Hesitant", type: "negative" },
        ]
    },
    {
        id: "surprise",
        label: "Surprised",
        type: "neutral",
        subEmotions: [
            { id: "confused", label: "Confused", type: "neutral" },
            { id: "startled", label: "Startled", type: "neutral" },
            { id: "energetic", label: "Energetic", type: "neutral" },
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
