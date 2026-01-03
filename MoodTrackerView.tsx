import React, { useState, useEffect, ChangeEvent } from "react";
import { App } from "obsidian";
import { DataService, DayData } from "./DataService";

interface MoodTrackerProps {
  app: App;
}

const MOODS = [
  { value: 1, label: "Awful", emoji: "😫" },
  { value: 2, label: "Bad", emoji: "😔" },
  { value: 3, label: "Okay", emoji: "😐" },
  { value: 4, label: "Good", emoji: "🙂" },
  { value: 5, label: "Great", emoji: "🤩" },
];

export const MoodTrackerView = ({ app }: MoodTrackerProps) => {
  const [data, setData] = useState<DayData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Memoize service if possible, or just create it. 
  // Since App doesn't change, it's fine.
  const dataService = new DataService(app);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const dayData = await dataService.getTodayData();
    setData(dayData);
    setLoading(false);
  };

  const handleSave = async () => {
    if (!data) return;
    setSaving(true);
    await dataService.saveTodayData(data);
    setSaving(false);
  };

  if (loading || !data) {
    return <div className="loading-spinner">Loading...</div>;
  }

  return (
    <div className="mood-tracker-container">
      <header className="header">
        <h1>Today's Tracker</h1>
        <p>{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
      </header>

      <div className="card mood-card">
        <h2>How are you feeling?</h2>
        <div className="mood-selector">
          {MOODS.map((m) => (
            <button
              key={m.value}
              className={`mood-btn ${data.mood === m.value ? "selected" : ""}`}
              onClick={() => setData({ ...data, mood: m.value })}
            >
              <span className="emoji">{m.emoji}</span>
              <span className="label">{m.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="card workout-card">
        <h2>Workout</h2>
        <div className="form-group">
          <label>Activity</label>
          <input
            type="text"
            placeholder="e.g. Running, Yoga"
            value={data.workoutType}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setData({ ...data, workoutType: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label>Duration (min)</label>
          <input
            type="number"
            placeholder="0"
            value={data.workoutDuration || ""}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setData({ ...data, workoutDuration: parseInt(e.target.value) || 0 })}
          />
        </div>
      </div>

      <div className="card gratitude-card">
        <h2>Gratitude Journal</h2>
        <textarea
          placeholder="What are you grateful for today?"
          value={data.gratitude}
          onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setData({ ...data, gratitude: e.target.value })}
          rows={5}
        />
      </div>

      <button className="save-btn" onClick={handleSave} disabled={saving}>
        {saving ? "Saving..." : "Save Entry"}
      </button>
    </div>
  );
};
