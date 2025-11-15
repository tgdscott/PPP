import { useMemo, useState } from 'react';
import { Sparkles, Layers, Share2, BarChart3, TabletSmartphone, PlayCircle } from 'lucide-react';
import './App.css';

const slides = [
    {
        id: 'overview',
        title: 'From pitch deck to published episode',
        description:
            'Use this guided canvas to tell the full product story. Tap through each tile to show how a producer can outline, automate, and publish an episode in minutes.',
        points: [
            'Drag branded intro/outro blocks into the episode board',
            'Layer AI narration, ad markers, and safety checks without opening another tool',
            'Preview the finished run-of-show while stakeholders watch on the iPad'
        ],
        preview: {
            label: 'Storyboard',
            metric: 'Setup ≈ 12 min',
            cards: [
                { title: 'Opening Hook', badge: 'AI Script', value: '00:45' },
                { title: 'Interview Segment', badge: 'Main Audio', value: '14:30' },
                { title: 'Ad Break', badge: 'Dynamic', value: '02:00' },
                { title: 'Outro + CTA', badge: 'Brand Kit', value: '01:00' }
            ],
            footer: 'Every block can expand during your walkthrough so the story feels tangible.'
        }
    },
    {
        id: 'automation',
        title: 'Automation that feels like a producer on autopilot',
        description:
            'Highlight how Podcast Pro Plus watches levels, stitches background beds, and removes filler words as soon as assets arrive.',
        points: [
            'Tap to toggle cleanup routines (pause trimming, filler removal, "intern check")',
            'Show how music rules fade under or overlap using simple sliders',
            'Explain confidence badges so execs know what is human-reviewed'
        ],
        preview: {
            label: 'Automation Stack',
            metric: '98% ready',
            cards: [
                { title: 'Smart Leveling', badge: 'Live', value: '±1.5 dB' },
                { title: 'Music Bed Logic', badge: 'Rules', value: '6 cues' },
                { title: 'Voice Cleanup', badge: 'AI', value: '7 flags' }
            ],
            footer: 'Use the cards as visual anchors while you narrate the automation story.'
        }
    },
    {
        id: 'distribution',
        title: 'Publish + measure without leaving the tablet',
        description:
            'Close the loop by tapping the distribution slide: pick a show, add notes, and push to every destination with one gesture.',
        points: [
            'Simulate writing a punchy title + show notes using AI assists',
            'Display partner destinations (YouTube, RSS, private feeds) in one glance',
            'Show lightweight analytics so the conversation ends with impact'
        ],
        preview: {
            label: 'Release Control',
            metric: '3 networks linked',
            cards: [
                { title: 'Spreaker', badge: 'Synced', value: 'Scheduled' },
                { title: 'YouTube', badge: 'Auto Video', value: '1080p' },
                { title: 'Private Feed', badge: 'Members', value: 'Ready' }
            ],
            footer: 'Stakeholders can literally watch the publish button glow as you finish.'
        }
    }
];

const workflowStages = [
    {
        id: 'plan',
        step: '01',
        title: 'Plan & Align',
        summary: 'Producers storyboard the episode, drop in ad markers, and lock scripts.',
        detail:
            'Use the iPad to drag intro/outro cards, record quick scratch tracks, and pin executive comments. Everything autosaves for the next review.',
        statLabel: 'Average prep time',
        statValue: '11 min',
        touchHint: 'Tap “Plan & Align” to show collaborative pinning and approvals.'
    },
    {
        id: 'automate',
        step: '02',
        title: 'Automate & Polish',
        summary: 'Audio cleanup, background beds, and tone checks run in the cloud.',
        detail:
            'Demonstrate how each automation badge lights up as assets finish processing. The deck shows what is handled by AI versus humans so trust stays high.',
        statLabel: 'Manual edits removed',
        statValue: '32 tasks',
        touchHint: 'Explain each badge—pause trimming, filler removal, “intern check.”'
    },
    {
        id: 'publish',
        step: '03',
        title: 'Publish & Measure',
        summary: 'One tap pushes to RSS, YouTube, and private feeds with smart notes.',
        detail:
            'Preview the release modal, drop in AI-written notes, and showcase lightweight analytics so the audience sees the impact immediately.',
        statLabel: 'Channels per episode',
        statValue: '5 destinations',
        touchHint: 'Finish the story by highlighting the glowing Publish button.'
    }
];

