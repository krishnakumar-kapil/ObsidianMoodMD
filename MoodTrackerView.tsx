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
    const [hoveredDay, setHoveredDay] = useState<{date: string, data: DayData} | null>(null);

    useEffect(() => {
        // Fetch 30 days for the trend line
        dataService.getHistory(settings, 30).then(h => {
            setHistory(h);
            setLoading(false);
        });
    }, [settings, dataService]);

    if (loading) return <div className="loading-spinner">Loading analysis...</div>;
    if (history.length === 0) return <div className="no-data">No data recorded yet.</div>;

    const sliderId = settings.sliders[0]?.id || 'mood';
    const sliderConfig = settings.sliders[0];
    const max = sliderConfig?.max || 10;
    
    // history is already oldest -> newest from DataService
    const chronoHistory = history;
    const latestFirstHistory = [...history].reverse();
    
    const recent = latestFirstHistory.slice(0, 7); 
    const previous = latestFirstHistory.length > 7 ? latestFirstHistory.slice(7, 14) : [];

    const calcAvg = (days: {data: DayData}[]) => {
        if (days.length === 0) return 0;
        const sum = days.reduce((acc, curr) => acc + (curr.data.sliders[sliderId] ?? (settings.sliders[0]?.defaultValue ?? 5)), 0);
        return sum / days.length;
    };

    const avgRecent = calcAvg(recent);
    const avgPrev = calcAvg(previous);
    const diff = avgRecent - avgPrev;
    const diffPercent = previous.length > 0 ? ((diff / (avgPrev || 1)) * 100).toFixed(0) : '0';

    const allEmotionsFromSettings = settings.emotionWheel.flatMap(w => w.subEmotions ? [w, ...w.subEmotions] : [w]);

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
    };

    const chartCoords = chronoHistory.map((h, i) => {
        const val = h.data.sliders[sliderId] ?? (sliderConfig?.defaultValue ?? 5);
        const x = (i / Math.max(1, chronoHistory.length - 1)) * 100;
        const y = 100 - (val / max) * 100;
        return { x, y, val, original: h };
    });

    const points = chartCoords.map(c => `${c.x},${c.y}`).join(' ');

    return (
        <div className="trends-dashboard">
            <div className="insight-hero card">
                <div className="insight-stat">
                    <span className="insight-val">{avgRecent.toFixed(1)}<span style={{fontSize: '14px', color: 'var(--text-muted)'}}>/ {max}</span></span>
                    <span className="insight-label">7-Day Avg {settings.sliders[0]?.name || 'Mood'}</span>
                </div>
                {previous.length > 0 && (
                    <div className="insight-trend">
                        <span style={{ color: diff >= 0 ? 'var(--color-green)' : 'var(--color-red)' }}>
                            {diff > 0 ? '↑' : (diff < 0 ? '↓' : '')} {Math.abs(Number(diffPercent))}%
                        </span>
                        <small>vs previous</small>
                    </div>
                )}
            </div>

            <div className="card trend-chart-card">
                <h3 className="timeline-title" style={{borderBottom: 'none', paddingLeft: 0}}>30-Day Trend</h3>
                <div className="trend-chart-layout">
                    <div className="y-axis-labels">
                        <span>{max}</span>
                        <span>{Math.floor(max/2)}</span>
                        <span>0</span>
                    </div>
                    <div className="mini-chart-container" onMouseLeave={() => setHoveredDay(null)}>
                        <svg viewBox="0 -5 100 110" preserveAspectRatio="none" style={{width: '100%', height: '80px', overflow: 'visible'}}>
                            {/* Grid lines */}
                            <line x1="0" y1="0" x2="100" y2="0" stroke="var(--background-modifier-border)" strokeWidth="0.5" strokeDasharray="2,2"/>
                            <line x1="0" y1="50" x2="100" y2="50" stroke="var(--background-modifier-border)" strokeWidth="0.5" strokeDasharray="2,2"/>
                            <line x1="0" y1="100" x2="100" y2="100" stroke="var(--background-modifier-border)" strokeWidth="0.5" strokeDasharray="2,2"/>
                            
                            <polyline
                                fill="none"
                                stroke="var(--interactive-accent)"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                points={points}
                                style={{ opacity: 0.8 }}
                            />
                            {chartCoords.map((c, i) => (
                                <g 
                                    key={i} 
                                    onMouseEnter={() => setHoveredDay(c.original)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    {/* Invisible larger hit area for easier hovering */}
                                    <circle cx={c.x} cy={c.y} r="10" fill="transparent" />
                                    <path 
                                        d={`M ${c.x},${c.y} L ${c.x},${c.y}`} 
                                        stroke={hoveredDay?.date === c.original.date ? "var(--text-accent)" : "var(--interactive-accent)"}
                                        strokeWidth={hoveredDay?.date === c.original.date ? "10" : "6"}
                                        strokeLinecap="round" 
                                        vectorEffect="non-scaling-stroke" 
                                        style={{ transition: 'stroke-width 0.1s ease' }}
                                    />
                                </g>
                            ))}
                        </svg>
                        <div className="chart-endpoints">
                            <span>{chronoHistory[0].date.slice(5)}</span>
                            <span>{chronoHistory[chronoHistory.length-1].date.slice(5)}</span>
                        </div>
                    </div>
                </div>

                {hoveredDay && (
                    <div className="chart-tooltip card">
                        <div className="tooltip-header">
                            <strong>{formatDate(hoveredDay.date)}</strong>
                            <span className="tooltip-score">{hoveredDay.data.sliders[sliderId] ?? sliderConfig?.defaultValue}/{max}</span>
                        </div>
                        {hoveredDay.data.emotions.length > 0 && (
                            <div className="tooltip-emotions">
                                {hoveredDay.data.emotions.map(eId => {
                                    const def = allEmotionsFromSettings.find(w => w.id === eId);
                                    const eType = def?.type || 'neutral';
                                    return <span key={eId} className={`timeline-chip tiny ${eType}`}>{def?.label || eId}</span>
                                })}
                            </div>
                        )}
                        {settings.textBlocks.map(tb => {
                            const text = hoveredDay.data.textBlocks[tb.id];
                            if (!text) return null;
                            return (
                                <div key={tb.id} className="tooltip-text">
                                    <strong>{tb.name}:</strong> {text}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <div className="card timeline-card">
                <h3 className="timeline-title">Recent History</h3>
                <div className="vertical-timeline">
                    {latestFirstHistory.slice(0, 7).map(day => {
                        const val = day.data.sliders[sliderId] ?? (settings.sliders[0]?.defaultValue ?? 5);
                        
                        return (
                            <div key={day.date} className="timeline-day">
                                <div className="timeline-header">
                                    <div className="timeline-date">{formatDate(day.date)}</div>
                                    <div className="timeline-score">{val}/{max}</div>
                                </div>
                                
                                {day.data.emotions.length > 0 && (
                                    <div className="timeline-emotions">
                                        {day.data.emotions.map(eId => {
                                            const def = allEmotionsFromSettings.find(w => w.id === eId);
                                            const eType = def?.type || 'neutral';
                                            return (
                                                <span key={eId} className={`timeline-chip ${eType}`}>
                                                    {def?.label || eId}
                                                </span>
                                            );
                                        })}
                                    </div>
                                )}
                                
                                {settings.textBlocks.map(tb => {
                                    const text = day.data.textBlocks[tb.id];
                                    if (!text) return null;
                                    return (
                                        <div key={tb.id} className="timeline-text">
                                            <strong>{tb.name}:</strong> {text}
                                        </div>
                                    );
                                })}
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
                        <span className="mood-value">{data.sliders[slider.id] ?? slider.defaultValue}/{slider.max || 10}</span>
                    </div>
                    <div className="slider-container">
                        <input 
                            type="range" 
                            min="0" 
                            max={slider.max || 10} 
                            step="1"
                            value={data.sliders[slider.id] ?? slider.defaultValue}
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