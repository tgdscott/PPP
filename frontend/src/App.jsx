import React, { useState, useEffect } from 'react';
import { PlusCircle, Trash2, ArrowUp, ArrowDown, Wand2, FileAudio, Music, Save } from 'lucide-react';

// --- Helper: Generate a unique ID ---
const generateUUID = () => crypto.randomUUID();

// --- Main App Component ---
export default function App() {
  const [templateName, setTemplateName] = useState('My Weekly Podcast Template');
  const [segments, setSegments] = useState([
    { id: generateUUID(), segment_type: 'intro', source: { source_type: 'static', filename: 'intro_music.mp3' } },
    { id: generateUUID(), segment_type: 'content', source: { source_type: 'static', filename: 'placeholder.mp3' } },
    { id: generateUUID(), segment_type: 'outro', source: { source_type: 'ai_generated', prompt: 'Summarize the episode and thank the listeners for tuning in.', voice_id: '19B4gjtpL5m876wS3Dfg' } },
  ]);
  const [musicRules, setMusicRules] = useState([
    { id: generateUUID(), music_filename: 'background_ambient.mp3', apply_to_segments: ['intro', 'outro'], start_offset_s: 3, end_offset_s: 3, fade_in_s: 2, fade_out_s: 5, volume_db: -18 },
  ]);
  const [isSaving, setIsSaving] = useState(false);
  const [showNotification, setShowNotification] = useState(false);

  const addSegment = (type) => {
    const newSegment = {
      id: generateUUID(),
      segment_type: type,
      source: type === 'content' 
        ? { source_type: 'static', filename: 'placeholder.mp3' }
        : { source_type: 'static', filename: '' },
    };
    setSegments([...segments, newSegment]);
  };

  const updateSegment = (id, updatedSegment) => {
    setSegments(segments.map(seg => (seg.id === id ? { ...seg, ...updatedSegment } : seg)));
  };

  const removeSegment = (id) => {
    if (segments.find(s => s.id === id)?.segment_type === 'content') {
      alert("The main 'content' segment cannot be removed.");
      return;
    }
    setSegments(segments.filter(seg => seg.id !== id));
  };

  const moveSegment = (index, direction) => {
    const newSegments = [...segments];
    const [movedSegment] = newSegments.splice(index, 1);
    newSegments.splice(index + direction, 0, movedSegment);
    setSegments(newSegments);
  };
  
  const addMusicRule = () => {
    const newRule = { id: generateUUID(), music_filename: '', apply_to_segments: ['content'], start_offset_s: 0, end_offset_s: 0, fade_in_s: 3, fade_out_s: 5, volume_db: -15 };
    setMusicRules([...musicRules, newRule]);
  };

  const updateMusicRule = (id, updatedRule) => {
    setMusicRules(musicRules.map(rule => (rule.id === id ? { ...rule, ...updatedRule } : rule)));
  };
  
  const removeMusicRule = (id) => {
    setMusicRules(musicRules.filter(rule => rule.id !== id));
  };
  
  const handleSave = () => {
    setIsSaving(true);
    const finalTemplate = {
      user_id: generateUUID(), // Placeholder
      name: templateName,
      segments: segments.map(({ id, ...rest }) => rest), // Remove temporary frontend ID
      background_music_rules: musicRules.map(({ id, ...rest }) => rest),
    };
    
    console.log("--- SAVING TEMPLATE ---");
    console.log(JSON.stringify(finalTemplate, null, 2));
    
    setTimeout(() => {
      setIsSaving(false);
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
    }, 1500);
  };

  return (
    <div className="bg-slate-900 min-h-screen text-white font-sans p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-100">Template Editor</h1>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-all duration-300"
          >
            {isSaving ? 'Saving...' : <><Save size={18} /> Save Template</>}
          </button>
        </div>

        {/* Template Name */}
        <div className="bg-slate-800 rounded-xl p-6 mb-8 shadow-lg">
          <label htmlFor="templateName" className="block text-sm font-medium text-slate-400 mb-2">TEMPLATE NAME</label>
          <input
            id="templateName"
            type="text"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            className="w-full bg-slate-700 text-slate-100 text-xl p-3 rounded-md border border-slate-600 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
            placeholder="e.g., Weekly Interview Show"
          />
        </div>

        {/* Segments Section */}
        <Section title="Podcast Segments" icon={<FileAudio />}>
          <div className="space-y-4">
            {segments.map((segment, index) => (
              <SegmentEditor
                key={segment.id}
                segment={segment}
                onUpdate={updateSegment}
                onRemove={removeSegment}
                onMove={moveSegment}
                index={index}
                totalSegments={segments.length}
              />
            ))}
          </div>
          <div className="mt-6 flex gap-4">
            <button onClick={() => addSegment('intro')} className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-slate-300 font-semibold py-2 px-4 rounded-lg transition-colors">
              <PlusCircle size={18} /> Add Intro
            </button>
            <button onClick={() => addSegment('outro')} className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-slate-300 font-semibold py-2 px-4 rounded-lg transition-colors">
              <PlusCircle size={18} /> Add Outro
            </button>
          </div>
        </Section>
        
        {/* Background Music Section */}
        <Section title="Background Music Rules" icon={<Music />}>
            <div className="space-y-4">
                {musicRules.map(rule => (
                    <MusicRuleEditor 
                        key={rule.id}
                        rule={rule}
                        onUpdate={updateMusicRule}
                        onRemove={removeMusicRule}
                    />
                ))}
            </div>
            <div className="mt-6">
                 <button onClick={addMusicRule} className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-slate-300 font-semibold py-2 px-4 rounded-lg transition-colors">
                    <PlusCircle size={18} /> Add Music Rule
                </button>
            </div>
        </Section>
      </div>
      
      {/* Save Notification */}
      <div className={`fixed bottom-8 right-8 bg-green-500 text-white py-3 px-6 rounded-lg shadow-xl transition-transform duration-300 ${showNotification ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
        Template saved to console!
      </div>
    </div>
  );
}

// --- UI Components ---
const Section = ({ title, icon, children }) => (
  <div className="bg-slate-800 rounded-xl p-6 mb-8 shadow-lg">
    <h2 className="text-2xl font-bold text-slate-200 mb-6 flex items-center gap-3">
      {React.cloneElement(icon, { size: 24, className: "text-indigo-400"})}
      {title}
    </h2>
    {children}
  </div>
);

const SegmentEditor = ({ segment, onUpdate, onRemove, onMove, index, totalSegments }) => {
  const isContent = segment.segment_type === 'content';

  const handleSourceTypeChange = (e) => {
    const newSourceType = e.target.value;
    const newSource = newSourceType === 'static'
      ? { source_type: 'static', filename: '' }
      : { source_type: 'ai_generated', prompt: '', voice_id: '19B4gjtpL5m876wS3Dfg' };
    onUpdate(segment.id, { ...segment, source: newSource });
  };

  const handleSourceFieldChange = (field, value) => {
    onUpdate(segment.id, { ...segment, source: { ...segment.source, [field]: value } });
  };
  
  return (
    <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-700 transition-shadow hover:shadow-indigo-500/10">
      <div className="flex items-start gap-4">
        {/* Move Controls */}
        <div className="flex flex-col items-center gap-1 pt-1">
          <button onClick={() => onMove(index, -1)} disabled={index === 0 || isContent} className="text-slate-400 hover:text-white disabled:text-slate-600 disabled:cursor-not-allowed transition-colors">
            <ArrowUp size={20} />
          </button>
          <span className="font-mono text-indigo-400 text-lg">{index + 1}</span>
          <button onClick={() => onMove(index, 1)} disabled={index === totalSegments - 1 || isContent} className="text-slate-400 hover:text-white disabled:text-slate-600 disabled:cursor-not-allowed transition-colors">
            <ArrowDown size={20} />
          </button>
        </div>
        
        {/* Main Editor */}
        <div className="flex-grow">
          <div className="flex justify-between items-center mb-4">
            <span className="text-lg font-bold capitalize text-slate-200">{segment.segment_type}</span>
            {!isContent && (
              <button onClick={() => onRemove(segment.id)} className="text-rose-400 hover:text-rose-300 transition-colors">
                <Trash2 size={18} />
              </button>
            )}
          </div>
          
          {isContent ? (
            <p className="text-slate-400 italic">This is a placeholder for your main episode recording.</p>
          ) : (
            <div className="space-y-4">
              {/* Source Type Selector */}
              <div className="flex items-center gap-4">
                 <label className="text-slate-400 font-medium">Source:</label>
                 <select value={segment.source.source_type} onChange={handleSourceTypeChange} className="bg-slate-600 rounded-md p-2 border border-slate-500 focus:ring-indigo-500">
                    <option value="static">Static File</option>
                    <option value="ai_generated">AI Generated</option>
                 </select>
              </div>

              {/* Conditional Source Fields */}
              {segment.source.source_type === 'static' ? (
                <div className="flex items-center gap-2">
                    <FileAudio size={18} className="text-slate-400" />
                    <input 
                        type="text" 
                        value={segment.source.filename}
                        onChange={(e) => handleSourceFieldChange('filename', e.target.value)}
                        placeholder="e.g., intro_theme.mp3"
                        className="w-full bg-slate-600 p-2 rounded-md border border-slate-500 placeholder-slate-400"
                    />
                </div>
              ) : (
                <div className="space-y-2">
                   <div className="flex items-center gap-2">
                        <Wand2 size={18} className="text-slate-400" />
                        <input 
                            type="text" 
                            value={segment.source.prompt}
                            onChange={(e) => handleSourceFieldChange('prompt', e.target.value)}
                            placeholder="AI Prompt for script generation..."
                            className="w-full bg-slate-600 p-2 rounded-md border border-slate-500 placeholder-slate-400"
                        />
                    </div>
                     <div className="flex items-center gap-2 pl-7">
                        <input 
                            type="text" 
                            value={segment.source.voice_id}
                            onChange={(e) => handleSourceFieldChange('voice_id', e.target.value)}
                            placeholder="ElevenLabs Voice ID"
                            className="w-full bg-slate-800 text-xs p-1 rounded-md border border-slate-600 placeholder-slate-500"
                        />
                    </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const MusicRuleEditor = ({ rule, onUpdate, onRemove }) => {
    const handleCheckboxChange = (segmentType) => {
        const currentSegments = rule.apply_to_segments;
        const newSegments = currentSegments.includes(segmentType)
            ? currentSegments.filter(s => s !== segmentType)
            : [...currentSegments, segmentType];
        onUpdate(rule.id, { ...rule, apply_to_segments: newSegments });
    };

    return (
        <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-700">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-slate-300">Music Rule</h3>
                <button onClick={() => onRemove(rule.id)} className="text-rose-400 hover:text-rose-300">
                    <Trash2 size={18} />
                </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Left Column */}
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Music File</label>
                        <input 
                            type="text" 
                            value={rule.music_filename}
                            onChange={(e) => onUpdate(rule.id, { ...rule, music_filename: e.target.value })}
                            placeholder="e.g., background_music.mp3"
                            className="w-full bg-slate-600 p-2 rounded-md border border-slate-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">Apply to Segments</label>
                        <div className="flex gap-4">
                            {['intro', 'content', 'outro'].map(segType => (
                                <label key={segType} className="flex items-center gap-2 text-slate-300">
                                    <input 
                                        type="checkbox" 
                                        checked={rule.apply_to_segments.includes(segType)}
                                        onChange={() => handleCheckboxChange(segType)}
                                        className="h-4 w-4 rounded bg-slate-600 border-slate-500 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <span className="capitalize">{segType}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>
                {/* Right Column */}
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-2">
                        <NumberInput label="Start Offset (s)" value={rule.start_offset_s} onChange={v => onUpdate(rule.id, {...rule, start_offset_s: v})} />
                        <NumberInput label="End Offset (s)" value={rule.end_offset_s} onChange={v => onUpdate(rule.id, {...rule, end_offset_s: v})} />
                    </div>
                     <div className="grid grid-cols-2 gap-2">
                        <NumberInput label="Fade In (s)" value={rule.fade_in_s} onChange={v => onUpdate(rule.id, {...rule, fade_in_s: v})} />
                        <NumberInput label="Fade Out (s)" value={rule.fade_out_s} onChange={v => onUpdate(rule.id, {...rule, fade_out_s: v})} />
                    </div>
                </div>
            </div>
             <div className="mt-4">
                <label htmlFor={`vol-${rule.id}`} className="block text-sm font-medium text-slate-400">Volume ({rule.volume_db} dB)</label>
                <input 
                    id={`vol-${rule.id}`}
                    type="range" 
                    min="-40" max="0" 
                    value={rule.volume_db}
                    onChange={e => onUpdate(rule.id, {...rule, volume_db: parseInt(e.target.value)})}
                    className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer"
                />
            </div>
        </div>
    );
};

const NumberInput = ({ label, value, onChange }) => (
    <div>
        <label className="block text-sm font-medium text-slate-400 mb-1">{label}</label>
        <input 
            type="number"
            value={value}
            onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
            className="w-full bg-slate-600 p-2 rounded-md border border-slate-500"
        />
    </div>
);