const modules = [
    {
        id: 'workspace',
        icon: Layers,
        title: 'Unified Workspace',
        description: 'Episode board, asset library, and approvals live in one responsive layout optimised for iPad gestures.',
        chips: ['Drag + drop segments', 'Brand-safe templates', 'Real-time comments']
    },
    {
        id: 'insights',
        icon: BarChart3,
        title: 'Audience Insights',
        description: 'Lightweight analytics cards highlight retention dips and ad performance without opening a spreadsheet.',
        chips: ['Drop-off heatmap', 'Ad lift callouts', 'Shareable recap']
    },
    {
        id: 'handoff',
        icon: Share2,
        title: 'One-Tap Handoff',
        description: 'Distribute to RSS, private feeds, and video destinations simultaneously while the iPad mirrors progress.',
        chips: ['Role-based presets', 'Auto chapters', 'Secure review links']
    }
];

const SlidePreview = ({ slide }) => (
    <div className="relative aspect-[4/3] w-full rounded-[32px] border border-white/10 bg-gradient-to-br from-slate-900/80 via-slate-900 to-slate-950 p-6 shadow-[0_25px_80px_rgba(15,23,42,0.6)]">
        <div className="flex items-center justify-between text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-slate-400">
            <span>{slide.preview.label}</span>
            <span>{slide.preview.metric}</span>
        </div>
        <div className="mt-6 flex flex-col gap-3">
            {slide.preview.cards.map((card) => (
                <div key={card.title} className="rounded-2xl border border-white/5 bg-white/5/50 p-4">
                    <div className="flex items-center justify-between text-sm text-slate-300">
                        <p className="font-semibold text-white">{card.title}</p>
                        <span className="text-xs text-slate-400">{card.value}</span>
                    </div>
                    <span className="mt-2 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[0.65rem] uppercase tracking-wider text-indigo-200">
                        <Sparkles size={14} /> {card.badge}
                    </span>
                </div>
            ))}
        </div>
        <p className="mt-6 text-xs text-slate-400">{slide.preview.footer}</p>
    </div>
);

