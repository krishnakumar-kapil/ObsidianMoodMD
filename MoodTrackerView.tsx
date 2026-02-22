import React, { useState, useEffect, useRef, useMemo } from "react";
import { App, TFile } from "obsidian";
import { DataService, DayData, MoodTrackerSettings } from "./DataService";
import { EMOTION_WHEEL, EMOTIONS } from "./constants";

interface MoodTrackerProps {
  app: App;
  file?: TFile;
  settings: MoodTrackerSettings;
}

const TrendsView = ({ app, settings, dataService }: { app: App, settings: MoodTrackerSettings, dataService: DataService }) => {
    const [history, setHistory] = useState<{date: string, data: DayData}[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        dataService.getHistory(settings, 7).then(h => {
            setHistory(h);
            setLoading(false);
        });
    }, [settings, dataService]);

    if (loading) return <div className="loading-spinner">Loading trends...</div>;
    if (history.length === 0) return <div className="no-data">No data for the last 7 days.</div>;

    const renderLineChart = (sliderId: string, name: string, color: string) => {
        const points = history.map((h, i) => {
            const val = h.data.sliders[sliderId] || 5;
            const x = (i / (history.length - 1)) * 100;
            const y = 100 - (val / 10) * 100;
            return `${x},${y}`;
        }).join(' ');

        return (
            <div key={sliderId} className="trend-chart-container">
                <h3>{name}</h3>
                <div className="svg-wrapper">
                    <svg viewBox="0 0 100 100" preserveAspectRatio="none">
                        <polyline
                            fill="none"
                            stroke="var(--interactive-accent)"
                            strokeWidth="2"
                            points={points}
                        />
                    </svg>
                </div>
                <div className="chart-labels">
                    {history.map(h => (
                        <span key={h.date}>{h.date.split('-').slice(2)}</span>
                    ))}
                </div>
            </div>
        );
    };

    // Aggregate emotions
    const emotionCounts: Record<string, number> = {};
    history.forEach(h => {
        h.data.emotions.forEach(e => {
            emotionCounts[e] = (emotionCounts[e] || 0) + 1;
        });
    });

    const allEmotionsFromSettings = settings.emotionWheel.reduce((acc, curr) => {
        acc.push(curr);
        if (curr.subEmotions) acc.push(...curr.subEmotions);
        return acc;
    }, [] as any[]);

    const sortedEmotions = Object.entries(emotionCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5);

    return (
        <div className="trends-view">
            <div className="card trends-card">
                <h2>Slider Trends (Last 7 Days)</h2>
                {settings.sliders.map(s => renderLineChart(s.id, s.name, s.color))}
            </div>

            <div className="card trends-card">
                <h2>Common Emotions</h2>
                <div className="emotions-frequency">
                    {sortedEmotions.map(([id, count]) => {
                        const emotion = allEmotionsFromSettings.find(e => e.id === id);
                        return (
                            <div key={id} className="emotion-freq-row">
                                <span className="emotion-label">{emotion?.label || id}</span>
                                <div className="freq-bar-wrapper">
                                    <div 
                                        className="freq-bar" 
                                        style={{ width: `${(count / history.length) * 100}%` }}
                                    ></div>
                                </div>
                                <span className="freq-count">{count}</span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export const MoodTrackerView = ({ app, file, settings }: MoodTrackerProps) => {
  const [viewMode, setViewMode] = useState<'log' | 'trends'>('log');
  const [data, setData] = useState<DayData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedEmotion, setExpandedEmotion] = useState<string | null>(null);
  
  const dirtyRef = useRef(false);
  const dataRef = useRef<DayData | null>(null);

  const dataService = useMemo(() => new DataService(app), [app]);

  const getRandomPrompt = (promptsStr: string) => {
    const prompts = promptsStr.split('\n').filter(p => p.trim().length > 0);
    if (prompts.length === 0) return "Write something...";
    return prompts[Math.floor(Math.random() * prompts.length)];
  };

  const placeholders = useMemo(() => {
    const p: Record<string, string> = {};
    settings.textBlocks.forEach(block => {
        p[block.id] = getRandomPrompt(block.prompts);
    });
    return p;
  }, [settings]);

  useEffect(() => {
    void loadData();
  }, [file, settings]);

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  useEffect(() => {
    if (!dirtyRef.current || !data) return;

    const timer = setTimeout(() => {
      if (dataRef.current) {
        setSaving(true);
        dataService.saveTodayData(dataRef.current, settings, file)
          .then(() => {
            setSaving(false);
            dirtyRef.current = false;
          })
          .catch((err) => {
            console.error("Failed to save mood data:", err);
            setSaving(false);
          });
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [data, file, dataService, settings]);

  const loadData = async () => {
    setLoading(true);
    try {
      const dayData = await dataService.getTodayData(settings, file);
      setData(dayData);
      dirtyRef.current = false;
    } catch (err) {
      console.error("Failed to load mood data:", err);
    } finally {
      setLoading(false);
    }
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

  const updateSlider = (id: string, val: number) => {
      if(!data) return;
      updateData({ 
        ...data, 
        sliders: { ...data.sliders, [id]: val } 
      });
  };

  const updateTextBlock = (id: string, val: string) => {
    if(!data) return;
    updateData({ 
      ...data, 
      textBlocks: { ...data.textBlocks, [id]: val } 
    });
  };

  if (loading || !data) {
    return <div className="loading-spinner">Loading...</div>;
  }

  return (
    <div className="mood-tracker-container">
      <div className="view-switcher">
          <button 
            className={viewMode === 'log' ? 'active' : ''} 
            onClick={() => setViewMode('log')}
          >
              Log
          </button>
          <button 
            className={viewMode === 'trends' ? 'active' : ''} 
            onClick={() => setViewMode('trends')}
          >
              Trends
          </button>
      </div>

      {viewMode === 'trends' ? (
          <TrendsView app={app} settings={settings} dataService={dataService} />
      ) : (
          <>
            {settings.sliders.map(slider => (
                <div key={slider.id} className="card mood-card">
                    <div className="card-header">
                        <h2>{slider.name}</h2>
                        <span className="mood-value">{data.sliders[slider.id] || 5}/10</span>
                    </div>
                    <div className="slider-container">
                        <input 
                            type="range" 
                            min="1" 
                            max="10" 
                            step="1"
                            value={data.sliders[slider.id] || 5}
                            onChange={(e) => updateSlider(slider.id, parseInt(e.target.value))}
                            className="mood-slider"
                            style={{
                                background: slider.color
                            }}
                        />
                        <div className="slider-labels">
                            <span>{slider.minLabel}</span>
                            <span>{slider.maxLabel}</span>
                        </div>
                    </div>
                </div>
            ))}

            <div className="card emotions-card">
                <h2>How do you feel?</h2>
                <div className={settings.emotionViewMode === 'grid' ? 'emotions-grid-layout' : 'emotions-compact-layout'}>
                    {settings.emotionWheel.map(parent => (
                        <div key={parent.id} className="emotion-row-group">
                            <button
                                className={`emotion-chip parent ${parent.type} ${data.emotions.includes(parent.id) ? 'selected' : ''} ${expandedEmotion === parent.id ? 'expanded' : ''}`}
                                onClick={() => {
                                    toggleEmotion(parent.id);
                                    if (settings.emotionViewMode === 'compact') {
                                        setExpandedEmotion(expandedEmotion === parent.id ? null : parent.id);
                                    }
                                }}
                            >
                                {parent.label}
                            </button>
                            
                            {(settings.emotionViewMode === 'grid' || expandedEmotion === parent.id) && parent.subEmotions && (
                                <>
                                    {parent.subEmotions.map(sub => (
                                        <button
                                            key={sub.id}
                                            className={`emotion-chip sub ${sub.type} ${data.emotions.includes(sub.id) ? 'selected' : ''}`}
                                            onClick={() => toggleEmotion(sub.id)}
                                        >
                                            {sub.label}
                                        </button>
                                    ))}
                                </>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {settings.textBlocks.map(block => (
                <div key={block.id} className="card gratitude-card">
                    <h2>{block.name}</h2>
                    <textarea
                        placeholder={placeholders[block.id]}
                        value={data.textBlocks[block.id] || ""}
                        onChange={(e) => updateTextBlock(block.id, e.target.value)}
                        rows={2}
                    />
                </div>
            ))}
          </>
      )}
      
      <div className="status-bar">
          {dirtyRef.current ? <span className="saving">Unsaved changes...</span> : <span className="saved">Saved</span>}
          {saving && <span className="saving" style={{marginLeft: '10px'}}>(Syncing)</span>}
      </div>
    </div>
  );
};