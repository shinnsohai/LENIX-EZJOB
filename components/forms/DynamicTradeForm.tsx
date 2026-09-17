
import React, { useState, useMemo } from 'react';
import { SECTORS, Sector, Category, Trade } from '../../data/tradeCategories';
import { UserSkill, TradeSpecifics } from '../../types';
import { Plus, Trash2, Star, CheckCircle2, X } from 'lucide-react';

interface DynamicTradeFormProps {
    skills: UserSkill[];
    onSkillsChange: (skills: UserSkill[]) => void;
}

// Reasonable ceiling on how many trades a single profile can list.
const MAX_SKILLS = 10;
// Same ceiling logic for tags on a single trade — generous, but not unbounded.
const MAX_TAGS_PER_SKILL = 20;

/** Looks up a trade's predefined skill-tag catalog by name, searching every
 * sector/category. Worker-added trades always come from this catalog, but a
 * trade added before a catalog update (or one that's since been removed)
 * can end up with no match — callers fall back to custom-tag-only in that
 * case rather than failing. */
function findTradeDefinition(tradeName: string): Trade | undefined {
    for (const sector of SECTORS) {
        for (const category of sector.categories) {
            const trade = category.trades.find(t => t.name === tradeName);
            if (trade) return trade;
        }
    }
    return undefined;
}

