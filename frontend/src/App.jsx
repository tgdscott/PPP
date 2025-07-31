import React, { useState, useEffect } from 'react';
import { PlusCircle, Trash2, ArrowUp, ArrowDown, Wand2, FileAudio, Music, Save, Zap, Sparkles, MicOff, Type, Edit, Timer } from 'lucide-react';

// --- Helper: Generate a unique ID ---
const generateUUID = () => crypto.randomUUID();
const API_BASE_URL = 'http://127.0.0.1:8000';

// --- Main App Component ---
export default function App() {
  const [view, setView] = useState('editor');
  const [templates, setTemplates] = useState([]);
  const [currentTemplate, setCurrentTemplate] = useState(null);
  
  const fetchTemplates = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/templates/`);
      if (!response.ok) throw new Error('Failed to fetch templates');
      const data = await response.json();
      setTemplates(data);
      return data;
    } catch (error) {
      console.error("Error fetching templates:", error);
      return [];
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleEditTemplate = (templateId) => {
    const templateToEdit = templates.find(t => t.id === templateId);
    if (templateToEdit) {
      const editableTemplate = {
        ...templateToEdit,
        segments: templateToEdit.segments.map(s => ({ ...s, id: generateUUID() })),
        background_music_rules: templateToEdit.background_music_rules.map(r => ({ ...r, id: generateUUID() })),
      };
      setCurrentTemplate(editableTemplate);
      setView('editor');
    }
  };

  const handleNewTemplate = () => {
    setCurrentTemplate(null);
    setView('editor');
  };

  return (
    <div className="bg-slate-900 min-h-screen text-white font-sans p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <Header currentView={view} setView={setView} onNewTemplate={handleNewTemplate} />
        {view === 'editor' ? 
          <TemplateEditor 
            key={currentTemplate ? currentTemplate.id : 'new'}
            initialTemplate={currentTemplate} 
            onSaveSuccess={fetchTemplates}
          /> : 
          <EpisodeAssembler 
            templates={templates}
            onEditTemplate={handleEditTemplate}
          />}
      </div>
    </div>
  );
}

const Header = ({ currentView, setView, onNewTemplate }) => (
  <div className="flex justify-between items-center mb-8">
    <h1 className="text-3xl sm:text-4xl font-bold text-slate-100">
      {currentView === 'editor' ? 'Template Editor' : 'Episode Workflow'}
    </h1>
    <div className="flex gap-2 p-1 bg-slate-800 rounded-lg">
      <button onClick={onNewTemplate} className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors ${currentView === 'editor' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-700'}`}>
        Editor
      </button>
      <button onClick={() => setView('assembler')} className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors ${currentView === 'assembler' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-700'}`}>
        Assembler
      </button>
    </div>
  </div>
);


