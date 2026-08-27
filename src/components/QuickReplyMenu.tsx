import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  Search, 
  Plus, 
  Check, 
  Sparkles, 
  Stethoscope, 
  ClipboardList, 
  FileText, 
  ShieldAlert, 
  HeartPulse, 
  Pill,
  X,
  ChevronDown,
  Trash2,
  Bookmark,
  Save
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export type QuickReplyTarget = 'diagnosis' | 'treatmentPlan' | 'notes' | 'medicalAssistanceMeasures' | 'medication';

export interface QuickReplyItem {
  id: string;
  category: 'diagnosis' | 'treatment' | 'medication' | 'notes' | 'followup' | 'custom';
  title: string;
  content: string;
  target: QuickReplyTarget;
  isCustom?: boolean;
}

const DEFAULT_QUICK_REPLIES: QuickReplyItem[] = [
  // Diagnosis
  {
    id: 'diag-uri',
    category: 'diagnosis',
    title: 'Viral Upper Respiratory Infection (URI)',
    content: 'Patient presents with symptoms consistent with acute viral upper respiratory tract infection. Rhinorrhea, mild non-productive cough, and pharyngeal erythema observed. Bilateral clear lungs, no focal chest consolidation or signs of secondary bacterial infection.',
    target: 'diagnosis'
  },
  {
    id: 'diag-headache',
    category: 'diagnosis',
    title: 'Tension-Type Headache (Acute)',
    content: 'Bilateral, non-pulsatile mild-to-moderate band-like head discomfort without photophobia, phonophobia, nausea, or focal neurological deficits. Consistent with acute tension headache related to stress/fatigue.',
    target: 'diagnosis'
  },
  {
    id: 'diag-dermatitis',
    category: 'diagnosis',
    title: 'Contact Dermatitis (Mild)',
    content: 'Erythematous pruritic maculopapular rash localized to area of allergen/irritant contact. Intact epidermal barrier without weeping, honey-crusting, cellulitis, or systemic involvement.',
    target: 'diagnosis'
  },
  {
    id: 'diag-gastro',
    category: 'diagnosis',
    title: 'Acute Gastroenteritis (Uncomplicated)',
    content: 'Transient gastrointestinal upset with mild nausea and self-limiting loose stools. Patient maintains adequate oral hydration. Abdomen soft, non-tender, non-distended with active bowel sounds.',
    target: 'diagnosis'
  },
  {
    id: 'diag-hypertension',
    category: 'diagnosis',
    title: 'Essential Hypertension Review',
    content: 'Blood pressure elevated above target baseline. Patient remains asymptomatic with no acute end-organ damage or neurological signs. Medication adherence and dietary sodium review conducted.',
    target: 'diagnosis'
  },
  {
    id: 'diag-lumbar',
    category: 'diagnosis',
    title: 'Acute Lumbar Muscular Strain',
    content: 'Localized lower back muscular tightness and tenderness on palpation following physical exertion. Negative straight leg raise, normal lower extremity reflexes, and intact sensory-motor exam.',
    target: 'diagnosis'
  },
  {
    id: 'diag-rhinitis',
    category: 'diagnosis',
    title: 'Allergic Rhinitis (Seasonal)',
    content: 'Bilateral nasal congestion, clear rhinorrhea, sneezing paroxysms, and ocular pruritus triggered by seasonal environmental allergens. Oropharynx and tympanic membranes normal.',
    target: 'diagnosis'
  },

  // Treatment Plan Steps
  {
    id: 'treat-hydration',
    category: 'treatment',
    title: 'Hydration & Electrolyte Protocol',
    content: 'Maintain vigorous oral hydration (2.5 - 3.0 L/day) using water, herbal broths, or oral rehydration solutions.',
    target: 'treatmentPlan'
  },
  {
    id: 'treat-rest',
    category: 'treatment',
    title: 'Rest & Physical Activity Modification',
    content: 'Strict cognitive and physical rest for 48 hours. Avoid heavy lifting, strenuous workouts, and extended screen time.',
    target: 'treatmentPlan'
  },
  {
    id: 'treat-saline',
    category: 'treatment',
    title: 'Saline Gargle & Steam Inhalation',
    content: 'Perform warm saline gargles 3-4 times daily and steam inhalation before sleep to relieve throat and nasal congestion.',
    target: 'treatmentPlan'
  },
  {
    id: 'treat-compress',
    category: 'treatment',
    title: 'Alternating Cold / Warm Compress',
    content: 'Apply cold ice pack wrapped in towel for 15-20 min every 4 hours for 48h, then transition to gentle moist heat.',
    target: 'treatmentPlan'
  },
  {
    id: 'treat-brat',
    category: 'treatment',
    title: 'BRAT Diet & Gut Rest',
    content: 'Follow bland BRAT diet (bananas, rice, applesauce, toast); strictly avoid dairy, spicy, fatty, and caffeine items for 72h.',
    target: 'treatmentPlan'
  },
  {
    id: 'treat-bp-log',
    category: 'treatment',
    title: 'Daily Blood Pressure Log',
    content: 'Record resting seated blood pressure twice daily (morning and evening) in a 7-day tracking log.',
    target: 'treatmentPlan'
  },
  {
    id: 'treat-posture',
    category: 'treatment',
    title: 'Ergonomic & Lumbar Support',
    content: 'Ensure lumbar support while seated; take 5-minute active stretching breaks every 45 minutes.',
    target: 'treatmentPlan'
  },

  // Follow-up & Red Flags
  {
    id: 'follow-48h',
    category: 'followup',
    title: '48-72h Telehealth Follow-up',
    content: 'Schedule follow-up consultation via Clinova portal if symptoms persist or do not improve within 48-72 hours.',
    target: 'treatmentPlan'
  },
  {
    id: 'follow-redflags',
    category: 'followup',
    title: 'Emergency Red Flags Warning',
    content: 'Seek emergency evaluation immediately if experiencing high fever (>39°C), dyspnea, chest pressure, severe unrelenting pain, or altered alertness.',
    target: 'treatmentPlan'
  },

  // Clinician Notes
  {
    id: 'notes-telehealth-verified',
    category: 'notes',
    title: 'Virtual Consultation Verified',
    content: 'Secure audio/video teleconsultation completed. Patient identity verified via Clinova cryptographic session. Verbal consent for virtual medical evaluation obtained and documented.',
    target: 'notes'
  },
  {
    id: 'notes-low-risk',
    category: 'notes',
    title: 'Low Risk Home Care Assessment',
    content: 'Clinical evaluation reveals low acute risk profile. Conservative outpatient supportive therapy and symptom monitoring initiated. No immediate inpatient escalation required.',
    target: 'notes'
  },
  {
    id: 'notes-rx-counseled',
    category: 'notes',
    title: 'Prescription & Allergy Checked',
    content: 'Electronic prescription authorized. Cross-referenced patient allergy history with zero contraindications. Patient counseled on medication timing, food intake, and warning signs.',
    target: 'notes'
  },

  // Medical Assistance Measures
  {
    id: 'med-assist-isolation',
    category: 'treatment',
    title: 'Home Isolation & Masking Protocol',
    content: 'Advised voluntary home convalescence and high-filtration mask wearing in shared spaces until afebrile for 24h without antipyretics.',
    target: 'medicalAssistanceMeasures'
  },
  {
    id: 'med-assist-vitals',
    category: 'treatment',
    title: 'Home Vital Sign Tele-monitoring',
    content: 'Patient instructed to record body temperature, heart rate, and pulse oximeter SpO2 twice daily and report readings under 95%.',
    target: 'medicalAssistanceMeasures'
  },

  // Medications Quick Add
  {
    id: 'med-paracetamol',
    category: 'medication',
    title: 'Paracetamol 500mg (SOS)',
    content: 'Paracetamol 500mg PO every 6 hours as needed for fever/pain (Max 3000mg/24h)',
    target: 'medication'
  },
  {
    id: 'med-ibuprofen',
    category: 'medication',
    title: 'Ibuprofen 400mg with food',
    content: 'Ibuprofen 400mg PO every 8 hours with food for anti-inflammatory pain relief',
    target: 'medication'
  },
  {
    id: 'med-cetirizine',
    category: 'medication',
    title: 'Cetirizine 10mg once daily',
    content: 'Cetirizine 10mg PO once daily at bedtime for allergic symptom control',
    target: 'medication'
  },
  {
    id: 'med-ors',
    category: 'medication',
    title: 'Oral Rehydration Salts (ORS)',
    content: 'Oral Rehydration Salts (1 sachet dissolved in 1L boiled and cooled water, sip throughout day)',
    target: 'medication'
  }
];