export default function DynamicTradeForm({ skills, onSkillsChange }: DynamicTradeFormProps) {
    // If no skills exist, default to adding mode
    const [isAdding, setIsAdding] = useState(skills.length === 0);

    // Selector State for NEW skill being added
    const [activeSector, setActiveSector] = useState<Sector | null>(null);
    const [activeCategory, setActiveCategory] = useState<Category | null>(null);
    const [tempTrade, setTempTrade] = useState<string>('');
    const [tempTags, setTempTags] = useState<TradeSpecifics>({});
    const [formError, setFormError] = useState<string | null>(null);
    // New-skill custom tag input (Step 4, alongside the predefined catalog).
    const [customTagDraft, setCustomTagDraft] = useState('');

    // Editing tags on an already-added skill: which card's "add tag" panel
    // is open, plus its own custom-tag text input.
    const [editingTagsIndex, setEditingTagsIndex] = useState<number | null>(null);
    const [editCustomTagDraft, setEditCustomTagDraft] = useState('');

    // Helper to find trade object definition based on tempTrade name
    const currentTradeObj = useMemo(() => {
        if (!activeCategory) return null;
        return activeCategory.trades.find(t => t.name === tempTrade);
    }, [activeCategory, tempTrade]);

    const handleAddSkill = () => {
        if (!tempTrade) return;

        if (skills.length >= MAX_SKILLS) {
            setFormError(`You can add up to ${MAX_SKILLS} skills.`);
            return;
        }

        const isDuplicate = skills.some(s => s.trade.toLowerCase() === tempTrade.toLowerCase());
        if (isDuplicate) {
            setFormError(`"${tempTrade}" has already been added.`);
            return;
        }

        const newSkill: UserSkill = {
            trade: tempTrade,
            tags: tempTags,
            isPrimary: skills.length === 0 // First skill is automatically primary
        };

        onSkillsChange([...skills, newSkill]);
        resetForm();
    };

    const resetForm = () => {
        setIsAdding(false);
        setActiveSector(null);
        setActiveCategory(null);
        setTempTrade('');
        setTempTags({});
        setCustomTagDraft('');
        setFormError(null);
    };

    const handleRemoveSkill = (index: number) => {
        const newSkills = [...skills];
        const removed = newSkills.splice(index, 1)[0];
        
        // If we removed the primary skill, promote the first remaining skill to primary
        if (removed.isPrimary && newSkills.length > 0) {
            newSkills[0].isPrimary = true;
        }
        
        onSkillsChange(newSkills);
        // Indices shift on removal — close any open "add tag" panel rather
        // than risk it pointing at the wrong card afterward.
        setEditingTagsIndex(null);
        // If list is empty, show add form again
        if (newSkills.length === 0) setIsAdding(true);
    };

    const handleSetPrimary = (index: number) => {
        const newSkills = skills.map((s, i) => ({
            ...s,
            isPrimary: i === index
        }));
        onSkillsChange(newSkills);
    };

    const handleTagToggle = (tag: string) => {
        setTempTags(prev => ({
            ...prev,
            [tag]: !prev[tag]
        }));
    };

    const handleAddCustomDraftTag = () => {
        const trimmed = customTagDraft.trim();
        if (!trimmed) return;
        setTempTags(prev => ({ ...prev, [trimmed]: true }));
        setCustomTagDraft('');
    };

    // Adds or removes one tag on an already-added skill card. Setting the
    // value explicitly (rather than toggling) means adding a custom tag
    // that happens to match an already-selected predefined one's name is a
    // safe no-op instead of accidentally removing it.
    const handleSetExistingTag = (skillIndex: number, tag: string, value: boolean) => {
        const newSkills = skills.map((s, i) => {
            if (i !== skillIndex) return s;
            const newTags = { ...s.tags };
            if (value) newTags[tag] = true; else delete newTags[tag];
            return { ...s, tags: newTags };
        });
        onSkillsChange(newSkills);
    };

    const handleAddCustomTagToExisting = (skillIndex: number) => {
        const trimmed = editCustomTagDraft.trim();
        if (!trimmed) return;
        const activeTagCount = Object.values(skills[skillIndex].tags).filter(Boolean).length;
        if (activeTagCount >= MAX_TAGS_PER_SKILL) return;
        handleSetExistingTag(skillIndex, trimmed, true);
        setEditCustomTagDraft('');
    };

    return (
        <div className="space-y-8">
            
            {/* --- List of Selected Skills (Card Stack Logic) --- */}
            {skills.length > 0 && (
                <div className="space-y-4">
                    {skills.map((skill, idx) => {
                        const tradeDef = findTradeDefinition(skill.trade);
                        const activeTags = Object.entries(skill.tags).filter(([, v]) => v).map(([tag]) => tag);
                        const availablePredefinedTags = (tradeDef?.skills ?? []).filter(t => !skill.tags[t]);
                        const isEditingTags = editingTagsIndex === idx;

                        return (
                        <div
                            key={skill.trade}
                            className={`relative p-5 rounded-xl border-2 transition-all ${
                                skill.isPrimary
                                    ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 shadow-md'
                                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-600'
                            }`}
                        >
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-bold text-lg text-slate-800 dark:text-white">{skill.trade}</h3>
                                        {skill.isPrimary ? (
                                            <span className="bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                                                <Star size={12} fill="currentColor" /> Primary Trade
                                            </span>
                                        ) : (
                                            <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold px-2 py-1 rounded-full">
                                                Secondary
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {activeTags.map(tag => (
                                            <span
                                                key={tag}
                                                className="flex items-center gap-1 text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 pl-2 pr-1 py-1 rounded text-slate-600 dark:text-slate-300"
                                            >
                                                {tag}
                                                <button
                                                    type="button"
                                                    onClick={() => handleSetExistingTag(idx, tag, false)}
                                                    className="text-slate-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400 p-0.5 rounded-full"
                                                    aria-label={`Remove ${tag} skill tag`}
                                                >
                                                    <X size={12} aria-hidden="true" />
                                                </button>
                                            </span>
                                        ))}
                                        {activeTags.length === 0 && !isEditingTags && (
                                            <span className="text-xs text-slate-400 dark:text-slate-500 italic">No specific tags selected</span>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setEditingTagsIndex(isEditingTags ? null : idx);
                                                setEditCustomTagDraft('');
                                            }}
                                            className="text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 border border-dashed border-emerald-300 dark:border-emerald-800 px-2 py-1 rounded flex items-center gap-1"
                                        >
                                            <Plus size={12} /> {isEditingTags ? 'Done' : 'Add Skill Tag'}
                                        </button>
                                    </div>

                                    {isEditingTags && (
                                        <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-950/50 rounded-lg border border-slate-200 dark:border-slate-800 space-y-3">
                                            {availablePredefinedTags.length > 0 && (
                                                <div>
                                                    <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">Suggested for {skill.trade}</p>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {availablePredefinedTags.map(tag => (
                                                            <button
                                                                key={tag}
                                                                type="button"
                                                                onClick={() => handleSetExistingTag(idx, tag, true)}
                                                                className="text-xs px-2.5 py-1 rounded-md border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-400 bg-white dark:bg-slate-900"
                                                            >
                                                                + {tag}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            <div>
                                                <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">Or add your own</p>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        value={editCustomTagDraft}
                                                        onChange={e => setEditCustomTagDraft(e.target.value)}
                                                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddCustomTagToExisting(idx); } }}
                                                        placeholder="e.g. Forklift Licence (Class 3)"
                                                        className="flex-1 px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => handleAddCustomTagToExisting(idx)}
                                                        disabled={!editCustomTagDraft.trim()}
                                                        className="px-4 py-2 text-sm font-bold rounded-lg bg-slate-900 dark:bg-emerald-600 text-white hover:bg-slate-800 dark:hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                    >
                                                        Add
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center gap-2">
                                    {!skill.isPrimary && (
                                        <button
                                            onClick={() => handleSetPrimary(idx)}
                                            className="text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 underline px-2"
                                        >
                                            Make Primary
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleRemoveSkill(idx)}
                                        className="text-slate-400 dark:text-slate-500 hover:text-red-500 p-2"
                                        title="Remove Skill"
                                        aria-label={`Remove ${skill.trade || 'this'} skill`}
                                    >
                                        <Trash2 size={18} aria-hidden="true" />
                                    </button>
                                </div>
                            </div>
                        </div>
                        );
                    })}
                </div>
            )}

            {/* --- Add Skill Button --- */}
            {!isAdding && (
                skills.length >= MAX_SKILLS ? (
                    <p className="w-full py-3 text-center text-sm text-slate-400 dark:text-slate-500 italic">
                        Maximum of {MAX_SKILLS} skills reached.
                    </p>
                ) : (
                    <button
                        onClick={() => { setFormError(null); setIsAdding(true); }}
                        className="w-full py-3 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl text-slate-500 dark:text-slate-400 font-medium hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-all flex items-center justify-center gap-2"
                    >
                        <Plus size={20} /> Add Another Skill
                    </button>
                )
            )}

            {/* --- Add New Skill Form (Steps 1-4) --- */}
            {isAdding && (
                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-lg animate-fadeIn">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-lg text-slate-800 dark:text-white">Add {skills.length > 0 ? 'Secondary' : 'Primary'} Skill</h3>
                        {skills.length > 0 && (
                            <button onClick={resetForm} className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white">Cancel</button>
                        )}
                    </div>

                    <div className="space-y-6">
                        {/* Step 1: Sector */}
                        <div>
                            <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Step 1: Industry Sector</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {SECTORS.map((sector) => (
                                    <button
                                        key={sector.name}
                                        type="button"
                                        onClick={() => {
                                            setActiveSector(sector);
                                            setActiveCategory(null);
                                            setTempTrade('');
                                        }}
                                        className={`p-3 rounded-lg border text-left text-sm font-medium transition-all ${
                                            activeSector?.name === sector.name
                                                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300'
                                                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-emerald-300'
                                        }`}
                                    >
                                        {sector.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Step 2: Category */}
                        {activeSector && (
                            <div>
                                <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Step 2: Category</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {activeSector.categories.map((cat) => (
                                        <button
                                            key={cat.name}
                                            type="button"
                                            onClick={() => {
                                                setActiveCategory(cat);
                                                setTempTrade('');
                                            }}
                                            className={`p-3 rounded-lg border text-left text-sm font-medium transition-all ${
                                                activeCategory?.name === cat.name
                                                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300'
                                                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-emerald-300'
                                            }`}
                                        >
                                            {cat.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Step 3: Trade */}
                        {activeCategory && (
                            <div>
                                <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Step 3: Specific Trade</h4>
                                <div className="flex flex-wrap gap-2">
                                    {activeCategory.trades.map((t) => (
                                        <button
                                            key={t.name}
                                            type="button"
                                            onClick={() => {
                                                setTempTrade(t.name);
                                                setTempTags({}); // Reset tags when trade changes
                                            }}
                                            className={`px-4 py-2 rounded-full border text-sm font-medium transition-all ${
                                                tempTrade === t.name
                                                    ? 'bg-emerald-600 text-white border-emerald-600'
                                                    : 'bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:border-emerald-400'
                                            }`}
                                        >
                                            {t.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Step 4: Skills (Tags) */}
                        {currentTradeObj && (
                            <div className="p-4 bg-slate-50 dark:bg-slate-950/50 rounded-lg border border-slate-200 dark:border-slate-800">
                                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Step 4: Select Skill Tags</h4>
                                <div className="flex flex-wrap gap-2">
                                    {currentTradeObj.skills.map((skill) => (
                                        <label
                                            key={skill}
                                            className={`cursor-pointer px-3 py-2 rounded-md border text-xs font-medium transition-all select-none ${
                                                tempTags[skill]
                                                    ? 'bg-white dark:bg-slate-900 border-emerald-500 text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-500'
                                                    : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-emerald-300'
                                            }`}
                                        >
                                            <input
                                                type="checkbox"
                                                className="hidden"
                                                checked={!!tempTags[skill]}
                                                onChange={() => handleTagToggle(skill)}
                                            />
                                            {skill}
                                        </label>
                                    ))}
                                    {Object.keys(tempTags).filter(t => tempTags[t] && !currentTradeObj.skills.includes(t)).map(customTag => (
                                        <span
                                            key={customTag}
                                            className="flex items-center gap-1 px-3 py-2 rounded-md border border-emerald-500 bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-500 text-xs font-medium"
                                        >
                                            {customTag}
                                            <button
                                                type="button"
                                                onClick={() => handleTagToggle(customTag)}
                                                className="text-emerald-500 hover:text-red-500 p-0.5 rounded-full"
                                                aria-label={`Remove ${customTag} skill tag`}
                                            >
                                                <X size={12} aria-hidden="true" />
                                            </button>
                                        </span>
                                    ))}
                                </div>

                                <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                                    <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">Don't see your skill? Add your own</p>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={customTagDraft}
                                            onChange={e => setCustomTagDraft(e.target.value)}
                                            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddCustomDraftTag(); } }}
                                            placeholder="e.g. Forklift Licence (Class 3)"
                                            className="flex-1 px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleAddCustomDraftTag}
                                            disabled={!customTagDraft.trim()}
                                            className="px-4 py-2 text-sm font-bold rounded-lg bg-slate-900 dark:bg-emerald-600 text-white hover:bg-slate-800 dark:hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            Add
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Confirm Button */}
                        {tempTrade && (
                            <div className="pt-4 flex flex-col items-end gap-2">
                                {formError && (
                                    <p className="text-sm text-red-500 dark:text-red-400 font-medium">{formError}</p>
                                )}
                                <button
                                    onClick={handleAddSkill}
                                    className="bg-slate-900 dark:bg-emerald-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-slate-800 dark:hover:bg-emerald-700 transition-colors flex items-center gap-2"
                                >
                                    <CheckCircle2 size={18} />
                                    Confirm & Add Skill
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
