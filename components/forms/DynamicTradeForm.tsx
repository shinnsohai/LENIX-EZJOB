
import React, { useState, useMemo } from 'react';
import { SECTORS, Sector, Category } from '../../data/tradeCategories';
import { UserSkill, TradeSpecifics } from '../../types';
import { Plus, Trash2, Star, CheckCircle2, BadgeCheck } from 'lucide-react';

interface DynamicTradeFormProps {
    skills: UserSkill[];
    onSkillsChange: (skills: UserSkill[]) => void;
}

// Reasonable ceiling on how many trades a single profile can list.
const MAX_SKILLS = 10;

export default function DynamicTradeForm({ skills, onSkillsChange }: DynamicTradeFormProps) {
    // If no skills exist, default to adding mode
    const [isAdding, setIsAdding] = useState(skills.length === 0);

    // Selector State for NEW skill being added
    const [activeSector, setActiveSector] = useState<Sector | null>(null);
    const [activeCategory, setActiveCategory] = useState<Category | null>(null);
    const [tempTrade, setTempTrade] = useState<string>('');
    const [tempTags, setTempTags] = useState<TradeSpecifics>({});
    const [formError, setFormError] = useState<string | null>(null);

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

    return (
        <div className="space-y-8">
            
            {/* --- List of Selected Skills (Card Stack Logic) --- */}
            {skills.length > 0 && (
                <div className="space-y-4">
                    {skills.map((skill, idx) => (
                        <div
                            key={skill.trade}
                            className={`relative p-5 rounded-xl border-2 transition-all ${
                                skill.isPrimary 
                                    ? 'border-emerald-500 bg-emerald-50/50 shadow-md' 
                                    : 'border-slate-200 bg-white hover:border-slate-300'
                            }`}
                        >
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-bold text-lg text-slate-800">{skill.trade}</h3>
                                        {skill.isPrimary ? (
                                            <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                                                <Star size={12} fill="currentColor" /> Primary Trade
                                            </span>
                                        ) : (
                                            <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2 py-1 rounded-full">
                                                Secondary
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {Object.entries(skill.tags).filter(([_, v]) => v).map(([tag]) => (
                                            <span key={tag} className="text-xs bg-white border border-slate-200 px-2 py-1 rounded text-slate-600">
                                                {tag}
                                            </span>
                                        ))}
                                        {Object.keys(skill.tags).length === 0 && <span className="text-xs text-slate-400 italic">No specific tags selected</span>}
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                    {!skill.isPrimary && (
                                        <button 
                                            onClick={() => handleSetPrimary(idx)}
                                            className="text-xs font-medium text-emerald-600 hover:text-emerald-800 underline px-2"
                                        >
                                            Make Primary
                                        </button>
                                    )}
                                    <button 
                                        onClick={() => handleRemoveSkill(idx)}
                                        className="text-slate-400 hover:text-red-500 p-1"
                                        title="Remove Skill"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* --- Add Skill Button --- */}
            {!isAdding && (
                skills.length >= MAX_SKILLS ? (
                    <p className="w-full py-3 text-center text-sm text-slate-400 italic">
                        Maximum of {MAX_SKILLS} skills reached.
                    </p>
                ) : (
                    <button
                        onClick={() => { setFormError(null); setIsAdding(true); }}
                        className="w-full py-3 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 font-medium hover:border-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 transition-all flex items-center justify-center gap-2"
                    >
                        <Plus size={20} /> Add Another Skill
                    </button>
                )
            )}

            {/* --- Add New Skill Form (Steps 1-4) --- */}
            {isAdding && (
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-lg animate-fadeIn">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-lg text-slate-800">Add {skills.length > 0 ? 'Secondary' : 'Primary'} Skill</h3>
                        {skills.length > 0 && (
                            <button onClick={resetForm} className="text-sm text-slate-500 hover:text-slate-800">Cancel</button>
                        )}
                    </div>

                    <div className="space-y-6">
                        {/* Step 1: Sector */}
                        <div>
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Step 1: Industry Sector</h4>
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
                                                ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                                                : 'border-slate-200 text-slate-600 hover:border-emerald-300'
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
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Step 2: Category</h4>
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
                                                    ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                                                    : 'border-slate-200 text-slate-600 hover:border-emerald-300'
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
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Step 3: Specific Trade</h4>
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
                                                    : 'bg-white text-slate-700 border-slate-300 hover:border-emerald-400'
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
                            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                                <h4 className="text-sm font-bold text-slate-700 mb-2">Step 4: Select Skill Tags</h4>
                                <div className="flex flex-wrap gap-2">
                                    {currentTradeObj.skills.map((skill) => (
                                        <label
                                            key={skill}
                                            className={`cursor-pointer px-3 py-2 rounded-md border text-xs font-medium transition-all select-none ${
                                                tempTags[skill]
                                                    ? 'bg-white border-emerald-500 text-emerald-700 ring-1 ring-emerald-500'
                                                    : 'bg-white border-slate-200 text-slate-600 hover:border-emerald-300'
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
                                </div>
                            </div>
                        )}

                        {/* Confirm Button */}
                        {tempTrade && (
                            <div className="pt-4 flex flex-col items-end gap-2">
                                {formError && (
                                    <p className="text-sm text-red-500 font-medium">{formError}</p>
                                )}
                                <button
                                    onClick={handleAddSkill}
                                    className="bg-slate-900 text-white px-6 py-2 rounded-lg font-bold hover:bg-slate-800 transition-colors flex items-center gap-2"
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
