import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { PlusCircle, Trash2, ArrowUp, ArrowDown, Wand2, FileAudio, Music, Save, Zap, Type, Edit, Timer, UploadCloud, LogOut, Library, FileUp } from 'lucide-react';

// --- Constants ---
const generateUUID = () => crypto.randomUUID();
const API_BASE_URL = 'http://127.0.0.1:8000';

// --- Login Page Component ---
const LoginPage = () => {
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        const formData = new URLSearchParams();
        formData.append('username', email);
        formData.append('password', password);
        try {
            const response = await fetch(`${API_BASE_URL}/auth/token`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: formData,
            });
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.detail || 'Login failed');
            }
            const data = await response.json();
            login(data.access_token);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleGoogleLogin = () => {
        window.location.href = `${API_BASE_URL}/auth/login/google`;
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-900">
            <div className="w-full max-w-md p-8 space-y-8 bg-slate-800 rounded-2xl shadow-lg">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-white">Podcast Pro Plus</h1>
                    <p className="mt-2 text-slate-400">Sign in to continue</p>
                </div>
                {error && <p className="text-center text-rose-400 bg-rose-900/50 p-3 rounded-md">{error}</p>}
                <form className="space-y-6" onSubmit={handleLogin}>
                    <div className="space-y-1">
                        <label htmlFor="email" className="text-sm font-medium text-slate-300">Email Address</label>
                        <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-4 py-2 text-slate-100 bg-slate-700 border border-slate-600 rounded-md focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <div className="space-y-1">
                        <label htmlFor="password" className="text-sm font-medium text-slate-300">Password</label>
                        <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full px-4 py-2 text-slate-100 bg-slate-700 border border-slate-600 rounded-md focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <div>
                        <button type="submit" disabled={isLoading} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                            {isLoading ? 'Signing in...' : 'Sign In'}
                        </button>
                    </div>
                </form>
                <div className="relative">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-600" /></div>
                    <div className="relative flex justify-center text-sm"><span className="px-2 bg-slate-800 text-slate-400">Or continue with</span></div>
                </div>
                <div>
                    <button onClick={handleGoogleLogin} className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-slate-600 rounded-md shadow-sm text-sm font-medium text-slate-200 bg-slate-700 hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500">
                        <svg className="w-5 h-5" aria-hidden="true" viewBox="0 0 24 24"><path fill="currentColor" d="M21.35,11.1H12.18V13.83H18.69C18.36,17.64 15.19,19.27 12.19,19.27C8.36,19.27 5,16.25 5,12.5C5,8.75 8.36,5.73 12.19,5.73C15.19,5.73 17.5,6.78 18.25,7.74L20.5,5.5C18.83,3.83 15.83,2.5 12.19,2.5C6.42,2.5 2,7.45 2,12.5C2,17.55 6.42,22.5 12.19,22.5C17.6,22.5 21.9,18.33 21.9,12.81C21.9,12.06 21.68,11.56 21.35,11.1Z"></path></svg>
                        Sign in with Google
                    </button>
                </div>
            </div>
        </div>
    );
};


