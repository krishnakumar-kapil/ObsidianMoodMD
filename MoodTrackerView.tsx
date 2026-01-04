import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { App, TFile } from "obsidian";
import { DataService, DayData } from "./DataService";
import { EMOTIONS } from "./constants";

interface MoodTrackerProps {
  app: App;
  file?: TFile;
  prompts?: string[];
}

export const MoodTrackerView = ({ app, file, prompts }: MoodTrackerProps) => {
  const [data, setData] = useState<DayData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Use a ref to track if the current data needs saving
  const dirtyRef = useRef(false);
  // Use a ref to access latest data in timeout without dependency issues
  const dataRef = useRef<DayData | null>(null);

  const dataService = useMemo(() => new DataService(app), [app]);

  // Pick a random prompt once on mount
  const placeholder = useMemo(() => {
      if (!prompts || prompts.length === 0) return "What are you grateful for?";
      const filtered = prompts.filter(p => p.trim().length > 0);
      if (filtered.length === 0) return "What are you grateful for?";
      return filtered[Math.floor(Math.random() * filtered.length)];
  }, [prompts]);

  useEffect(() => {
    loadData();
  }, [file]);

  // Keep ref in sync
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  // Debounced Save Effect
  useEffect(() => {
    if (!dirtyRef.current || !data) return;

    const timer = setTimeout(async () => {
      setSaving(true);
      if (dataRef.current) {
        await dataService.saveTodayData(dataRef.current, file);
      }
      setSaving(false);
      dirtyRef.current = false;
    }, 1000); // 1 second debounce

    return () => clearTimeout(timer);
  }, [data, file, dataService]);

  const loadData = async () => {
    setLoading(true);
    const dayData = await dataService.getTodayData(file);
    setData(dayData);
    dirtyRef.current = false; // Reset dirty flag on load
    setLoading(false);
  };

  const updateData = (newData: DayData) => {
    setData(newData);
    dirtyRef.current = true;
  };

  const toggleEmotion = (emotionId: string) => {
      if (!data) return;
      const current = data.emotions || [];
      const newEmotions = current.includes(emotionId)
        ? current.filter(e => e !== emotionId)
        : [...current, emotionId];
      
      updateData({ ...data, emotions: newEmotions });
  };

  const updateMood = (val: number) => {
      if(!data) return;
      updateData({ ...data, mood: val });
  };

  if (loading || !data) {
    return <div className="loading-spinner">Loading...</div>;
  }

  return (
    <div className="mood-tracker-container">
      {/* Mood Slider Card */}
      <div className="card mood-card">
        <div className="card-header">
            <h2>Mood</h2>
            <span className="mood-value">{data.mood}/10</span>
        </div>
        <div className="slider-container">
            <input 
                type="range" 
                min="1" 
                max="10" 
                step="1"
                value={data.mood}
                onChange={(e) => updateMood(parseInt(e.target.value))}
                className="mood-slider"
                style={{
                    background: `linear-gradient(to right, #ff4d4d 0%, #ffcc00 50%, #4cd964 100%)`
                }}
            />
            <div className="slider-labels">
                <span>Very Unpleasant</span>
                <span>Pleasant</span>
            </div>
        </div>
      </div>

      {/* Emotions Card */}
      <div className="card emotions-card">
        <h2>How do you feel?</h2>
        <div className="emotions-grid">
            {EMOTIONS.map(e => (
                <button
                    key={e.id}
                    className={`emotion-chip ${e.type} ${data.emotions.includes(e.id) ? 'selected' : ''}`}
                    onClick={() => toggleEmotion(e.id)}
                >
                    {e.label}
                </button>
            ))}
        </div>
      </div>

      {/* Gratitude Card */}
      <div className="card gratitude-card">
        <h2>Gratitude</h2>
        <textarea
          placeholder={placeholder}
          value={data.gratitude}
          onChange={(e) => updateData({ ...data, gratitude: e.target.value })}
          rows={2}
        />
      </div>
      
      <div className="status-bar">
          {dirtyRef.current ? <span className="saving">Unsaved changes...</span> : <span className="saved">Saved</span>}
          {saving && <span className="saving" style={{marginLeft: '10px'}}>(Syncing)</span>}
      </div>
    </div>
  );
};