// --- Template Editor Component ---
const TemplateEditor = ({ initialTemplate, onSaveSuccess }) => {
  const isEditMode = !!initialTemplate;
  const [templateName, setTemplateName] = useState(initialTemplate?.name || 'New Podcast Template');
  const [segments, setSegments] = useState(initialTemplate?.segments || [
    { id: generateUUID(), segment_type: 'content', source: { source_type: 'static', filename: 'placeholder.mp3' } }
  ]);
  const [musicRules, setMusicRules] = useState(initialTemplate?.background_music_rules || []);
  const [timing, setTiming] = useState(initialTemplate?.timing || { content_start_offset_s: -2.0, outro_start_offset_s: -5.0 });
  
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

  const showTempNotification = (message, type = 'success', duration = 3000) => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), duration);
  };

  const addSegment = (type) => {
    const newSegment = {
      id: generateUUID(),
      segment_type: type,
      source: { source_type: 'static', filename: '' },
    };
    const contentIndex = segments.findIndex(seg => seg.segment_type === 'content');
    const newSegments = [...segments];
    if (type === 'intro' && contentIndex !== -1) {
      newSegments.splice(contentIndex, 0, newSegment);
    } else {
      newSegments.push(newSegment);
    }
    setSegments(newSegments);
  };

  const updateSegment = (id, updatedSegment) => {
    setSegments(segments.map(seg => (seg.id === id ? { ...seg, ...updatedSegment } : seg)));
  };

  const removeSegment = (id) => {
    if (segments.find(s => s.id === id)?.segment_type === 'content') return;
    setSegments(segments.filter(seg => seg.id !== id));
  };

  const moveSegment = (index, direction) => {
    if (segments[index + direction]?.segment_type === 'content' || segments[index]?.segment_type === 'content') return;
    const newSegments = [...segments];
    const [movedSegment] = newSegments.splice(index, 1);
    newSegments.splice(index + direction, 0, movedSegment);
    setSegments(newSegments);
  };
  
  const addMusicRule = () => {
    setMusicRules([...musicRules, { id: generateUUID(), music_filename: '', apply_to_segments: ['content'], start_offset_s: 0, end_offset_s: 0, fade_in_s: 3, fade_out_s: 5, volume_db: -15 }]);
  };

  const updateMusicRule = (id, updatedRule) => {
    setMusicRules(musicRules.map(rule => (rule.id === id ? { ...rule, ...updatedRule } : rule)));
  };
  
  const removeMusicRule = (id) => {
    setMusicRules(musicRules.filter(rule => rule.id !== id));
  };
  
  const handleSave = async () => {
    setIsSaving(true);
    const finalTemplate = {
      id: initialTemplate?.id,
      user_id: initialTemplate?.user_id || generateUUID(),
      name: templateName,
      segments: segments.map(({ id, ...rest }) => rest),
      background_music_rules: musicRules.map(({ id, ...rest }) => rest),
      timing: timing,
    };

    const url = isEditMode ? `${API_BASE_URL}/templates/${initialTemplate.id}` : `${API_BASE_URL}/templates/`;
    const method = isEditMode ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalTemplate),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to save template');
      }
      await response.json();
      showTempNotification(`Template '${templateName}' saved successfully!`);
      onSaveSuccess();
    } catch (error) {
      showTempNotification(`Error: ${error.message}`, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <div className="flex justify-end items-center mb-8">
        <button onClick={handleSave} disabled={isSaving} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-all duration-300">
          {isSaving ? 'Saving...' : <><Save size={18} /> {isEditMode ? 'Update Template' : 'Save New Template'}</>}
        </button>
      </div>
      <div className="bg-slate-800 rounded-xl p-6 mb-8 shadow-lg">
        <label htmlFor="templateName" className="block text-sm font-medium text-slate-400 mb-2">TEMPLATE NAME</label>
        <input id="templateName" type="text" value={templateName} onChange={(e) => setTemplateName(e.target.value)} className="w-full bg-slate-700 text-slate-100 text-xl p-3 rounded-md border border-slate-600 focus:ring-2 focus:ring-indigo-500" placeholder="e.g., Weekly Interview Show" />
      </div>
      <Section title="Podcast Segments" icon={<FileAudio />} actionButton={<button onClick={() => addSegment('intro')} className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-slate-300 font-semibold py-2 px-4 rounded-lg transition-colors text-sm"><PlusCircle size={16} /> Add Intro</button>}>
        <div className="space-y-4">{segments.map((segment, index) => (<SegmentEditor key={segment.id} segment={segment} onUpdate={updateSegment} onRemove={removeSegment} onMove={moveSegment} index={index} totalSegments={segments.length} />))}</div>
        <div className="mt-6 flex gap-4"><button onClick={() => addSegment('outro')} className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-slate-300 font-semibold py-2 px-4 rounded-lg transition-colors"><PlusCircle size={18} /> Add Outro</button></div>
      </Section>
      <Section title="Segment Timing & Overlaps" icon={<Timer />}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <NumberInput label="Content Start Offset (s)" value={timing.content_start_offset_s} onChange={v => setTiming({...timing, content_start_offset_s: v})} step={0.1} />
          <NumberInput label="Outro Start Offset (s)" value={timing.outro_start_offset_s} onChange={v => setTiming({...timing, outro_start_offset_s: v})} step={0.1} />
        </div>
        <p className="text-xs text-slate-500 mt-2">Use negative numbers for an overlap. E.g., -2.0 means the content will start 2 seconds before the intros finish.</p>
      </Section>
      <Section title="Background Music Rules" icon={<Music />}>
        <div className="space-y-4">{musicRules.map(rule => (<MusicRuleEditor key={rule.id} rule={rule} onUpdate={updateMusicRule} onRemove={removeMusicRule} />))}</div>
        <div className="mt-6"><button onClick={addMusicRule} className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-slate-300 font-semibold py-2 px-4 rounded-lg transition-colors"><PlusCircle size={18} /> Add Music Rule</button></div>
      </Section>
      <Notification notification={notification} />
    </>
  );
};

// --- Episode Assembler Component ---
const EpisodeAssembler = ({ templates, onEditTemplate }) => {
    const [selectedTemplateId, setSelectedTemplateId] = useState('');
    const [mainContentFile, setMainContentFile] = useState('F1.wav');
    const [outputFilename, setOutputFilename] = useState('final_F1_episode');
    const [cleanupOptions, setCleanupOptions] = useState({ removePauses: true, removeFillers: true, checkForFlubber: true, checkForIntern: true });
    const [ttsOverrides, setTtsOverrides] = useState({});
    const [isProcessing, setIsProcessing] = useState(false);
    const [processingLog, setProcessingLog] = useState([]);
    const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

    useEffect(() => {
        if (templates.length > 0 && !selectedTemplateId) {
            setSelectedTemplateId(templates[0].id);
        }
    }, [templates, selectedTemplateId]);

    useEffect(() => {
        if (!selectedTemplateId) return;
        const selectedTemplate = templates.find(t => t.id === selectedTemplateId);
        if (!selectedTemplate) return;
        const newTtsOverrides = {};
        selectedTemplate.segments.forEach(seg => {
            if (seg.source && seg.source.source_type === 'tts') {
                newTtsOverrides[seg.id] = seg.source.script || '';
            }
        });
        setTtsOverrides(newTtsOverrides);
    }, [selectedTemplateId, templates]);

    const showTempNotification = (message, type = 'success', duration = 4000) => {
        setNotification({ show: true, message, type });
        setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), duration);
    };

    const handleProcessAndAssemble = async () => {
        if (!selectedTemplateId || !mainContentFile) {
            showTempNotification('Please select a template and provide a content file.', 'error');
            return;
        }
        setIsProcessing(true);
        setProcessingLog([]);
        try {
            const response = await fetch(`${API_BASE_URL}/episodes/process-and-assemble`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ template_id: selectedTemplateId, main_content_filename: mainContentFile, output_filename: outputFilename, cleanup_options: cleanupOptions, tts_overrides: ttsOverrides }),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to process episode');
            }
            const result = await response.json();
            setProcessingLog(result.log);
            showTempNotification(`Success! Episode saved to ${result.output_path}`, 'success');
        } catch (error) {
            showTempNotification(`Error: ${error.message}`, 'error');
            setProcessingLog(prev => [...prev, `ERROR: ${error.message}`]);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <>
            <Section title="Process & Assemble Episode" icon={<Zap />}>
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">Main Content Audio File</label>
                        <input type="text" value={mainContentFile} onChange={e => setMainContentFile(e.target.value)} placeholder="e.g., episode_interview.mp3" className="w-full bg-slate-700 p-3 rounded-md border border-slate-600" />
                    </div>
                    <div className="flex items-end gap-2">
                        <div className="flex-grow">
                          <label className="block text-sm font-medium text-slate-400 mb-2">Select a Template</label>
                          <select value={selectedTemplateId} onChange={e => setSelectedTemplateId(e.target.value)} className="w-full bg-slate-700 p-3 rounded-md border border-slate-600">
                              {templates.length === 0 ? (<option>Save a template in the Editor first...</option>) : (templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>))}
                          </select>
                        </div>
                        <button onClick={() => onEditTemplate(selectedTemplateId)} disabled={!selectedTemplateId} className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-slate-300 font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                          <Edit size={18} /> Edit
                        </button>
                    </div>
                    {Object.keys(ttsOverrides).length > 0 && (
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2">Per-Episode TTS Scripts</label>
                            <div className="space-y-2 bg-slate-700/50 p-4 rounded-lg">{Object.keys(ttsOverrides).map(segmentId => (<div key={segmentId}><textarea value={ttsOverrides[segmentId]} onChange={e => setTtsOverrides({...ttsOverrides, [segmentId]: e.target.value})} className="w-full bg-slate-600 p-2 rounded-md border border-slate-500" rows="2" placeholder={`Script for TTS segment...`} /></div>))}</div>
                        </div>
                    )}
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">Final Output Name</label>
                        <input type="text" value={outputFilename} onChange={e => setOutputFilename(e.target.value)} placeholder="e.g., my_final_episode" className="w-full bg-slate-700 p-3 rounded-md border border-slate-600" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">Cleanup & Keyword Actions</label>
                        <div className="grid grid-cols-2 gap-4 bg-slate-700/50 p-4 rounded-lg">{Object.keys(cleanupOptions).map(key => (<label key={key} className="flex items-center gap-2 text-slate-300"><input type="checkbox" checked={cleanupOptions[key]} onChange={e => setCleanupOptions({...cleanupOptions, [key]: e.target.checked})} className="h-4 w-4 rounded bg-slate-600 border-slate-500 text-indigo-600 focus:ring-indigo-500" /><span>{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</span></label>))}</div>
                    </div>
                    <div className="pt-2"><button onClick={handleProcessAndAssemble} disabled={isProcessing} className="w-full flex items-center justify-center gap-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold py-4 px-4 rounded-lg shadow-md transition-all duration-300 text-lg">{isProcessing ? 'Processing...' : <><Zap size={20} /> Process & Assemble Episode</>}</button></div>
                </div>
            </Section>
            {processingLog.length > 0 && (<div className="mt-6 bg-slate-900 p-4 rounded-md"><h4 className="font-semibold text-slate-300 mb-2">Processing Log:</h4><ul className="text-xs font-mono text-slate-400 space-y-1">{processingLog.map((log, i) => <li key={i} className={log.startsWith('ERROR') ? 'text-rose-400' : ''}>{log}</li>)}</ul></div>)}
            <Notification notification={notification} />
        </>
    );
};