const STORAGE_KEY = 'clinova_custom_quick_replies';

interface QuickReplyMenuProps {
  onInsert: (target: QuickReplyTarget, content: string) => void;
  activeTarget?: QuickReplyTarget;
}

export const QuickReplyMenu: React.FC<QuickReplyMenuProps> = ({ 
  onInsert, 
  activeTarget = 'diagnosis' 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [customReplies, setCustomReplies] = useState<QuickReplyItem[]>([]);
  const [showAddCustom, setShowAddCustom] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const [customContent, setCustomContent] = useState('');
  const [customTarget, setCustomTarget] = useState<QuickReplyTarget>(activeTarget);
  const [recentlyInsertedId, setRecentlyInsertedId] = useState<string | null>(null);

  // Load custom quick replies
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setCustomReplies(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to load custom quick replies', e);
    }
  }, []);

  const saveCustomReplies = (replies: QuickReplyItem[]) => {
    setCustomReplies(replies);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(replies));
    } catch (e) {
      console.error('Failed to save custom quick replies', e);
    }
  };

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTitle.trim() || !customContent.trim()) return;

    const newItem: QuickReplyItem = {
      id: `custom-${Date.now()}`,
      category: 'custom',
      title: customTitle.trim(),
      content: customContent.trim(),
      target: customTarget,
      isCustom: true
    };

    const updated = [newItem, ...customReplies];
    saveCustomReplies(updated);
    setCustomTitle('');
    setCustomContent('');
    setShowAddCustom(false);
  };

  const handleDeleteCustom = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = customReplies.filter(item => item.id !== id);
    saveCustomReplies(updated);
  };

  const allReplies = [...customReplies, ...DEFAULT_QUICK_REPLIES];

  const filteredReplies = allReplies.filter(item => {
    const matchesCat = 
      selectedCategory === 'all' || 
      (selectedCategory === 'custom' && item.isCustom) ||
      item.category === selectedCategory ||
      (selectedCategory === 'diagnosis' && item.target === 'diagnosis') ||
      (selectedCategory === 'treatment' && item.target === 'treatmentPlan') ||
      (selectedCategory === 'notes' && item.target === 'notes') ||
      (selectedCategory === 'medication' && item.target === 'medication');

    const matchesSearch = 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.content.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCat && matchesSearch;
  });

  const handleSelectItem = (item: QuickReplyItem, overrideTarget?: QuickReplyTarget) => {
    const target = overrideTarget || item.target;
    onInsert(target, item.content);
    setRecentlyInsertedId(item.id);
    setTimeout(() => {
      setRecentlyInsertedId(null);
    }, 1800);
  };

  const categories = [
    { id: 'all', label: 'All Phrases', icon: Sparkles },
    { id: 'diagnosis', label: 'Diagnosis', icon: Stethoscope },
    { id: 'treatment', label: 'Treatment Plans', icon: ClipboardList },
    { id: 'medication', label: 'Medications', icon: Pill },
    { id: 'notes', label: 'Private Notes', icon: FileText },
    { id: 'followup', label: 'Red Flags & Follow-up', icon: ShieldAlert },
    { id: 'custom', label: `My Snippets (${customReplies.length})`, icon: Bookmark }
  ];

  const getTargetBadge = (target: QuickReplyTarget) => {
    switch (target) {
      case 'diagnosis':
        return <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded-md">Diagnosis</span>;
      case 'treatmentPlan':
        return <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded-md">Treatment Step</span>;
      case 'notes':
        return <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-bold rounded-md">Clinician Notes</span>;
      case 'medicalAssistanceMeasures':
        return <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-[10px] font-bold rounded-md">Assistance</span>;
      case 'medication':
        return <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-md">Medication</span>;
    }
  };

  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        id="quick-reply-trigger-btn"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-black shadow-md shadow-blue-500/20 hover:shadow-blue-500/30 transition-all active:scale-95"
      >
        <Zap className="w-4 h-4 fill-white/20 animate-pulse text-amber-300" />
        <span>Quick Reply Menu</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-[2px]" 
              onClick={() => setIsOpen(false)} 
            />

            {/* Menu Popover / Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.15 }}
              id="quick-reply-menu-panel"
              className="fixed inset-x-4 top-20 bottom-8 md:bottom-auto md:absolute md:inset-auto md:right-0 md:top-12 md:w-[620px] bg-white rounded-3xl shadow-2xl border border-slate-200/80 z-50 flex flex-col overflow-hidden max-h-[85vh]"
            >
              {/* Header */}
              <div className="p-4 md:p-5 bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300">
                    <Zap className="w-4 h-4 fill-current text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black tracking-tight text-white flex items-center gap-2">
                      Clinical Quick Replies
                      <span className="text-[10px] font-bold px-1.5 py-0.5 bg-blue-500/30 text-blue-200 rounded-md border border-blue-400/20">
                        1-Click Insert
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-300">
                      Standardized clinical phrases, diagnoses & treatment steps
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddCustom(!showAddCustom)}
                    className="px-2.5 py-1 bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg text-xs font-bold text-white transition-colors flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Add Snippet</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Add Custom Snippet Form */}
              <AnimatePresence>
                {showAddCustom && (
                  <motion.form
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    onSubmit={handleAddCustom}
                    className="bg-blue-50/60 p-4 border-b border-blue-100 overflow-hidden space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-black text-blue-900 flex items-center gap-1.5">
                        <Bookmark className="w-3.5 h-3.5 text-blue-600" />
                        Create Custom Quick Reply
                      </p>
                      <button
                        type="button"
                        onClick={() => setShowAddCustom(false)}
                        className="text-[11px] text-blue-600 font-bold hover:underline"
                      >
                        Cancel
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Phrase Title (e.g., Asthma Nebulizer Protocol)"
                        value={customTitle}
                        onChange={(e) => setCustomTitle(e.target.value)}
                        required
                        className="w-full px-3 py-2 bg-white border border-blue-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                      <select
                        value={customTarget}
                        onChange={(e) => setCustomTarget(e.target.value as QuickReplyTarget)}
                        className="w-full px-3 py-2 bg-white border border-blue-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                      >
                        <option value="diagnosis">Insert into Diagnosis & Findings</option>
                        <option value="treatmentPlan">Insert as Treatment Plan Step</option>
                        <option value="notes">Insert into Clinician Notes (Private)</option>
                        <option value="medicalAssistanceMeasures">Insert into Medical Assistance Measures</option>
                        <option value="medication">Insert as Prescribed Medication</option>
                      </select>
                    </div>

                    <textarea
                      placeholder="Enter the complete phrase content to insert..."
                      value={customContent}
                      onChange={(e) => setCustomContent(e.target.value)}
                      required
                      rows={2}
                      className="w-full px-3 py-2 bg-white border border-blue-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                    />

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-sm flex items-center gap-1.5"
                      >
                        <Save className="w-3.5 h-3.5" />
                        Save Quick Reply
                      </button>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>

              {/* Search & Categories Bar */}
              <div className="p-3 bg-slate-50 border-b border-slate-100 space-y-2.5">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search clinical phrases by symptom, condition, or keyword..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none placeholder:text-slate-400"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Category Pills */}
                <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                  {categories.map((cat) => {
                    const Icon = cat.icon;
                    const isActive = selectedCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all ${
                          isActive
                            ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                            : 'bg-white text-slate-600 border border-slate-200 hover:border-blue-300 hover:bg-slate-50'
                        }`}
                      >
                        <Icon className={`w-3 h-3 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                        <span>{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Phrase List */}
              <div className="p-3 overflow-y-auto flex-1 divide-y divide-slate-100 space-y-2">
                {filteredReplies.length === 0 ? (
                  <div className="py-12 text-center text-slate-400">
                    <HeartPulse className="w-8 h-8 text-slate-300 mx-auto mb-2 opacity-50" />
                    <p className="text-xs font-bold text-slate-600">No matching phrases found</p>
                    <p className="text-[11px] text-slate-400 mt-1">Try adjusting your search keyword or create a custom snippet.</p>
                  </div>
                ) : (
                  filteredReplies.map((item) => {
                    const isInserted = recentlyInsertedId === item.id;
                    return (
                      <div
                        key={item.id}
                        className="pt-2 first:pt-0 group hover:bg-blue-50/40 p-2.5 rounded-2xl transition-all border border-transparent hover:border-blue-100"
                      >
                        <div className="flex items-start justify-between gap-3 mb-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-xs font-black text-slate-900 group-hover:text-blue-700 transition-colors">
                              {item.title}
                            </h4>
                            {getTargetBadge(item.target)}
                            {item.isCustom && (
                              <span className="px-1.5 py-0.2 bg-purple-50 text-purple-700 text-[9px] font-bold rounded">
                                Custom
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            {item.isCustom && (
                              <button
                                type="button"
                                onClick={(e) => handleDeleteCustom(item.id, e)}
                                title="Delete Custom Snippet"
                                className="p-1 text-slate-300 hover:text-red-500 rounded transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => handleSelectItem(item)}
                              className={`px-3 py-1 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                                isInserted
                                  ? 'bg-green-600 text-white shadow-sm'
                                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-500/10 active:scale-95'
                              }`}
                            >
                              {isInserted ? (
                                <>
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Inserted!</span>
                                </>
                              ) : (
                                <>
                                  <Plus className="w-3.5 h-3.5" />
                                  <span>Insert</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>

                        <p className="text-[11px] text-slate-600 leading-relaxed bg-white/70 p-2 rounded-xl border border-slate-100/80">
                          {item.content}
                        </p>

                        {/* Quick alternative target actions */}
                        <div className="mt-2 flex items-center gap-1.5 text-[10px] text-slate-400">
                          <span className="font-semibold text-slate-400">Quick insert to:</span>
                          <button
                            type="button"
                            onClick={() => handleSelectItem(item, 'diagnosis')}
                            className="text-blue-600 hover:underline hover:text-blue-800 font-bold"
                          >
                            + Diagnosis
                          </button>
                          <span>•</span>
                          <button
                            type="button"
                            onClick={() => handleSelectItem(item, 'treatmentPlan')}
                            className="text-indigo-600 hover:underline hover:text-indigo-800 font-bold"
                          >
                            + Treatment Plan
                          </button>
                          <span>•</span>
                          <button
                            type="button"
                            onClick={() => handleSelectItem(item, 'notes')}
                            className="text-slate-600 hover:underline hover:text-slate-800 font-bold"
                          >
                            + Notes
                          </button>
                          <span>•</span>
                          <button
                            type="button"
                            onClick={() => handleSelectItem(item, 'medicalAssistanceMeasures')}
                            className="text-amber-600 hover:underline hover:text-amber-800 font-bold"
                          >
                            + Assistance
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span className="flex items-center gap-1.5 font-medium">
                  <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  Clinova Clinical Decision Presets
                </span>
                <span className="font-bold text-slate-600">
                  {filteredReplies.length} phrases available
                </span>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

// Inline Quick Pills Component for high-frequency 1-click insertion right above textareas
interface InlineQuickPillsProps {
  label?: string;
  items: Array<{ title: string; text: string }>;
  onSelect: (text: string) => void;
}

export const InlineQuickPills: React.FC<InlineQuickPillsProps> = ({ label = 'Quick phrases:', items, onSelect }) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handlePick = (text: string, idx: number) => {
    onSelect(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 1500);
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5 mb-2 text-xs">
      <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
        <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
        {label}
      </span>
      {items.map((item, idx) => {
        const isCopied = copiedIndex === idx;
        return (
          <button
            key={idx}
            type="button"
            onClick={() => handlePick(item.text, idx)}
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold transition-all border ${
              isCopied
                ? 'bg-green-600 text-white border-green-600 shadow-sm'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200'
            }`}
          >
            {isCopied ? <Check className="w-3 h-3" /> : <Plus className="w-2.5 h-2.5 text-slate-400" />}
            <span>{item.title}</span>
          </button>
        );
      })}
    </div>
  );
};
