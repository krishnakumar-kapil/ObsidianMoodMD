export interface Emotion {
    id: string;
    label: string;
    type: "positive" | "negative" | "neutral" | "joy" | "sadness" | "anger" | "fear" | "disgust" | "surprise" | "power";
    need?: string;
    subEmotions?: Emotion[];
}

export const EMOTION_WHEEL: Emotion[] = [
    {
        id: "joy",
        label: "Happy",
        type: "joy",
        subEmotions: [
            { id: "content", label: "Content", type: "joy" },
            { id: "accepted", label: "Accepted", type: "joy" },
            { id: "peaceful", label: "Peaceful", type: "joy" },
            { id: "aroused", label: "Aroused", type: "joy" },
            { id: "free", label: "Free", type: "joy" },
            { id: "curious", label: "Curious", type: "joy" },
            { id: "confident", label: "Confident", type: "joy" },
            { id: "valued", label: "Valued", type: "joy" },
            { id: "courageous", label: "Courageous", type: "joy" },
            { id: "intimate", label: "Intimate", type: "joy" },
            { id: "hopeful", label: "Hopeful", type: "joy" },
        ]
    },
    {
        id: "sadness",
        label: "Sad",
        type: "sadness",
        subEmotions: [
            { id: "lonely", label: "Lonely", type: "sadness" },
            { id: "vulnerable", label: "Vulnerable", type: "sadness" },
            { id: "guilty", label: "Guilty", type: "sadness" },
            { id: "hurt", label: "Hurt", type: "sadness" },
            { id: "embarrassed", label: "Embarrassed", type: "sadness" },
            { id: "disappointed", label: "Disappointed", type: "sadness" },
            { id: "ashamed", label: "Ashamed", type: "sadness" },
        ]
    },
    {
        id: "anger",
        label: "Angry",
        type: "anger",
        subEmotions: [
            { id: "humiliated", label: "Humiliated", type: "anger" },
            { id: "aggressive", label: "Aggressive", type: "anger" },
            { id: "distant", label: "Distant", type: "anger" },
            { id: "resentful", label: "Resentful", type: "anger" },
            { id: "disrespected", label: "Disrespected", type: "anger" },
            { id: "furious", label: "Furious", type: "anger" },
            { id: "jealous", label: "Jealous", type: "anger" },
            { id: "provoked", label: "Provoked", type: "anger" },
            { id: "numb", label: "Numb", type: "anger" },
        ]
    },
    {
        id: "fear",
        label: "Fearful",
        type: "fear",
        subEmotions: [
            { id: "insecure", label: "Insecure", type: "fear" },
            { id: "rejected", label: "Rejected", type: "fear" },
            { id: "threatened", label: "Threatened", type: "fear" },
            { id: "helpless", label: "Helpless", type: "fear" },
            { id: "overwhelmed", label: "Overwhelmed", type: "fear" },
            { id: "worried", label: "Worried", type: "fear" },
            { id: "worthless", label: "Worthless", type: "fear" },
        ]
    },
    {
        id: "disgust",
        label: "Disgusted",
        type: "disgust",
        subEmotions: [
            { id: "judgemental", label: "Judgemental", type: "disgust" },
            { id: "hesitant", label: "Hesitant", type: "disgust" },
        ]
    },
    {
        id: "surprise",
        label: "Surprised",
        type: "surprise",
        subEmotions: [
            { id: "confused", label: "Confused", type: "surprise" },
            { id: "startled", label: "Startled", type: "surprise" },
            { id: "energetic", label: "Energetic", type: "surprise" },
        ]
    },
    {
        id: "power",
        label: "Powerful",
        type: "power",
        subEmotions: [
            { id: "focused", label: "Focused", type: "power" },
        ]
    }
];

export const EMOTIONS = EMOTION_WHEEL.reduce((acc, curr) => {
    acc.push({ id: curr.id, label: curr.label, type: curr.type });
    if (curr.subEmotions) {
        curr.subEmotions.forEach(sub => acc.push({ id: sub.id, label: sub.label, type: sub.type }));
    }
    return acc;
}, [] as { id: string, label: string, type: string }[]);