// --- UI Components ---
const Notification = ({ notification }) => ( <div className={`fixed bottom-8 right-8 text-white py-3 px-6 rounded-lg shadow-xl transition-transform duration-300 ${notification.show ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'} ${notification.type === 'success' ? 'bg-green-500' : 'bg-rose-500'}`}>{notification.message}</div>);
const Section = ({ title, icon, children, actionButton = null }) => ( <div className="bg-slate-800 rounded-xl p-6 mb-8 shadow-lg"><div className="flex justify-between items-center mb-6"><h2 className="text-2xl font-bold text-slate-200 flex items-center gap-3">{React.cloneElement(icon, { size: 24, className: "text-indigo-400"})}{title}</h2>{actionButton}</div>{children}</div>);
const SegmentEditor = ({ segment, onUpdate, onRemove, onMove, index, totalSegments }) => {
  const isContent = segment.segment_type === 'content';
  const handleSourceTypeChange = (e) => {
    const newSourceType = e.target.value;
    let newSource;
    if (newSourceType === 'static') { newSource = { source_type: 'static', filename: '' }; } 
    else if (newSourceType === 'ai_generated') { newSource = { source_type: 'ai_generated', prompt: '', voice_id: '19B4gjtpL5m876wS3Dfg' }; } 
    else { newSource = { source_type: 'tts', script: '', voice_id: '19B4gjtpL5m876wS3Dfg' }; }
    onUpdate(segment.id, { ...segment, source: newSource });
  };
  const handleSourceFieldChange = (field, value) => { onUpdate(segment.id, { ...segment, source: { ...segment.source, [field]: value } }); };
  return (
    <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-700">
      <div className="flex items-start gap-4">
        <div className="flex flex-col items-center gap-1 pt-1">
          <button onClick={() => onMove(index, -1)} disabled={index === 0 || isContent} className="text-slate-400 hover:text-white disabled:text-slate-600 disabled:cursor-not-allowed"><ArrowUp size={20} /></button>
          <span className="font-mono text-indigo-400 text-lg">{index + 1}</span>
          <button onClick={() => onMove(index, 1)} disabled={index === totalSegments - 1 || isContent} className="text-slate-400 hover:text-white disabled:text-slate-600 disabled:cursor-not-allowed"><ArrowDown size={20} /></button>
        </div>
        <div className="flex-grow">
          <div className="flex justify-between items-center mb-4">
            <span className="text-lg font-bold capitalize text-slate-200">{segment.segment_type}</span>
            {!isContent && (<button onClick={() => onRemove(segment.id)} className="text-rose-400 hover:text-rose-300"><Trash2 size={18} /></button>)}
          </div>
          {isContent ? (<p className="text-slate-400 italic">This is a placeholder for your main episode recording.</p>) : (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                 <label className="text-slate-400 font-medium">Source:</label>
                 <select value={segment.source.source_type} onChange={handleSourceTypeChange} className="bg-slate-600 rounded-md p-2 border border-slate-500">
                    <option value="static">Static File</option>
                    <option value="ai_generated">AI Generated</option>
                    <option value="tts">TTS (Direct Script)</option>
                 </select>
              </div>
              {segment.source.source_type === 'static' ? (
                <div className="flex items-center gap-2"><FileAudio size={18} className="text-slate-400" /><input type="text" value={segment.source.filename} onChange={(e) => handleSourceFieldChange('filename', e.target.value)} placeholder="e.g., intro_theme.mp3" className="w-full bg-slate-600 p-2 rounded-md border border-slate-500" /></div>
              ) : segment.source.source_type === 'ai_generated' ? (
                <div className="space-y-2">
                   <div className="flex items-center gap-2"><Wand2 size={18} className="text-slate-400" /><input type="text" value={segment.source.prompt} onChange={(e) => handleSourceFieldChange('prompt', e.target.value)} placeholder="AI Prompt for script generation..." className="w-full bg-slate-600 p-2 rounded-md border border-slate-500" /></div>
                   <div className="flex items-center gap-2 pl-7"><input type="text" value={segment.source.voice_id} onChange={(e) => handleSourceFieldChange('voice_id', e.target.value)} placeholder="ElevenLabs Voice ID" className="w-full bg-slate-800 text-xs p-1 rounded-md border border-slate-600" /></div>
                </div>
              ) : ( // TTS
                 <div className="space-y-2">
                   <div className="flex items-start gap-2"><Type size={18} className="text-slate-400 mt-2" /><textarea value={segment.source.script} onChange={(e) => handleSourceFieldChange('script', e.target.value)} placeholder="Enter the exact script to be spoken..." className="w-full bg-slate-600 p-2 rounded-md border border-slate-500" rows="3" /></div>
                   <div className="flex items-center gap-2 pl-7"><input type="text" value={segment.source.voice_id} onChange={(e) => handleSourceFieldChange('voice_id', e.target.value)} placeholder="ElevenLabs Voice ID" className="w-full bg-slate-800 text-xs p-1 rounded-md border border-slate-600" /></div>
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
        const newSegments = currentSegments.includes(segmentType) ? currentSegments.filter(s => s !== segmentType) : [...currentSegments, segmentType];
        onUpdate(rule.id, { ...rule, apply_to_segments: newSegments });
    };
    return (
        <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-700">
            <div className="flex justify-between items-center mb-4"><h3 className="text-lg font-bold text-slate-300">Music Rule</h3><button onClick={() => onRemove(rule.id)} className="text-rose-400 hover:text-rose-300"><Trash2 size={18} /></button></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                    <div><label className="block text-sm font-medium text-slate-400 mb-1">Music File</label><input type="text" value={rule.music_filename} onChange={(e) => onUpdate(rule.id, { ...rule, music_filename: e.target.value })} placeholder="e.g., background_music.mp3" className="w-full bg-slate-600 p-2 rounded-md border border-slate-500" /></div>
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">Apply to Segments</label>
                        <div className="flex gap-4">{['intro', 'content', 'outro'].map(segType => (<label key={segType} className="flex items-center gap-2 text-slate-300"><input type="checkbox" checked={rule.apply_to_segments.includes(segType)} onChange={() => handleCheckboxChange(segType)} className="h-4 w-4 rounded bg-slate-600 border-slate-500 text-indigo-600 focus:ring-indigo-500" /><span className="capitalize">{segType}</span></label>))}</div>
                    </div>
                </div>
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-2"><NumberInput label="Start Offset (s)" value={rule.start_offset_s} onChange={v => onUpdate(rule.id, {...rule, start_offset_s: v})} /><NumberInput label="End Offset (s)" value={rule.end_offset_s} onChange={v => onUpdate(rule.id, {...rule, end_offset_s: v})} /></div>
                     <div className="grid grid-cols-2 gap-2"><NumberInput label="Fade In (s)" value={rule.fade_in_s} onChange={v => onUpdate(rule.id, {...rule, fade_in_s: v})} /><NumberInput label="Fade Out (s)" value={rule.fade_out_s} onChange={v => onUpdate(rule.id, {...rule, fade_out_s: v})} /></div>
                </div>
            </div>
             <div className="mt-4">
                <label htmlFor={`vol-${rule.id}`} className="block text-sm font-medium text-slate-400">Volume ({rule.volume_db} dB)</label>
                <input id={`vol-${rule.id}`} type="range" min="-40" max="0" value={rule.volume_db} onChange={e => onUpdate(rule.id, {...rule, volume_db: parseInt(e.target.value)})} className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer" />
            </div>
        </div>
    );
};

const NumberInput = ({ label, value, onChange }) => (<div><label className="block text-sm font-medium text-slate-400 mb-1">{label}</label><input type="number" value={value} onChange={(e) => onChange(parseFloat(e.target.value) || 0)} className="w-full bg-slate-600 p-2 rounded-md border border-slate-500" /></div>);