// --- Main Application Component (Protected) ---
const MainApp = () => {
    const [view, setView] = useState('assembler');
    const [templates, setTemplates] = useState([]);
    const [mediaItems, setMediaItems] = useState([]);
    const [currentTemplate, setCurrentTemplate] = useState(null);
    const { token, logout } = useAuth();
    
    const fetchApi = async (endpoint) => {
        if (!token) return [];
        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) {
                if (response.status === 401) logout();
                throw new Error(`Failed to fetch ${endpoint}`);
            }
            return await response.json();
        } catch (error) {
            console.error(`Error fetching ${endpoint}:`, error);
            return [];
        }
    };

    const fetchAllData = () => {
        fetchApi('/templates/').then(setTemplates);
        fetchApi('/media/').then(setMediaItems);
    };

    useEffect(() => {
        fetchAllData();
    }, [token]);

    const handleEditTemplate = (templateId) => {
        const templateToEdit = templates.find(t => t.id === templateId);
        if (templateToEdit) {
            const editableTemplate = { ...templateToEdit };
            setCurrentTemplate(editableTemplate);
            setView('editor');
        }
    };

    const handleNewTemplate = () => {
        setCurrentTemplate(null);
        setView('editor');
    };

    const renderView = () => {
        switch (view) {
            case 'editor':
                return <TemplateEditor key={currentTemplate ? currentTemplate.id : 'new'} initialTemplate={currentTemplate} onSaveSuccess={fetchAllData} mediaItems={mediaItems} />;
            case 'media':
                return <MediaLibrary mediaItems={mediaItems} onDataChange={fetchAllData} />;
            case 'assembler':
            default:
                return <EpisodeAssembler templates={templates} onEditTemplate={handleEditTemplate} mediaItems={mediaItems} />;
        }
    };

    return (
        <div className="bg-slate-900 min-h-screen text-white font-sans p-4 sm:p-6 lg:p-8">
            <div className="max-w-4xl mx-auto">
                <Header currentView={view} setView={setView} onNewTemplate={handleNewTemplate} onLogout={logout} />
                {renderView()}
            </div>
        </div>
    );
}

// --- App Entry Point ---
export default function App() {
    const { isAuthenticated, login } = useAuth();

    useEffect(() => {
        const hash = window.location.hash;
        if (hash) {
            const params = new URLSearchParams(hash.substring(1));
            const token = params.get('access_token');
            if (token) {
                login(token);
                window.location.hash = '';
            }
        }
    }, [login]);

    return isAuthenticated ? <MainApp /> : <LoginPage />;
}

// --- Components ---