export default function App() {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [activeStage, setActiveStage] = useState(workflowStages[0].id);

    const currentSlideData = slides[currentSlide];
    const activeStageData = useMemo(() => workflowStages.find((stage) => stage.id === activeStage), [activeStage]);

    const goToSlide = (index) => {
        if (index < 0 || index >= slides.length) return;
        setCurrentSlide(index);
    };

    return (
        <div className="min-h-screen bg-slate-950 px-4 py-6 text-white sm:py-10">
            <div className="mx-auto flex max-w-5xl flex-col gap-8">
                <header className="rounded-3xl border border-white/10 bg-gradient-to-r from-slate-900 via-slate-900/70 to-slate-950 p-6 shadow-lg sm:p-8">
                    <p className="text-xs font-semibold uppercase tracking-[0.4em] text-indigo-200">Podcast Pro Plus</p>
                    <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <h1 className="text-3xl font-semibold leading-tight sm:text-4xl">Interactive Product Demo Deck</h1>
                        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm text-slate-200">
                            <TabletSmartphone size={18} /> Optimised for iPad landscape
                        </span>
                    </div>
                    <p className="mt-4 text-base text-slate-300">
                        This semi-interactive presentation behaves like a touch-friendly slide deck. Use it to show decision makers how
                        your platform thinks—from planning, to automation, to final publishing.
                    </p>
                </header>

                <section className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-xl sm:p-10">
                    <div className="grid gap-8 md:grid-cols-2 md:items-center">
                        <div>
                            <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Slide {currentSlide + 1} / {slides.length}</p>
                            <h2 className="mt-3 text-3xl font-semibold text-white">{currentSlideData.title}</h2>
                            <p className="mt-3 text-base text-slate-300">{currentSlideData.description}</p>
                            <ul className="mt-6 space-y-3 text-base text-slate-200">
                                {currentSlideData.points.map((point) => (
                                    <li key={point} className="flex items-start gap-3">
                                        <span className="mt-1 h-2 w-2 rounded-full bg-indigo-400" aria-hidden />
                                        <span>{point}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <SlidePreview slide={currentSlideData} />
                    </div>
                    <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex gap-3">
                            <button
                                type="button"
                                className="rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10 disabled:border-white/10 disabled:text-slate-500"
                                onClick={() => goToSlide(currentSlide - 1)}
                                disabled={currentSlide === 0}
                            >
                                Previous
                            </button>
                            <button
                                type="button"
                                className="rounded-full bg-indigo-500/90 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/40 transition hover:bg-indigo-400"
                                onClick={() => goToSlide(currentSlide + 1)}
                                disabled={currentSlide === slides.length - 1}
                            >
                                Next
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {slides.map((slide, index) => (
                                <button
                                    key={slide.id}
                                    type="button"
                                    aria-label={`Go to ${slide.title}`}
                                    className={`h-3 w-8 rounded-full transition ${index === currentSlide ? 'bg-white' : 'bg-white/30'}`}
                                    onClick={() => goToSlide(index)}
                                />
                            ))}
                        </div>
                    </div>
                </section>

                <section className="rounded-[32px] border border-white/10 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6 shadow-xl sm:p-10">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div>
                            <p className="text-xs uppercase tracking-[0.4em] text-indigo-200">Workflow walk-through</p>
                            <h2 className="mt-3 text-3xl font-semibold">Tap a stage to keep the story moving</h2>
                        </div>
                        <span className="inline-flex items-center gap-2 text-sm text-slate-300">
                            <PlayCircle size={18} /> Suggested flow: left → right
                        </span>
                    </div>
                    <div className="mt-8 grid gap-6 md:grid-cols-[240px,1fr]">
                        <div className="space-y-3">
                            {workflowStages.map((stage) => (
                                <button
                                    key={stage.id}
                                    type="button"
                                    className={`w-full rounded-2xl border px-4 py-4 text-left transition ${
                                        stage.id === activeStage ? 'border-indigo-400 bg-indigo-500/10 text-white' : 'border-white/10 bg-white/5 text-slate-300'
                                    }`}
                                    onClick={() => setActiveStage(stage.id)}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-200">{stage.step}</span>
                                        <p className="text-lg font-semibold">{stage.title}</p>
                                    </div>
                                    <p className="mt-2 text-sm text-slate-300">{stage.summary}</p>
                                </button>
                            ))}
                        </div>
                        {activeStageData && (
                            <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-6">
                                <h3 className="text-2xl font-semibold text-white">{activeStageData.title}</h3>
                                <p className="mt-2 text-base text-slate-300">{activeStageData.detail}</p>
                                <div className="mt-6 rounded-2xl border border-white/10 bg-slate-900/70 p-4">
                                    <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{activeStageData.statLabel}</p>
                                    <p className="mt-1 text-3xl font-semibold text-white">{activeStageData.statValue}</p>
                                </div>
                                <p className="mt-4 text-sm text-indigo-200">{activeStageData.touchHint}</p>
                            </div>
                        )}
                    </div>
                </section>

                <section className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-xl sm:p-10">
                    <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Feature modules</p>
                    <h2 className="mt-3 text-3xl font-semibold">Mix and match talking points</h2>
                    <div className="mt-6 grid gap-4 md:grid-cols-3">
                        {modules.map((module) => (
                            <article key={module.id} className="rounded-2xl border border-white/10 bg-slate-900/60 p-5">
                                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.3em] text-indigo-200">
                                    <module.icon size={16} />
                                    {module.title}
                                </div>
                                <p className="mt-3 text-sm text-slate-300">{module.description}</p>
                                <ul className="mt-4 space-y-2 text-sm text-slate-200">
                                    {module.chips.map((chip) => (
                                        <li key={chip} className="flex items-center gap-2">
                                            <span className="h-1.5 w-1.5 rounded-full bg-indigo-300" aria-hidden />
                                            {chip}
                                        </li>
                                    ))}
                                </ul>
                            </article>
                        ))}
                    </div>
                </section>

                <section className="rounded-[32px] border border-white/10 bg-gradient-to-r from-indigo-600/80 to-purple-600/80 p-6 text-white shadow-xl sm:p-10">
                    <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                        <div>
                            <p className="text-xs uppercase tracking-[0.4em] text-white/70">Call to action</p>
                            <h2 className="mt-3 text-3xl font-semibold">Ready-made for executive demos</h2>
                            <p className="mt-3 text-base text-white/80">
                                Mirror this deck on an iPad, tap through the stages, and let the visuals do the heavy lifting while you tell the story.
                            </p>
                        </div>
                        <button className="rounded-full bg-white/90 px-6 py-3 text-base font-semibold text-slate-900 transition hover:bg-white">
                            Launch Live Walkthrough
                        </button>
                    </div>
                </section>
            </div>
        </div>
    );
}