const Header = ({ currentView, setView, onNewTemplate, onLogout }) => (
    <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-100">
            {currentView === 'editor' ? 'Template Editor' : currentView === 'media' ? 'Media Library' : 'Episode Workflow'}
        </h1>
        <div className="flex items-center gap-4">
            <div className="flex gap-2 p-1 bg-slate-800 rounded-lg">
                <button onClick={() => setView('assembler')} className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors ${currentView === 'assembler' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-700'}`}>Assembler</button>
                <button onClick={onNewTemplate} className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors ${currentView === 'editor' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-700'}`}>Editor</button>
                <button onClick={() => setView('media')} className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors ${currentView === 'media' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-700'}`}>Media</button>
            </div>
            <button onClick={onLogout} className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-lg" title="Logout"><LogOut size={20} /></button>
        </div>
    </div>
);

const MediaLibrary = ({ mediaItems, onDataChange }) => {
    const { token } = useAuth();
    const [isUploading, setIsUploading] = useState(false);
    const [uploadCategory, setUploadCategory] = useState('music');
    const fileInputRef = useRef(null);
    const mediaCategories = ["intro", "outro", "music", "commercial", "sfx", "main_content"];

    const handleUpload = async (event) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;

        setIsUploading(true);
        const formData = new FormData();
        // The category is now part of the URL, so we don't add it to the form data.
        for (const file of files) {
            formData.append('files', file);
        }

        try {
            // Construct the new URL with the category
            const response = await fetch(`${API_BASE_URL}/media/upload/${uploadCategory}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData,
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Upload failed');
            }
            onDataChange();
        } catch (error) {
            console.error("Upload error:", error);
            alert(`Upload failed: ${error.message}`);
        } finally {
            setIsUploading(false);
            if(fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const handleDelete = async (mediaId) => {
        if (!window.confirm("Are you sure you want to delete this file?")) return;
        try {
            const response = await fetch(`${API_BASE_URL}/media/${mediaId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (!response.ok) throw new Error('Delete failed');
            onDataChange();
        } catch (error) {
            console.error("Delete error:", error);
            alert("Delete failed. See console for details.");
        }
    };

    return (
        <Section title="Your Uploaded Media" icon={<Library />} actionButton={
            <div className="flex items-center gap-2">
                <select value={uploadCategory} onChange={e => setUploadCategory(e.target.value)} className="bg-slate-700 text-sm p-2 rounded-md border border-slate-600">
                    {mediaCategories.map(cat => <option key={cat} value={cat} className="capitalize">{cat.replace('_', ' ')}</option>)}
                </select>
                <button onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm">
                    <FileUp size={16} /> {isUploading ? 'Uploading...' : 'Upload'}
                    <input type="file" ref={fileInputRef} onChange={handleUpload} className="hidden" accept="audio/mpeg,audio/wav" multiple />
                </button>
            </div>
        }>
            <div className="space-y-3">
                {mediaItems.length > 0 ? mediaItems.map(item => (
                    <div key={item.id} className="bg-slate-700/50 p-3 rounded-lg flex justify-between items-center">
                        <div>
                            <p className="font-mono text-indigo-300">{item.filename.split('_').slice(1).join('_')}</p>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-slate-400">{(item.filesize / 1024 / 1024).toFixed(2)} MB</span>
                                <span className="text-xs bg-slate-600 text-slate-300 px-2 py-0.5 rounded-full capitalize">{item.category.replace('_', ' ')}</span>
                            </div>
                        </div>
                        <button onClick={() => handleDelete(item.id)} className="text-rose-400 hover:text-rose-300"><Trash2 size={18} /></button>
                    </div>
                )) : <p className="text-slate-400 italic">No media files uploaded yet.</p>}
            </div>
        </Section>
    );
};


const TemplateEditor = ({ initialTemplate, onSaveSuccess, mediaItems }) => {
    const { token } = useAuth();
    const isEditMode = !!initialTemplate;
    const [templateName, setTemplateName] = useState(initialTemplate?.name || 'New Podcast Template');
    const [segments, setSegments] = useState(initialTemplate?.segments || [{ id: generateUUID(), segment_type: 'content', source: { source_type: 'static', filename: 'placeholder.mp3' } }]);
    const [musicRules, setMusicRules] = useState(initialTemplate?.background_music_rules || []);
    const [timing, setTiming] = useState(initialTemplate?.timing || { content_start_offset_s: -2.0, outro_start_offset_s: -5.0 });
    const [isSaving, setIsSaving] = useState(false);
    const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

    const showTempNotification = (message, type = 'success', duration = 3000) => {
        setNotification({ show: true, message, type });
        setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), duration);
    };
    
    const addSegment = (type) => {
        const newSegment = { id: generateUUID(), segment_type: type, source: { source_type: 'static', filename: '' } };
        const contentIndex = segments.findIndex(seg => seg.segment_type === 'content');
        const newSegments = [...segments];
        if (type === 'intro' && contentIndex !== -1) {
            newSegments.splice(contentIndex, 0, newSegment);
        } else {
            newSegments.push(newSegment);
        }
        setSegments(newSegments);
    };

    const updateSegment = (id, updatedSegment) => setSegments(segments.map(seg => (seg.id === id ? { ...seg, ...updatedSegment } : seg)));
    const removeSegment = (id) => { if (segments.find(s => s.id === id)?.segment_type === 'content') return; setSegments(segments.filter(seg => seg.id !== id)); };
    const moveSegment = (index, direction) => { if (segments[index + direction]?.segment_type === 'content' || segments[index]?.segment_type === 'content') return; const newSegments = [...segments]; const [movedSegment] = newSegments.splice(index, 1); newSegments.splice(index + direction, 0, movedSegment); setSegments(newSegments); };
    const addMusicRule = () => setMusicRules([...musicRules, { id: generateUUID(), music_filename: '', apply_to_segments: ['content'], start_offset_s: 0, end_offset_s: 0, fade_in_s: 3, fade_out_s: 5, volume_db: -15 }]);
    const updateMusicRule = (id, updatedRule) => setMusicRules(musicRules.map(rule => (rule.id === id ? { ...rule, ...updatedRule } : rule)));
    const removeMusicRule = (id) => setMusicRules(musicRules.filter(rule => rule.id !== id));

    const handleSave = async () => {
        setIsSaving(true);
        const finalTemplate = { id: initialTemplate?.id, name: templateName, segments, background_music_rules: musicRules, timing };
        const url = isEditMode ? `${API_BASE_URL}/templates/${initialTemplate.id}` : `${API_BASE_URL}/templates/`;
        const method = isEditMode ? 'PUT' : 'POST';
        try {
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(finalTemplate),
            });
            if (!response.ok) { const errorData = await response.json(); throw new Error(errorData.detail || 'Failed to save template'); }
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
                <div className="space-y-4">{segments.map((segment, index) => (<SegmentEditor key={segment.id} segment={segment} onUpdate={updateSegment} onRemove={removeSegment} onMove={moveSegment} index={index} totalSegments={segments.length} mediaItems={mediaItems} />))}</div>
                <div className="mt-6 flex gap-4"><button onClick={() => addSegment('outro')} className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-slate-300 font-semibold py-2 px-4 rounded-lg transition-colors"><PlusCircle size={18} /> Add Outro</button></div>
            </Section>
            <Section title="Segment Timing & Overlaps" icon={<Timer />}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <NumberInput label="Content Start Offset (s)" value={timing.content_start_offset_s} onChange={v => setTiming({ ...timing, content_start_offset_s: v })} step={0.1} />
                    <NumberInput label="Outro Start Offset (s)" value={timing.outro_start_offset_s} onChange={v => setTiming({ ...timing, outro_start_offset_s: v })} step={0.1} />
                </div>
                <p className="text-xs text-slate-500 mt-2">Use negative numbers for an overlap. E.g., -2.0 means the content will start 2 seconds before the intros finish.</p>
            </Section>
            <Section title="Background Music Rules" icon={<Music />}>
                <div className="space-y-4">{musicRules.map(rule => (<MusicRuleEditor key={rule.id} rule={rule} onUpdate={updateMusicRule} onRemove={removeMusicRule} mediaItems={mediaItems} />))}</div>
                <div className="mt-6"><button onClick={addMusicRule} className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-slate-300 font-semibold py-2 px-4 rounded-lg transition-colors"><PlusCircle size={18} /> Add Music Rule</button></div>
            </Section>
            <Notification notification={notification} />
        </>
    );
};

const EpisodeAssembler = ({ templates, onEditTemplate, mediaItems }) => {
    const { token } = useAuth();
    const [selectedTemplateId, setSelectedTemplateId] = useState('');
    const [mainContentFile, setMainContentFile] = useState('');
    const [outputFilename, setOutputFilename] = useState('final_episode');
    const [cleanupOptions, setCleanupOptions] = useState({ removePauses: true, removeFillers: true, checkForFlubber: false, checkForIntern: false });
    const [ttsOverrides, setTtsOverrides] = useState({});
    const [isProcessing, setIsProcessing] = useState(false);
    const [processingLog, setProcessingLog] = useState([]);
    const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
    const [assembledFile, setAssembledFile] = useState(null);
    const [publishTitle, setPublishTitle] = useState('');
    const [publishDescription, setPublishDescription] = useState('');
    const [spreakerShowId, setSpreakerShowId] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    useEffect(() => {
        if (templates.length > 0 && !selectedTemplateId) setSelectedTemplateId(templates[0].id);
        const mainContentItems = mediaItems.filter(i => i.category === 'main_content');
        if (mainContentItems.length > 0 && !mainContentFile) setMainContentFile(mainContentItems[0].filename);
    }, [templates, mediaItems, selectedTemplateId, mainContentFile]);

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
        if (!selectedTemplateId || !mainContentFile) { showTempNotification('Please select a template and content file.', 'error'); return; }
        setIsProcessing(true);
        setAssembledFile(null);
        setProcessingLog([]);
        try {
            const response = await fetch(`${API_BASE_URL}/episodes/process-and-assemble`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ template_id: selectedTemplateId, main_content_filename: mainContentFile, output_filename: outputFilename, cleanup_options: cleanupOptions, tts_overrides: ttsOverrides }),
            });
            if (!response.ok) { const errorData = await response.json(); throw new Error(errorData.detail || 'Failed to process'); }
            const result = await response.json();
            setProcessingLog(result.log);
            const finalFilename = result.output_path.split(/[\\/]/).pop();
            setAssembledFile(finalFilename);
            showTempNotification(`Success! Episode assembled!`, 'success');
        } catch (error) {
            showTempNotification(`Error: ${error.message}`, 'error');
            setProcessingLog(prev => [...prev, `ERROR: ${error.message}`]);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleAutofill = async () => {
        if (!assembledFile) return;
        setIsGenerating(true);
        try {
            const response = await fetch(`${API_BASE_URL}/episodes/generate-metadata/${assembledFile}`, { 
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) { const errorData = await response.json(); throw new Error(errorData.detail || 'Failed to generate metadata'); }
            const metadata = await response.json();
            setPublishTitle(metadata.title);
            setPublishDescription(metadata.summary);
            showTempNotification('Metadata auto-filled!', 'success');
        } catch (error) {
            showTempNotification(`Error: ${error.message}`, 'error');
        } finally {
            setIsGenerating(false);
        }
    };

    const handlePublish = async () => {
        if (!assembledFile || !spreakerShowId || !publishTitle) { showTempNotification('Please provide a Show ID and Title.', 'error'); return; }
        setIsProcessing(true);
        try {
            const response = await fetch(`${API_BASE_URL}/episodes/publish/spreaker/${assembledFile}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ show_id: spreakerShowId, title: publishTitle, description: publishDescription }),
            });
            if (!response.ok) { const errorData = await response.json(); throw new Error(errorData.detail || 'Failed to publish'); }
            const result = await response.json();
            showTempNotification(result.message, 'success');
            setProcessingLog(prev => [...prev, `PUBLISHED: ${result.message}`]);
        } catch (error) {
            showTempNotification(`Error: ${error.message}`, 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <>
            <Section title="Step 1: Process & Assemble Episode" icon={<Zap />}>
                <div className="space-y-6">
                    <MediaSelector label="Main Content Audio File" items={mediaItems} category="main_content" selectedValue={mainContentFile} onSelect={setMainContentFile} />
                    <div className="flex items-end gap-2">
                        <div className="flex-grow">
                            <label className="block text-sm font-medium text-slate-400 mb-2">Select a Template</label>
                            <select value={selectedTemplateId} onChange={e => setSelectedTemplateId(e.target.value)} className="w-full bg-slate-700 p-3 rounded-md border border-slate-600">
                                {templates.length === 0 ? (<option>No templates found. Create one in the Editor.</option>) : (templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>))}
                            </select>
                        </div>
                        <button onClick={() => onEditTemplate(selectedTemplateId)} disabled={!selectedTemplateId} className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-slate-300 font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                            <Edit size={18} /> Edit
                        </button>
                    </div>
                    {Object.keys(ttsOverrides).length > 0 && (
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2">Per-Episode TTS Scripts</label>
                            <div className="space-y-2 bg-slate-700/50 p-4 rounded-lg">{Object.keys(ttsOverrides).map(segmentId => (<div key={segmentId}><textarea value={ttsOverrides[segmentId]} onChange={e => setTtsOverrides({ ...ttsOverrides, [segmentId]: e.target.value })} className="w-full bg-slate-600 p-2 rounded-md border border-slate-500" rows="2" placeholder={`Script for TTS segment...`} /></div>))}</div>
                        </div>
                    )}
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">Final Output Name</label>
                        <input type="text" value={outputFilename} onChange={e => setOutputFilename(e.target.value)} placeholder="e.g., my_final_episode" className="w-full bg-slate-700 p-3 rounded-md border border-slate-600" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">Cleanup & Keyword Actions</label>
                        <div className="grid grid-cols-2 gap-4 bg-slate-700/50 p-4 rounded-lg">{Object.keys(cleanupOptions).map(key => (<label key={key} className="flex items-center gap-2 text-slate-300"><input type="checkbox" checked={cleanupOptions[key]} onChange={e => setCleanupOptions({ ...cleanupOptions, [key]: e.target.checked })} className="h-4 w-4 rounded bg-slate-600 border-slate-500 text-indigo-600 focus:ring-indigo-500" /><span>{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</span></label>))}</div>
                    </div>
                    <div className="pt-2"><button onClick={handleProcessAndAssemble} disabled={isProcessing} className="w-full flex items-center justify-center gap-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold py-4 px-4 rounded-lg shadow-md transition-all duration-300 text-lg">{isProcessing ? 'Processing...' : <><Zap size={20} /> Process & Assemble Episode</>}</button></div>
                </div>
            </Section>

            {assembledFile && (
                <Section title="Step 2: Publish Episode" icon={<UploadCloud />}>
                    <div className="space-y-6">
                        <div className="bg-slate-900/50 p-4 rounded-lg">
                            <p className="text-sm text-slate-400">Ready to publish:</p>
                            <p className="font-mono text-indigo-300">{assembledFile}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2">Spreaker Show ID</label>
                            <input type="text" value={spreakerShowId} onChange={e => setSpreakerShowId(e.target.value)} placeholder="e.g., 1234567" className="w-full bg-slate-700 p-3 rounded-md border border-slate-600" />
                        </div>
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="block text-sm font-medium text-slate-400">Episode Title</label>
                                <button onClick={handleAutofill} disabled={isProcessing || isGenerating} className="text-sm flex items-center gap-1 text-indigo-400 hover:text-indigo-300 disabled:opacity-50">
                                    {isGenerating ? (<>Generating...</>) : (<><Wand2 size={14} /> Auto-fill with AI</>)}
                                </button>
                            </div>
                            <input type="text" value={publishTitle} onChange={e => setPublishTitle(e.target.value)} placeholder="Your Episode Title" className="w-full bg-slate-700 p-3 rounded-md border border-slate-600" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2">Description / Show Notes</label>
                            <textarea value={publishDescription} onChange={e => setPublishDescription(e.target.value)} placeholder="Your episode summary and show notes..." className="w-full bg-slate-700 p-3 rounded-md border border-slate-600" rows="4" />
                        </div>
                        <div className="pt-2">
                            <button onClick={handlePublish} disabled={isProcessing || isGenerating} className="w-full flex items-center justify-center gap-3 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white font-bold py-4 px-4 rounded-lg shadow-md transition-all duration-300 text-lg">
                                {isProcessing ? 'Publishing...' : <><UploadCloud size={20} /> Publish to Spreaker</>}
                            </button>
                        </div>
                    </div>
                </Section>
            )}

            {processingLog.length > 0 && (<div className="mt-6 bg-slate-900 p-4 rounded-md"><h4 className="font-semibold text-slate-300 mb-2">Processing Log:</h4><ul className="text-xs font-mono text-slate-400 space-y-1">{processingLog.map((log, i) => <li key={i} className={log.startsWith('ERROR') ? 'text-rose-400' : ''}>{log}</li>)}</ul></div>)}
            <Notification notification={notification} />
        </>
    );
};

const Notification = ({ notification }) => (<div className={`fixed bottom-8 right-8 text-white py-3 px-6 rounded-lg shadow-xl transition-transform duration-300 ${notification.show ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'} ${notification.type === 'success' ? 'bg-green-500' : 'bg-rose-500'}`}>{notification.message}</div>);
const Section = ({ title, icon, children, actionButton = null }) => (<div className="bg-slate-800 rounded-xl p-6 mb-8 shadow-lg"><div className="flex justify-between items-center mb-6"><h2 className="text-2xl font-bold text-slate-200 flex items-center gap-3">{React.cloneElement(icon, { size: 24, className: "text-indigo-400" })} {title}</h2>{actionButton}</div>{children}</div>);

const MediaSelector = ({ label, items, selectedValue, onSelect, category, placeholder = "Select a file..." }) => {
    const filteredItems = category ? items.filter(item => item.category === category) : items;
    return (
        <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">{label}</label>
            <select value={selectedValue} onChange={e => onSelect(e.target.value)} className="w-full bg-slate-700 p-3 rounded-md border border-slate-600">
                <option value="">{placeholder}</option>
                {filteredItems.map(item => 
                    <option key={item.id} value={item.filename}>{item.filename.split('_').slice(1).join('_')}</option>
                )}
            </select>
        </div>
    );
};

const SegmentEditor = ({ segment, onUpdate, onRemove, onMove, index, totalSegments, mediaItems }) => {
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
                                <MediaSelector items={mediaItems} category={segment.segment_type} selectedValue={segment.source.filename} onSelect={(val) => handleSourceFieldChange('filename', val)} placeholder="Upload a file in the Media Library..." />
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

const MusicRuleEditor = ({ rule, onUpdate, onRemove, mediaItems }) => {
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
                    <MediaSelector label="Music File" items={mediaItems} category="music" selectedValue={rule.music_filename} onSelect={(val) => onUpdate(rule.id, { ...rule, music_filename: val })} placeholder="Upload music in the Media Library..." />
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">Apply to Segments</label>
                        <div className="flex gap-4">{['intro', 'content', 'outro'].map(segType => (<label key={segType} className="flex items-center gap-2 text-slate-300"><input type="checkbox" checked={rule.apply_to_segments.includes(segType)} onChange={() => handleCheckboxChange(segType)} className="h-4 w-4 rounded bg-slate-600 border-slate-500 text-indigo-600 focus:ring-indigo-500" /><span className="capitalize">{segType}</span></label>))}</div>
                    </div>
                </div>
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-2"><NumberInput label="Start Offset (s)" value={rule.start_offset_s} onChange={v => onUpdate(rule.id, { ...rule, start_offset_s: v })} /><NumberInput label="End Offset (s)" value={rule.end_offset_s} onChange={v => onUpdate(rule.id, { ...rule, end_offset_s: v })} /></div>
                    <div className="grid grid-cols-2 gap-2"><NumberInput label="Fade In (s)" value={rule.fade_in_s} onChange={v => onUpdate(rule.id, { ...rule, fade_in_s: v })} /><NumberInput label="Fade Out (s)" value={rule.fade_out_s} onChange={v => onUpdate(rule.id, { ...rule, fade_out_s: v })} /></div>
                </div>
            </div>
            <div className="mt-4">
                <label htmlFor={`vol-${rule.id}`} className="block text-sm font-medium text-slate-400">Volume ({rule.volume_db} dB)</label>
                <input id={`vol-${rule.id}`} type="range" min="-40" max="0" value={rule.volume_db} onChange={e => onUpdate(rule.id, { ...rule, volume_db: parseInt(e.target.value) })} className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer" />
            </div>
        </div>
    );
};

const NumberInput = ({ label, value, onChange }) => (<div><label className="block text-sm font-medium text-slate-400 mb-1">{label}</label><input type="number" value={value} onChange={(e) => onChange(parseFloat(e.target.value) || 0)} className="w-full bg-slate-600 p-2 rounded-md border border-slate-500" /></div>);
