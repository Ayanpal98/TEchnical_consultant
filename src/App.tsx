import { useState, useEffect, useMemo, useRef } from 'react';
import { 
  BrowserRouter as Router, 
  Routes, 
  Route, 
  Navigate, 
  Link, 
  useNavigate 
} from 'react-router-dom';
import { 
  Camera, 
  MapPin, 
  ClipboardList, 
  Users, 
  Bell, 
  LogOut, 
  Plus, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Map as MapIcon,
  Search,
  User as UserIcon,
  Activity,
  Database,
  WifiOff,
  UserCircle,
  Edit2,
  Save,
  BookOpen,
  HelpCircle,
  Info,
  Star,
  Navigation,
  ShieldCheck,
  UserCheck,
  Stethoscope,
  FileText,
  Pill,
  Check,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Map, Marker } from 'pigeon-maps';
import { UserProfile, MedicalCase, UserRole, CaseStatus } from './types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import { ErrorBoundary } from './components/ErrorBoundary';
import { mockAuth, mockDb } from './lib/mockDb';
import { SPECIALTIES, Specialty } from './constants';
import { getConsultantSuggestions, ConsultantSuggestion } from './services/routingService';

// Utility for tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Components ---

const LoadingScreen = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-white z-50">
    <motion.div 
      animate={{ rotate: 360 }}
      transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
      className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"
    />
  </div>
);

const ConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = "Confirm", 
  cancelText = "Cancel",
  type = "info"
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  onConfirm: () => void, 
  title: string, 
  message: string, 
  confirmText?: string, 
  cancelText?: string,
  type?: "info" | "danger" | "warning"
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden"
      >
        <div className="p-6 text-center">
          <div className={cn(
            "w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4",
            type === "danger" ? "bg-red-50 text-red-600" : 
            type === "warning" ? "bg-amber-50 text-amber-600" : 
            "bg-blue-50 text-blue-600"
          )}>
            {type === "danger" ? <AlertCircle className="w-6 h-6" /> : 
             type === "warning" ? <Info className="w-6 h-6" /> : 
             <CheckCircle className="w-6 h-6" />}
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
          <p className="text-sm text-gray-500 leading-relaxed">{message}</p>
        </div>
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-100 transition-all text-sm"
          >
            {cancelText}
          </button>
          <button 
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={cn(
              "flex-1 py-2.5 text-white rounded-xl font-bold transition-all text-sm",
              type === "danger" ? "bg-red-600 hover:bg-red-700" : 
              type === "warning" ? "bg-amber-600 hover:bg-amber-700" : 
              "bg-blue-600 hover:bg-blue-700"
            )}
          >
            {confirmText}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const Navbar = ({ userProfile }: { userProfile: UserProfile | null }) => {
  const navigate = useNavigate();
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  const handleSignOut = () => {
    mockAuth.logout();
    window.dispatchEvent(new Event('auth-change'));
    navigate('/');
  };

  return (
    <nav className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-bold text-xl text-blue-600">
          <Activity className="w-6 h-6" />
          <span>TeleHealth Connect</span>
        </Link>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Link 
              to="/manual" 
              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
              title="User Manual"
            >
              <HelpCircle className="w-5 h-5" />
            </Link>
            
            <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 rounded-full border border-amber-100 text-[10px] font-bold uppercase tracking-wider shadow-sm">
              <Database className="w-3 h-3" />
              <span>Local Storage Mode</span>
            </div>
            
            {!isOnline && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-700 rounded-full border border-red-100 text-[10px] font-bold uppercase tracking-wider shadow-sm"
              >
                <WifiOff className="w-3 h-3" />
                <span>Offline</span>
              </motion.div>
            )}
          </div>

          {userProfile && (
            <div className="hidden md:flex items-center gap-3 px-3 py-1.5 bg-gray-50 rounded-full border border-gray-100">
              <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-bold">
                {userProfile.displayName?.[0] || userProfile.email[0]}
              </div>
              <span className="text-sm font-medium text-gray-700">{userProfile.role}</span>
            </div>
          )}
          <button 
            onClick={handleSignOut}
            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </nav>
  );
};

// --- Patient Views ---

const PatientDashboard = ({ userProfile }: { userProfile: UserProfile }) => {
  const [cases, setCases] = useState<MedicalCase[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [view, setView] = useState<'cases' | 'profile'>('cases');
  const [viewingCase, setViewingCase] = useState<MedicalCase | null>(null);

  useEffect(() => {
    return mockDb.subscribeToCases((allCases) => {
      const filtered = allCases
        .filter(c => c.patientId === userProfile.uid)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setCases(filtered);
    });
  }, [userProfile.uid]);

  const filteredCases = useMemo(() => {
    if (!searchQuery.trim()) return cases;
    const query = searchQuery.toLowerCase();
    return cases.filter(c => 
      c.symptoms.toLowerCase().includes(query) || 
      c.requiredSpecialty?.toLowerCase().includes(query) ||
      c.status.toLowerCase().includes(query)
    );
  }, [cases, searchQuery]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm">
            <button 
              onClick={() => setView('cases')}
              className={cn(
                "px-4 py-2 rounded-xl font-bold transition-all text-sm",
                view === 'cases' ? "bg-blue-600 text-white shadow-md shadow-blue-100" : "text-gray-500 hover:bg-gray-50"
              )}
            >
              Cases
            </button>
            <button 
              onClick={() => setView('profile')}
              className={cn(
                "px-4 py-2 rounded-xl font-bold transition-all text-sm",
                view === 'profile' ? "bg-blue-600 text-white shadow-md shadow-blue-100" : "text-gray-500 hover:bg-gray-50"
              )}
            >
              My Profile
            </button>
          </div>
          {view === 'cases' && (
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Health Cases</h1>
              <p className="text-xs text-gray-500">Manage and track your medical consultations</p>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-3 bg-white border border-gray-100 rounded-xl text-gray-500 hover:text-blue-600 transition-all relative"
            >
              <Bell className="w-5 h-5" />
              {cases.some(c => c.status !== 'pending') && (
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
              )}
            </button>
            
            <AnimatePresence>
              {showNotifications && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 z-50"
                >
                  <h4 className="font-bold text-sm mb-3">Notifications</h4>
                  <div className="space-y-3">
                    {cases.filter(c => c.status !== 'pending').slice(0, 3).map(c => (
                      <div key={c.id} className="text-xs">
                        <p className="font-semibold text-gray-900">Case Update</p>
                        <p className="text-gray-500">Your case "{c.symptoms.slice(0, 20)}..." is now <span className="text-blue-600 font-bold">{c.status}</span></p>
                      </div>
                    ))}
                    {cases.filter(c => c.status !== 'pending').length === 0 && (
                      <p className="text-xs text-gray-400 italic">No new updates</p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <button 
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
          >
            <Plus className="w-5 h-5" />
            New Case
          </button>
        </div>
      </div>

      {view === 'cases' ? (
        <>
          <div className="mb-8 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input 
              type="text"
              placeholder="Search cases by symptoms, specialty, or status..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white border border-gray-100 rounded-2xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-gray-700 font-medium"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 hover:text-gray-600"
              >
                Clear
              </button>
            )}
          </div>

          <div className="grid gap-6">
            {filteredCases.length === 0 ? (
              <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900">
                  {searchQuery ? "No matching cases found" : "No cases yet"}
                </h3>
                <p className="text-gray-500">
                  {searchQuery ? "Try adjusting your search keywords." : "Start by creating your first medical consultation case."}
                </p>
              </div>
            ) : (
              filteredCases.map((c) => (
                <motion.div 
                  key={c.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => setViewingCase(c)}
                  className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex items-center justify-between cursor-pointer group"
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center",
                      c.status === 'pending' ? "bg-amber-50 text-amber-600" :
                      c.status === 'assigned' ? "bg-blue-50 text-blue-600" :
                      c.status === 'in-progress' ? "bg-indigo-50 text-indigo-600" :
                      "bg-green-50 text-green-600"
                    )}>
                      {c.status === 'pending' ? <Clock className="w-6 h-6" /> :
                       c.status === 'assigned' ? <Users className="w-6 h-6" /> :
                       c.status === 'in-progress' ? <Activity className="w-6 h-6" /> :
                       <CheckCircle className="w-6 h-6" />}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 line-clamp-1">{c.symptoms}</h3>
                      <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                        {c.imageUrl && (
                          <div className="flex items-center gap-1 text-blue-600 font-bold text-[10px] uppercase tracking-wider">
                            <Camera className="w-3 h-3" />
                            Photo Attached
                          </div>
                        )}
                        <span className="capitalize px-2 py-0.5 bg-gray-100 rounded-md text-xs font-semibold">
                          {c.status}
                        </span>
                        <span>•</span>
                        <span>{new Date(c.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-300" />
                </motion.div>
              ))
            )}
          </div>
        </>
      ) : (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <PatientProfileSection patientId={userProfile.uid} />
        </div>
      )}

      <AnimatePresence>
        {viewingCase && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-100">
                    <ClipboardList className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Case Study Detail</h3>
                    <p className="text-xs text-gray-500">ID: {viewingCase.id}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setViewingCase(null)}
                  className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                >
                  <Plus className="w-6 h-6 rotate-45 text-gray-500" />
                </button>
              </div>

              <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto">
                {viewingCase.diagnosis && (
                  <div className="p-6 bg-green-50 border border-green-100 rounded-3xl">
                    <div className="flex items-center gap-2 mb-4">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <h4 className="font-bold text-green-900">Medical Guidance & Diagnosis</h4>
                    </div>
                    <p className="text-sm text-green-800 leading-relaxed mb-6">{viewingCase.diagnosis}</p>
                    
                    {viewingCase.medications && viewingCase.medications.length > 0 && (
                      <div className="space-y-3">
                        <h5 className="text-xs font-bold text-green-700 uppercase tracking-wider">Prescribed Medications</h5>
                        <div className="flex flex-wrap gap-2">
                          {viewingCase.medications.map((med, i) => (
                            <span key={i} className="flex items-center gap-1.5 px-3 py-1 bg-white text-green-700 rounded-full text-xs font-bold border border-green-100 shadow-sm">
                              <Pill className="w-3 h-3" />
                              {med}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {viewingCase.treatmentPlan && viewingCase.treatmentPlan.length > 0 && (
                      <div className="mt-6 space-y-3">
                        <h5 className="text-xs font-bold text-green-700 uppercase tracking-wider">Structured Treatment Plan</h5>
                        <div className="space-y-2">
                          {viewingCase.treatmentPlan.map((step, i) => (
                            <div key={i} className="flex items-start gap-3 p-3 bg-white/50 rounded-xl border border-green-50">
                              <div className="w-5 h-5 rounded-full bg-green-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                                {i + 1}
                              </div>
                              <p className="text-sm text-green-800">{step}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {viewingCase.medicalAssistanceMeasures && (
                      <div className="mt-6 p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                        <h5 className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-2">Medical Assistance Measures</h5>
                        <p className="text-sm text-blue-800 leading-relaxed italic">
                          "{viewingCase.medicalAssistanceMeasures}"
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Status & Timeline</h4>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider",
                          viewingCase.status === 'pending' ? "bg-amber-50 text-amber-600" :
                          viewingCase.status === 'assigned' ? "bg-blue-50 text-blue-600" :
                          viewingCase.status === 'in-progress' ? "bg-indigo-50 text-indigo-600" :
                          "bg-green-50 text-green-600"
                        )}>
                          {viewingCase.status}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-gray-500 flex items-center gap-2">
                          <Clock className="w-3 h-3" /> Created: {new Date(viewingCase.createdAt).toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500 flex items-center gap-2">
                          <Activity className="w-3 h-3" /> Updated: {new Date(viewingCase.updatedAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Assignment</h4>
                    {viewingCase.assignedConsultantName ? (
                      <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-2xl border border-blue-100">
                        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
                          {viewingCase.assignedConsultantName[0]}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">{viewingCase.assignedConsultantName}</p>
                          <p className="text-[10px] text-blue-600 font-medium">Assigned Clinician</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400 italic">Not assigned yet</p>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Clinical Presentation</h4>
                  <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                        {viewingCase.requiredSpecialty || 'General Medicine'}
                      </span>
                    </div>
                    <p className="text-gray-700 leading-relaxed text-sm">
                      {viewingCase.symptoms}
                    </p>
                  </div>
                </div>

                {viewingCase.imageUrl && (
                  <div>
                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Clinical Evidence (Image)</h4>
                    <div className="rounded-2xl overflow-hidden border border-gray-100 shadow-sm bg-gray-50">
                      <img 
                        src={viewingCase.imageUrl} 
                        alt="Clinical evidence" 
                        className="w-full h-auto max-h-96 object-contain mx-auto" 
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isCreating && (
          <CreateCaseModal 
            userProfile={userProfile} 
            onClose={() => setIsCreating(false)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
};

const CreateCaseModal = ({ userProfile, onClose }: { userProfile: UserProfile, onClose: () => void }) => {
  const [symptoms, setSymptoms] = useState('');
  const [requiredSpecialty, setRequiredSpecialty] = useState<Specialty>('General Medicine');
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);

  const [image, setImage] = useState<string | null>(null);

  const [isDragging, setIsDragging] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGetLocation = () => {
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setIsLocating(false);
      },
      () => {
        alert("Could not get location. Please enable permissions.");
        setIsLocating(false);
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!symptoms) return;
    setShowConfirmSubmit(true);
  };

  const confirmSubmit = async () => {
    setIsSubmitting(true);
    try {
      mockDb.saveCase({
        patientId: userProfile.uid,
        patientName: userProfile.displayName || userProfile.email,
        symptoms,
        requiredSpecialty,
        location: location ? { latitude: location.lat, longitude: location.lng } : undefined,
        imageUrl: image || undefined,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl"
      >
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">New Consultation</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <Plus className="w-6 h-6 rotate-45" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Required Specialty
            </label>
            <select 
              value={requiredSpecialty}
              onChange={(e) => setRequiredSpecialty(e.target.value as Specialty)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            >
              {SPECIALTIES.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Describe your symptoms
            </label>
            <textarea 
              required
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              placeholder="e.g. Severe headache for 2 days, mild fever..."
              className="w-full h-32 px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Attach a photo (optional)
            </label>
            <div className="space-y-3">
              <label 
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={cn(
                  "flex flex-col items-center justify-center h-40 border-2 border-dashed rounded-2xl transition-all cursor-pointer overflow-hidden relative group",
                  isDragging ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-blue-400 hover:bg-blue-50",
                  image ? "border-solid border-blue-100" : ""
                )}
              >
                {image ? (
                  <div className="relative w-full h-full">
                    <img src={image} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <p className="text-white text-xs font-bold bg-black/40 px-3 py-1.5 rounded-full backdrop-blur-sm">Click to Change</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center mb-3 transition-colors",
                      isDragging ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-400"
                    )}>
                      <Camera className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-bold text-gray-700">
                      {isDragging ? "Drop image here" : "Capture or Upload Photo"}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-1">PNG, JPG or GIF up to 5MB</p>
                  </>
                )}
                <input 
                  type="file" 
                  accept="image/*" 
                  capture="environment"
                  onChange={handleImageChange}
                  className="hidden" 
                />
              </label>
              
              {image && (
                <button 
                  type="button"
                  onClick={() => setImage(null)}
                  className="w-full py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4 rotate-45" />
                  Remove Photo
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
            <div className="flex items-center gap-3">
              <MapPin className={cn("w-5 h-5", location ? "text-blue-600" : "text-gray-400")} />
              <div>
                <p className="text-sm font-semibold text-gray-900">Location Detection</p>
                <p className="text-xs text-gray-500">
                  {location ? "Location captured" : "Help us find nearby consultants"}
                </p>
              </div>
            </div>
            <button 
              type="button"
              onClick={handleGetLocation}
              disabled={isLocating}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-bold transition-all",
                location 
                  ? "bg-blue-100 text-blue-700" 
                  : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
              )}
            >
              {isLocating ? "Locating..." : location ? "Update" : "Detect"}
            </button>
          </div>

          <button 
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSubmitting ? "Submitting..." : "Submit Case"}
          </button>
        </form>

        <ConfirmationModal 
          isOpen={showConfirmSubmit}
          onClose={() => setShowConfirmSubmit(false)}
          onConfirm={confirmSubmit}
          title="Submit Medical Case"
          message="Are you sure you want to submit this consultation request? A clinician will review it shortly."
          confirmText="Submit Now"
          type="info"
        />
      </motion.div>
    </div>
  );
};

// --- Clinician Views ---

const ConsultationSection = ({ medicalCase, clinician }: { medicalCase: MedicalCase, clinician: UserProfile }) => {
  const [diagnosis, setDiagnosis] = useState(medicalCase.diagnosis || '');
  const [medications, setMedications] = useState<string[]>(medicalCase.medications || []);
  const [newMed, setNewMed] = useState('');
  const [notes, setNotes] = useState(medicalCase.clinicianNotes || '');
  const [treatmentPlan, setTreatmentPlan] = useState<string[]>(medicalCase.treatmentPlan || []);
  const [newPlanStep, setNewPlanStep] = useState('');
  const [medicalAssistanceMeasures, setMedicalAssistanceMeasures] = useState(medicalCase.medicalAssistanceMeasures || '');
  const [steps, setSteps] = useState(medicalCase.consultationSteps || { consulted: false, analyzed: false, updated: false });
  const [isSaving, setIsSaving] = useState(false);
  const [showConfirmComplete, setShowConfirmComplete] = useState(false);

  const handleAddMed = () => {
    if (newMed.trim()) {
      setMedications([...medications, newMed.trim()]);
      setNewMed('');
    }
  };

  const handleRemoveMed = (index: number) => {
    setMedications(medications.filter((_, i) => i !== index));
  };

  const handleAddPlanStep = () => {
    if (newPlanStep.trim()) {
      setTreatmentPlan([...treatmentPlan, newPlanStep.trim()]);
      setNewPlanStep('');
    }
  };

  const handleRemovePlanStep = (index: number) => {
    setTreatmentPlan(treatmentPlan.filter((_, i) => i !== index));
  };

  const toggleStep = (step: keyof typeof steps) => {
    setSteps(prev => ({ ...prev, [step]: !prev[step] }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      mockDb.updateCase(medicalCase.id, {
        diagnosis,
        medications,
        clinicianNotes: notes,
        treatmentPlan,
        medicalAssistanceMeasures,
        consultationSteps: steps,
        status: steps.updated ? 'in-progress' : medicalCase.status
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleComplete = async () => {
    setIsSaving(true);
    try {
      mockDb.updateCase(medicalCase.id, {
        diagnosis,
        medications,
        clinicianNotes: notes,
        treatmentPlan,
        medicalAssistanceMeasures,
        consultationSteps: steps,
        status: 'completed'
      });
      setShowConfirmComplete(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Medical Consultation</h3>
          <p className="text-sm text-gray-500">Follow the guided steps to provide proper medical guidance.</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-all text-sm"
          >
            {isSaving ? "Saving..." : "Save Progress"}
          </button>
          <button 
            onClick={() => setShowConfirmComplete(true)}
            disabled={!steps.consulted || !steps.analyzed || !steps.updated || isSaving}
            className="px-4 py-2 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-all text-sm disabled:opacity-50"
          >
            Complete Case
          </button>
        </div>
      </div>

      {/* Guided Steps */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { id: 'consulted', label: 'Consult', icon: Stethoscope, desc: 'Review symptoms & history' },
          { id: 'analyzed', label: 'Analyze', icon: Activity, desc: 'Formulate diagnosis' },
          { id: 'updated', label: 'Update', icon: FileText, desc: 'Provide meds & guidance' }
        ].map((step) => (
          <button
            key={step.id}
            onClick={() => toggleStep(step.id as any)}
            className={cn(
              "p-4 rounded-2xl border text-left transition-all relative overflow-hidden group",
              steps[step.id as keyof typeof steps] 
                ? "bg-blue-50 border-blue-200" 
                : "bg-white border-gray-100 hover:border-blue-100"
            )}
          >
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center mb-3",
              steps[step.id as keyof typeof steps] ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-400"
            )}>
              <step.icon className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-gray-900">{step.label}</h4>
            <p className="text-[10px] text-gray-500">{step.desc}</p>
            {steps[step.id as keyof typeof steps] && (
              <div className="absolute top-2 right-2">
                <Check className="w-4 h-4 text-blue-600" />
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Medical Guidance Tips */}
      <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex gap-3">
        <div className="w-8 h-8 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center shrink-0">
          <Info className="w-4 h-4" />
        </div>
        <div className="space-y-1">
          <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider">Medical Guidance Tips</h4>
          <p className="text-xs text-amber-800 leading-relaxed">
            {!steps.consulted ? "Start by reviewing the patient's symptoms and visual evidence carefully." :
             !steps.analyzed ? "Compare findings with standard clinical protocols for the reported symptoms." :
             !steps.updated ? "Ensure all prescribed medications include dosage and frequency instructions." :
             "Consultation complete. Review all entries before finalizing the case."}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Diagnosis & Findings</label>
            <textarea 
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              placeholder="Enter your medical analysis and diagnosis here..."
              className="w-full h-32 px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none resize-none text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Clinician Notes (Private)</label>
            <textarea 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Internal notes for future reference..."
              className="w-full h-32 px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none resize-none text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Medical Assistance Measures</label>
            <textarea 
              value={medicalAssistanceMeasures}
              onChange={(e) => setMedicalAssistanceMeasures(e.target.value)}
              placeholder="Detailed measures for patient medical assistance..."
              className="w-full h-32 px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none resize-none text-sm"
            />
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Structured Treatment Plan</label>
            <div className="flex gap-2 mb-4">
              <input 
                type="text"
                value={newPlanStep}
                onChange={(e) => setNewPlanStep(e.target.value)}
                placeholder="Add a step to the treatment plan..."
                className="flex-1 px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                onKeyPress={(e) => e.key === 'Enter' && handleAddPlanStep()}
              />
              <button 
                onClick={handleAddPlanStep}
                className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-2">
              {treatmentPlan.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                  <ClipboardList className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-xs text-gray-400">No treatment steps added yet</p>
                </div>
              ) : (
                treatmentPlan.map((step, index) => (
                  <motion.div 
                    key={index}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center">
                        <span className="text-xs font-bold">{index + 1}</span>
                      </div>
                      <span className="text-sm font-medium text-gray-700">{step}</span>
                    </div>
                    <button 
                      onClick={() => handleRemovePlanStep(index)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                    >
                      <Plus className="w-4 h-4 rotate-45" />
                    </button>
                  </motion.div>
                ))
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Prescribed Medications</label>
            <div className="flex gap-2 mb-4">
              <input 
                type="text"
                value={newMed}
                onChange={(e) => setNewMed(e.target.value)}
                placeholder="e.g. Paracetamol 500mg"
                className="flex-1 px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                onKeyPress={(e) => e.key === 'Enter' && handleAddMed()}
              />
              <button 
                onClick={handleAddMed}
                className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-2">
              {medications.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                  <Pill className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-xs text-gray-400">No medications prescribed yet</p>
                </div>
              ) : (
                medications.map((med, index) => (
                  <motion.div 
                    key={index}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                        <Pill className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-medium text-gray-700">{med}</span>
                    </div>
                    <button 
                      onClick={() => handleRemoveMed(index)}
                      className="text-gray-300 hover:text-red-500 transition-colors"
                    >
                      <Plus className="w-4 h-4 rotate-45" />
                    </button>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <ConfirmationModal 
        isOpen={showConfirmComplete}
        onClose={() => setShowConfirmComplete(false)}
        onConfirm={handleComplete}
        title="Complete Consultation"
        message="Are you sure you want to mark this case as completed? This will finalize the diagnosis and medications for the patient."
        confirmText="Finalize & Complete"
        type="info"
      />
    </div>
  );
};

const PatientProfileSection = ({ patientId }: { patientId: string }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<UserProfile | null>(null);
  const [patientCases, setPatientCases] = useState<MedicalCase[]>([]);
  const [viewingCase, setViewingCase] = useState<MedicalCase | null>(null);
  const [showConfirmSave, setShowConfirmSave] = useState(false);
  const [isHistoryCollapsed, setIsHistoryCollapsed] = useState(true);

  useEffect(() => {
    const profiles = mockDb.getProfiles();
    const p = profiles.find(u => u.uid === patientId);
    if (p) {
      setProfile(p);
      setEditedProfile(p);
    }

    // Fetch patient cases
    const allCases = mockDb.getCases();
    const filtered = allCases
      .filter(c => c.patientId === patientId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setPatientCases(filtered);
  }, [patientId]);

  const handleSave = () => {
    if (editedProfile) {
      mockDb.saveProfile(editedProfile);
      setProfile(editedProfile);
      setIsEditing(false);
    }
  };

  if (!profile) return <div className="p-8 text-center text-gray-500 italic">Profile not found</div>;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-xl font-bold text-gray-900">Patient Profile</h3>
        <button 
          onClick={() => isEditing ? setShowConfirmSave(true) : setIsEditing(true)}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all",
            isEditing ? "bg-green-600 text-white hover:bg-green-700" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          )}
        >
          {isEditing ? <><Save className="w-4 h-4" /> Save Changes</> : <><Edit2 className="w-4 h-4" /> Edit Profile</>}
        </button>
      </div>

      <ConfirmationModal 
        isOpen={showConfirmSave}
        onClose={() => setShowConfirmSave(false)}
        onConfirm={handleSave}
        title="Save Profile Changes"
        message="Are you sure you want to update this patient's profile information?"
        confirmText="Save Changes"
        type="info"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Full Name</label>
            {isEditing ? (
              <input 
                type="text"
                value={editedProfile?.displayName || ''}
                onChange={(e) => setEditedProfile(prev => prev ? { ...prev, displayName: e.target.value } : null)}
                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            ) : (
              <p className="text-gray-900 font-medium">{profile.displayName || 'N/A'}</p>
            )}
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Email Address</label>
            <p className="text-gray-900 font-medium">{profile.email}</p>
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Account Created</label>
            <p className="text-gray-900 font-medium">{new Date(profile.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
            <h4 className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-2">Clinical Notes</h4>
            <p className="text-xs text-blue-600 leading-relaxed">
              This patient has been registered since {new Date(profile.createdAt).getFullYear()}. 
              All medical history is stored securely in local storage.
            </p>
          </div>
          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">System Info</h4>
            <div className="space-y-1">
              <p className="text-[10px] text-gray-500">UID: {profile.uid}</p>
              <p className="text-[10px] text-gray-500">Role: {profile.role}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Medical History Summary Section */}
      <div className="mt-8">
        <button 
          onClick={() => setIsHistoryCollapsed(!isHistoryCollapsed)}
          className="w-full flex items-center justify-between p-4 bg-amber-50/50 border border-amber-100 rounded-2xl hover:bg-amber-50 transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600 shadow-sm">
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="text-left">
              <h3 className="text-sm font-bold text-gray-900">Medical History Summary</h3>
              <p className="text-[10px] text-amber-600 font-medium uppercase tracking-wider">Quick review of past diagnoses</p>
            </div>
          </div>
          {isHistoryCollapsed ? <ChevronDown className="w-5 h-5 text-amber-400 group-hover:text-amber-600 transition-colors" /> : <ChevronUp className="w-5 h-5 text-amber-400 group-hover:text-amber-600 transition-colors" />}
        </button>

        <AnimatePresence>
          {!isHistoryCollapsed && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-4 p-6 bg-white border border-gray-100 rounded-2xl shadow-sm space-y-4">
                {patientCases.filter(c => c.diagnosis).length === 0 ? (
                  <p className="text-sm text-gray-400 italic text-center py-4">No recorded diagnoses found in history.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {patientCases.filter(c => c.diagnosis).map((c, idx) => (
                      <div key={idx} className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                        <div>
                          <p className="text-xs font-bold text-gray-900">{c.diagnosis}</p>
                          <p className="text-[10px] text-gray-500 mt-0.5">
                            {new Date(c.createdAt).toLocaleDateString()} • {c.requiredSpecialty || 'General Medicine'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Case History Section */}
      <div className="mt-12">
        <div className="flex items-center gap-2 mb-6">
          <ClipboardList className="w-5 h-5 text-gray-400" />
          <h3 className="text-lg font-bold text-gray-900">Case History</h3>
          <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs font-bold">
            {patientCases.length}
          </span>
        </div>

        <div className="space-y-4">
          {patientCases.length === 0 ? (
            <p className="text-sm text-gray-400 italic bg-gray-50 p-6 rounded-2xl border border-dashed border-gray-200 text-center">
              No past cases found for this patient.
            </p>
          ) : (
            patientCases.map((c) => (
              <motion.div 
                key={c.id} 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={() => setViewingCase(c)}
                className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "w-2 h-2 rounded-full",
                      c.status === 'pending' ? "bg-amber-500" :
                      c.status === 'assigned' ? "bg-blue-500" :
                      c.status === 'in-progress' ? "bg-indigo-500" :
                      "bg-green-500"
                    )} />
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider",
                      c.status === 'pending' ? "bg-amber-50 text-amber-600" :
                      c.status === 'assigned' ? "bg-blue-50 text-blue-600" :
                      c.status === 'in-progress' ? "bg-indigo-50 text-indigo-600" :
                      "bg-green-50 text-green-600"
                    )}>
                      {c.status}
                    </span>
                    <ChevronRight className="w-3 h-3 text-gray-300 group-hover:text-blue-500 transition-colors" />
                  </div>
                </div>
                <p className="text-sm font-bold text-gray-900 mb-1 line-clamp-1">{c.symptoms}</p>
                <div className="flex items-center gap-2 text-[10px] text-gray-500">
                  <span className="bg-gray-100 px-1.5 py-0.5 rounded font-medium">{c.requiredSpecialty || 'General Medicine'}</span>
                  {c.assignedConsultantName && (
                    <span className="flex items-center gap-1">
                      • <Users className="w-3 h-3" /> Assigned to {c.assignedConsultantName.split(' ')[0]}
                    </span>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Case Detail Modal */}
      <AnimatePresence>
        {viewingCase && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-100">
                    <ClipboardList className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Case Study Detail</h3>
                    <p className="text-xs text-gray-500">ID: {viewingCase.id}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setViewingCase(null)}
                  className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                >
                  <Plus className="w-6 h-6 rotate-45 text-gray-500" />
                </button>
              </div>

              <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto">
                {viewingCase.diagnosis && (
                  <div className="p-6 bg-green-50 border border-green-100 rounded-3xl">
                    <div className="flex items-center gap-2 mb-4">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <h4 className="font-bold text-green-900">Medical Guidance & Diagnosis</h4>
                    </div>
                    <p className="text-sm text-green-800 leading-relaxed mb-6">{viewingCase.diagnosis}</p>
                    
                    {viewingCase.medications && viewingCase.medications.length > 0 && (
                      <div className="space-y-3">
                        <h5 className="text-xs font-bold text-green-700 uppercase tracking-wider">Prescribed Medications</h5>
                        <div className="flex flex-wrap gap-2">
                          {viewingCase.medications.map((med, i) => (
                            <span key={i} className="flex items-center gap-1.5 px-3 py-1 bg-white text-green-700 rounded-full text-xs font-bold border border-green-100 shadow-sm">
                              <Pill className="w-3 h-3" />
                              {med}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {viewingCase.treatmentPlan && viewingCase.treatmentPlan.length > 0 && (
                      <div className="mt-6 space-y-3">
                        <h5 className="text-xs font-bold text-green-700 uppercase tracking-wider">Structured Treatment Plan</h5>
                        <div className="space-y-2">
                          {viewingCase.treatmentPlan.map((step, i) => (
                            <div key={i} className="flex items-start gap-3 p-3 bg-white/50 rounded-xl border border-green-50">
                              <div className="w-5 h-5 rounded-full bg-green-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                                {i + 1}
                              </div>
                              <p className="text-sm text-green-800">{step}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {viewingCase.medicalAssistanceMeasures && (
                      <div className="mt-6 p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                        <h5 className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-2">Medical Assistance Measures</h5>
                        <p className="text-sm text-blue-800 leading-relaxed italic">
                          "{viewingCase.medicalAssistanceMeasures}"
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Status & Timeline</h4>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider",
                          viewingCase.status === 'pending' ? "bg-amber-50 text-amber-600" :
                          viewingCase.status === 'assigned' ? "bg-blue-50 text-blue-600" :
                          viewingCase.status === 'in-progress' ? "bg-indigo-50 text-indigo-600" :
                          "bg-green-50 text-green-600"
                        )}>
                          {viewingCase.status}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-gray-500 flex items-center gap-2">
                          <Clock className="w-3 h-3" /> Created: {new Date(viewingCase.createdAt).toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500 flex items-center gap-2">
                          <Activity className="w-3 h-3" /> Updated: {new Date(viewingCase.updatedAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Assignment</h4>
                    {viewingCase.assignedConsultantName ? (
                      <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-2xl border border-blue-100">
                        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
                          {viewingCase.assignedConsultantName[0]}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">{viewingCase.assignedConsultantName}</p>
                          <p className="text-[10px] text-blue-600 font-medium">Assigned Clinician</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400 italic">Not assigned yet</p>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Clinical Presentation</h4>
                  <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                        {viewingCase.requiredSpecialty || 'General Medicine'}
                      </span>
                    </div>
                    <p className="text-gray-700 leading-relaxed text-sm">
                      {viewingCase.symptoms}
                    </p>
                  </div>
                </div>

                {viewingCase.imageUrl && (
                  <div>
                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Clinical Evidence (Image)</h4>
                    <div className="rounded-2xl overflow-hidden border border-gray-100 shadow-sm bg-gray-50">
                      <img 
                        src={viewingCase.imageUrl} 
                        alt="Clinical evidence" 
                        className="w-full h-auto max-h-96 object-contain mx-auto" 
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  </div>
                )}

                {viewingCase.location && (
                  <div>
                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Patient Location</h4>
                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center gap-3">
                      <MapPin className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="text-sm font-bold text-gray-900">Coordinates</p>
                        <p className="text-xs text-gray-500">
                          Lat: {viewingCase.location.latitude.toFixed(4)}, Lng: {viewingCase.location.longitude.toFixed(4)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end">
                <button 
                  onClick={() => setViewingCase(null)}
                  className="px-6 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-100 transition-all"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ClinicianDashboard = ({ userProfile }: { userProfile: UserProfile }) => {
  const [cases, setCases] = useState<MedicalCase[]>([]);
  const [selectedCase, setSelectedCase] = useState<MedicalCase | null>(null);
  const [view, setView] = useState<'queue' | 'map' | 'audit'>('queue');
  const [detailTab, setDetailTab] = useState<'case' | 'profile' | 'consultation'>('case');
  const [suggestions, setSuggestions] = useState<ConsultantSuggestion[]>([]);
  const [notifications, setNotifications] = useState<{ id: string; message: string; type: 'info' | 'success' | 'warning' }[]>([]);
  const prevCasesRef = useRef<MedicalCase[]>([]);
  const [confirmAction, setConfirmAction] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
    type?: "info" | "danger" | "warning";
    confirmText?: string;
  } | null>(null);

  const addNotification = (message: string, type: 'info' | 'success' | 'warning' = 'info') => {
    const id = Math.random().toString(36).substring(7);
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  useEffect(() => {
    return mockDb.subscribeToCases((allCases) => {
      const sorted = [...allCases].sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      // Check for new cases or status changes
      if (prevCasesRef.current.length > 0) {
        // 1. New cases in queue
        const newPendingCases = sorted.filter(c => 
          c.status === 'pending' && 
          !prevCasesRef.current.find(pc => pc.id === c.id)
        );
        newPendingCases.forEach(c => {
          addNotification(`New case added to queue: ${c.symptoms.substring(0, 30)}...`, 'info');
        });

        // 2. Status changes for assigned cases
        sorted.forEach(c => {
          const prevCase = prevCasesRef.current.find(pc => pc.id === c.id);
          if (prevCase && prevCase.status !== c.status && c.assignedConsultantId === userProfile.uid) {
            addNotification(`Case status updated to ${c.status.toUpperCase()}: ${c.symptoms.substring(0, 30)}...`, 'success');
          }
        });
      }

      prevCasesRef.current = sorted;
      setCases(sorted);
      
      // Update selected case if it exists in the new data
      if (selectedCase) {
        const updated = sorted.find(c => c.id === selectedCase.id);
        if (updated) setSelectedCase(updated);
      }
    });
  }, [selectedCase?.id, userProfile.uid]);

  useEffect(() => {
    if (selectedCase && selectedCase.status === 'pending') {
      const clinicians = mockDb.getProfiles().filter(p => p.role === 'clinician');
      const results = getConsultantSuggestions(selectedCase, clinicians);
      setSuggestions(results);
    } else {
      setSuggestions([]);
    }
  }, [selectedCase]);

  const handleAssign = (caseId: string, consultant?: UserProfile) => {
    const targetConsultant = consultant || userProfile;
    setConfirmAction({
      title: "Assign Case",
      message: `Are you sure you want to assign this case to ${targetConsultant.displayName || targetConsultant.email}?`,
      confirmText: "Assign Now",
      onConfirm: () => {
        mockDb.updateCase(caseId, {
          status: 'assigned',
          assignedConsultantId: targetConsultant.uid,
          assignedConsultantName: targetConsultant.displayName || targetConsultant.email,
        });
      }
    });
  };

  const handleUpdateStatus = (caseId: string, status: CaseStatus) => {
    setConfirmAction({
      title: "Update Status",
      message: `Are you sure you want to change the status of this case to ${status.toUpperCase()}?`,
      confirmText: "Update Status",
      type: status === 'completed' ? "warning" : "info",
      onConfirm: () => {
        mockDb.updateCase(caseId, { status });
      }
    });
  };

  const toggleAvailability = () => {
    mockAuth.updateProfile({ 
      isAvailable: !userProfile.isAvailable,
      availabilityLastChanged: new Date().toISOString()
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 relative">
      {/* Real-time Notifications */}
      <div className="fixed bottom-8 right-8 z-[100] flex flex-col gap-3 pointer-events-none">
        <AnimatePresence>
          {notifications.map(notification => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 50, scale: 0.9 }}
              className={cn(
                "pointer-events-auto px-6 py-4 rounded-2xl shadow-2xl border flex items-center gap-4 min-w-[320px] max-w-md",
                notification.type === 'success' ? "bg-green-50 border-green-100 text-green-800" :
                notification.type === 'warning' ? "bg-amber-50 border-amber-100 text-amber-800" :
                "bg-blue-50 border-blue-100 text-blue-800"
              )}
            >
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                notification.type === 'success' ? "bg-green-100 text-green-600" :
                notification.type === 'warning' ? "bg-amber-100 text-amber-600" :
                "bg-blue-100 text-blue-600"
              )}>
                {notification.type === 'success' ? <CheckCircle className="w-5 h-5" /> :
                 notification.type === 'warning' ? <AlertCircle className="w-5 h-5" /> :
                 <Bell className="w-5 h-5" />}
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold leading-tight">{notification.message}</p>
              </div>
              <button 
                onClick={() => setNotifications(prev => prev.filter(n => n.id !== notification.id))}
                className="p-1 hover:bg-black/5 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4 rotate-45 text-gray-400" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4 bg-white p-2 rounded-2xl border border-gray-100 w-fit">
          <button 
            onClick={() => setView('queue')}
            className={cn(
              "px-6 py-2 rounded-xl font-bold transition-all flex items-center gap-2",
              view === 'queue' ? "bg-blue-600 text-white shadow-lg shadow-blue-200" : "text-gray-500 hover:bg-gray-50"
            )}
          >
            <ClipboardList className="w-4 h-4" />
            Queue
          </button>
          <button 
            onClick={() => setView('map')}
            className={cn(
              "px-6 py-2 rounded-xl font-bold transition-all flex items-center gap-2",
              view === 'map' ? "bg-blue-600 text-white shadow-lg shadow-blue-200" : "text-gray-500 hover:bg-gray-50"
            )}
          >
            <MapIcon className="w-4 h-4" />
            Map View
          </button>
          <button 
            onClick={() => setView('audit')}
            className={cn(
              "px-6 py-2 rounded-xl font-bold transition-all flex items-center gap-2",
              view === 'audit' ? "bg-blue-600 text-white shadow-lg shadow-blue-200" : "text-gray-500 hover:bg-gray-50"
            )}
          >
            <ClipboardList className="w-4 h-4" />
            Audit Log
          </button>
        </div>

        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">My Status</span>
            <span className={cn(
              "text-sm font-bold",
              userProfile.isAvailable ? "text-green-600" : "text-red-500"
            )}>
              {userProfile.isAvailable ? "Available" : "Unavailable"}
            </span>
            {userProfile.availabilityLastChanged && (
              <span className="text-[9px] text-gray-400 font-medium mt-0.5">
                Last changed: {new Date(userProfile.availabilityLastChanged).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
          <button 
            onClick={toggleAvailability}
            title={userProfile.isAvailable ? "Switch to Unavailable (Stop receiving new cases)" : "Switch to Available (Start receiving new cases)"}
            className={cn(
              "w-12 h-6 rounded-full p-1 transition-all relative group",
              userProfile.isAvailable ? "bg-green-500 hover:bg-green-600" : "bg-gray-300 hover:bg-gray-400"
            )}
          >
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
              Toggle Availability
            </div>
            <motion.div 
              animate={{ x: userProfile.isAvailable ? 24 : 0 }}
              className="w-4 h-4 bg-white rounded-full shadow-sm"
            />
          </button>
        </div>
      </div>

      {view === 'queue' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold text-gray-900">Patient Queue</h2>
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-green-50 text-green-600 rounded-full border border-green-100 text-[10px] font-bold uppercase tracking-wider animate-pulse">
                  <span className="w-1 h-1 bg-green-500 rounded-full" />
                  Live
                </div>
              </div>
              <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">
                {cases.filter(c => c.status === 'pending').length} New
              </span>
            </div>
            
            <div className="space-y-4">
              <AnimatePresence mode="popLayout">
                {cases.map((c) => (
                  <motion.div 
                    key={c.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    onClick={() => setSelectedCase(c)}
                    className={cn(
                      "p-4 rounded-2xl border cursor-pointer transition-all",
                      selectedCase?.id === c.id 
                        ? "bg-blue-50 border-blue-200 shadow-sm" 
                        : "bg-white border-gray-100 hover:border-blue-100"
                    )}
                  >
                  <div className="flex items-center justify-between mb-2">
                    <span className={cn(
                      "text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded",
                      c.status === 'pending' ? "bg-amber-100 text-amber-700" :
                      c.status === 'assigned' ? "bg-blue-100 text-blue-700" :
                      c.status === 'in-progress' ? "bg-indigo-100 text-indigo-700" :
                      "bg-green-100 text-green-700"
                    )}>
                      {c.status}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <h4 className="font-bold text-gray-900 line-clamp-1">{c.patientName}</h4>
                  <p className="text-xs text-gray-500 line-clamp-2 mt-1">{c.symptoms}</p>
                </motion.div>
              ))}
              </AnimatePresence>
            </div>
          </div>

          <div className="lg:col-span-2">
            {selectedCase ? (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden"
              >
                <div className="p-8 border-b border-gray-50">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400">
                        <UserIcon className="w-8 h-8" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">{selectedCase.patientName}</h2>
                        <div className="flex items-center gap-2 mt-1">
                          <button 
                            onClick={() => setDetailTab('case')}
                            className={cn(
                              "text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg transition-all",
                              detailTab === 'case' ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                            )}
                          >
                            Case Details
                          </button>
                          {selectedCase.status !== 'pending' && (
                            <button 
                              onClick={() => setDetailTab('consultation')}
                              className={cn(
                                "text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg transition-all",
                                detailTab === 'consultation' ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                              )}
                            >
                              Consultation
                            </button>
                          )}
                          <button 
                            onClick={() => setDetailTab('profile')}
                            className={cn(
                              "text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg transition-all",
                              detailTab === 'profile' ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                            )}
                          >
                            Patient Profile
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {selectedCase.status === 'pending' && (
                        <button 
                          onClick={() => handleAssign(selectedCase.id)}
                          className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-blue-700 transition-all"
                        >
                          Self Assign
                        </button>
                      )}
                      {selectedCase.status === 'assigned' && (
                        <button 
                          onClick={() => handleUpdateStatus(selectedCase.id, 'in-progress')}
                          className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-indigo-700 transition-all"
                        >
                          Start Consultation
                        </button>
                      )}
                      {selectedCase.status === 'in-progress' && (
                        <button 
                          onClick={() => handleUpdateStatus(selectedCase.id, 'completed')}
                          className="bg-green-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-green-700 transition-all"
                        >
                          Complete Case
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="p-8">
                    {detailTab === 'case' ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                          <div>
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Symptoms</h3>
                            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                                  {selectedCase.requiredSpecialty || 'General Medicine'}
                                </span>
                              </div>
                              <p className="text-gray-700 leading-relaxed">
                                {selectedCase.symptoms}
                              </p>
                            </div>
                          </div>
                          {selectedCase.imageUrl && (
                            <div>
                              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Attached Image</h3>
                              <div className="rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
                                <img src={selectedCase.imageUrl} alt="Symptom" className="w-full h-auto" />
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="space-y-6">
                          {selectedCase.status === 'pending' && suggestions.length > 0 && (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                              <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Top Matches</h3>
                                <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-bold">AI Recommended</span>
                              </div>
                              <div className="space-y-4">
                                {suggestions.slice(0, 3).map((s) => (
                                  <motion.div 
                                    key={s.consultant.uid} 
                                    whileHover={{ y: -2 }}
                                    className="p-5 bg-gradient-to-br from-blue-50/80 to-white border border-blue-100 rounded-2xl shadow-sm hover:shadow-md transition-all"
                                  >
                                    <div className="flex items-start justify-between mb-4">
                                      <div className="flex items-center gap-3">
                                        <div className="relative">
                                          <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white text-lg font-bold shadow-lg shadow-blue-200">
                                            {s.consultant.displayName?.[0]}
                                          </div>
                                          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-2 border-white rounded-full flex items-center justify-center">
                                            <ShieldCheck className="w-3 h-3 text-white" />
                                          </div>
                                        </div>
                                        <div>
                                          <p className="text-base font-bold text-gray-900 leading-tight">{s.consultant.displayName}</p>
                                          <p className="text-xs text-blue-600 font-semibold">{s.consultant.specialty}</p>
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <div className="flex items-center gap-1 justify-end text-blue-700">
                                          <Star className="w-3 h-3 fill-current" />
                                          <span className="text-sm font-black">{s.score}%</span>
                                        </div>
                                        <div className="flex items-center gap-1 justify-end text-gray-400 mt-0.5">
                                          <Navigation className="w-2.5 h-2.5" />
                                          <span className="text-[10px] font-medium">{s.distance.toFixed(1)}km</span>
                                        </div>
                                      </div>
                                    </div>

                                    <div className="flex flex-wrap gap-1.5 mb-4">
                                      {s.reasons.map((r, i) => (
                                        <span key={i} className="text-[9px] bg-white text-gray-600 px-2 py-1 rounded-lg border border-blue-50 font-medium flex items-center gap-1">
                                          <CheckCircle className="w-2.5 h-2.5 text-blue-400" />
                                          {r}
                                        </span>
                                      ))}
                                    </div>

                                    <button 
                                      onClick={() => handleAssign(selectedCase.id, s.consultant)}
                                      className="w-full py-3 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all flex items-center justify-center gap-2 group"
                                    >
                                      <UserCheck className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                      Assign to {s.consultant.displayName.split(' ')[0]}
                                    </button>
                                  </motion.div>
                                ))}
                              </div>
                            </div>
                          )}
                          <div>
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Patient Location</h3>
                            {selectedCase.location ? (
                              <div className="space-y-3">
                                <div className="h-48 w-full rounded-2xl border border-gray-200 overflow-hidden shadow-sm relative group">
                                  <Map 
                                    height={192} 
                                    defaultCenter={[selectedCase.location.latitude, selectedCase.location.longitude]} 
                                    defaultZoom={13}
                                    metaWheelZoom={true}
                                  >
                                    <Marker 
                                      width={40}
                                      anchor={[selectedCase.location.latitude, selectedCase.location.longitude]} 
                                      color="#2563eb"
                                    />
                                  </Map>
                                  <div className="absolute bottom-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg border border-gray-100 text-[10px] font-bold text-gray-500 shadow-sm pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                                    Interactive Map
                                  </div>
                                </div>
                                <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 flex items-center gap-3">
                                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                                    <MapPin className="w-5 h-5 text-blue-600" />
                                  </div>
                                  <div>
                                    <p className="text-xs font-bold text-gray-900">Patient Coordinates</p>
                                    <p className="text-[10px] text-blue-600 font-medium">
                                      {selectedCase.location.latitude.toFixed(6)}, {selectedCase.location.longitude.toFixed(6)}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="p-8 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 text-center">
                                <MapPin className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                <p className="text-xs text-gray-400 italic">No location data provided for this case</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : detailTab === 'consultation' ? (
                      <ConsultationSection medicalCase={selectedCase} clinician={userProfile} />
                    ) : (
                      <PatientProfileSection patientId={selectedCase.patientId} />
                    )}
                  </div>
                </div>
                
                <div className="p-8 bg-gray-50/50">
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Case Timeline</h3>
                  <div className="space-y-4">
                    <div className="flex gap-4">
                      <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5" />
                      <div>
                        <p className="text-sm font-bold text-gray-900">Case Created</p>
                        <p className="text-xs text-gray-500">{new Date(selectedCase.createdAt).toLocaleString()}</p>
                      </div>
                    </div>
                    {selectedCase.assignedConsultantName && (
                      <div className="flex gap-4">
                        <div className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5" />
                        <div>
                          <p className="text-sm font-bold text-gray-900">Assigned to {selectedCase.assignedConsultantName}</p>
                          <p className="text-xs text-gray-500">{new Date(selectedCase.updatedAt).toLocaleString()}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                <Search className="w-12 h-12 text-gray-300 mb-4" />
                <h3 className="text-xl font-bold text-gray-900">Select a case</h3>
                <p className="text-gray-500">Choose a patient from the queue to view details and manage consultation.</p>
              </div>
            )}
          </div>
        </div>
      ) : view === 'map' ? (
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Live Case Map</h2>
              <p className="text-sm text-gray-500">Real-time visualization of active medical cases</p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 rounded-full border border-green-100 text-[10px] font-bold uppercase tracking-wider">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              Live Updates
            </div>
          </div>
          
          <div className="aspect-video bg-gray-100 rounded-3xl border border-gray-200 relative overflow-hidden shadow-inner">
            <Map 
              defaultCenter={[37.7749, -122.4194]} 
              defaultZoom={4}
              metaWheelZoom={true}
            >
              {cases.filter(c => c.location).map((c) => (
                <Marker 
                  key={c.id}
                  width={30}
                  anchor={[c.location!.latitude, c.location!.longitude]} 
                  color={
                    c.status === 'pending' ? "#f59e0b" :
                    c.status === 'assigned' ? "#2563eb" :
                    c.status === 'in-progress' ? "#4f46e5" :
                    "#10b981"
                  }
                  onClick={() => {
                    setSelectedCase(c);
                    setView('queue');
                  }}
                />
              ))}
            </Map>
            
            <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-gray-100 shadow-xl z-10">
              <h4 className="text-xs font-bold text-gray-900 mb-2 uppercase tracking-wider">Map Legend</h4>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-500" />
                  <span className="text-[10px] text-gray-600 font-medium">Pending</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="text-[10px] text-gray-600 font-medium">Assigned</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-indigo-500" />
                  <span className="text-[10px] text-gray-600 font-medium">In Progress</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-[10px] text-gray-600 font-medium">Completed</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Case Audit Log</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="pb-4 font-bold text-gray-400 text-xs uppercase tracking-wider">Case ID</th>
                  <th className="pb-4 font-bold text-gray-400 text-xs uppercase tracking-wider">Patient</th>
                  <th className="pb-4 font-bold text-gray-400 text-xs uppercase tracking-wider">Status</th>
                  <th className="pb-4 font-bold text-gray-400 text-xs uppercase tracking-wider">Last Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {cases.map(c => (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 text-sm font-mono text-gray-500">{c.id.slice(0, 8)}</td>
                    <td className="py-4 text-sm font-bold text-gray-900">{c.patientName}</td>
                    <td className="py-4">
                      <span className={cn(
                        "text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded",
                        c.status === 'pending' ? "bg-amber-100 text-amber-700" :
                        c.status === 'assigned' ? "bg-blue-100 text-blue-700" :
                        c.status === 'in-progress' ? "bg-indigo-100 text-indigo-700" :
                        "bg-green-100 text-green-700"
                      )}>
                        {c.status}
                      </span>
                    </td>
                    <td className="py-4 text-sm text-gray-500">{new Date(c.updatedAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ConfirmationModal 
        isOpen={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        onConfirm={confirmAction?.onConfirm || (() => {})}
        title={confirmAction?.title || ""}
        message={confirmAction?.message || ""}
        confirmText={confirmAction?.confirmText}
        type={confirmAction?.type}
      />
    </div>
  );
};

// --- User Manual ---

const UserManual = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden"
      >
        <div className="p-8 border-b border-gray-50 bg-blue-600 text-white">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">User Manual & Guide</h1>
              <p className="text-blue-100">Learn how to use TeleHealth Connect effectively</p>
            </div>
          </div>
        </div>

        <div className="p-8 space-y-12">
          {/* Section: Getting Started */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                <Info className="w-4 h-4" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Getting Started</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
                <h3 className="font-bold text-gray-900 mb-2">Local Storage Mode</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  TeleHealth Connect currently operates in <strong>Local Storage Mode</strong>. This means all your data (profiles, cases, notes) is saved directly in your browser's memory. No data is sent to a central server, ensuring maximum privacy for this demo.
                </p>
              </div>
              <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
                <h3 className="font-bold text-gray-900 mb-2">Offline Capability</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  The app works even without an internet connection! If you go offline, a red indicator will appear in the navigation bar. You can still create and manage cases; they will sync across your browser tabs automatically.
                </p>
              </div>
            </div>
          </section>

          {/* Section: For Patients */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                <UserIcon className="w-4 h-4" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Patient Guide</h2>
            </div>
            <div className="space-y-4">
              <div className="flex gap-4 p-4 hover:bg-gray-50 rounded-2xl transition-colors">
                <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
                  <Plus className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">Creating a Case</h4>
                  <p className="text-sm text-gray-600">Click "New Consultation" on your dashboard. Describe your symptoms, select a specialty, and optionaly attach a photo. Use "Detect Location" to help find nearby consultants.</p>
                </div>
              </div>
              <div className="flex gap-4 p-4 hover:bg-gray-50 rounded-2xl transition-colors">
                <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">Tracking Status</h4>
                  <p className="text-sm text-gray-600">Your cases appear in your dashboard. Statuses update in real-time: <strong>Pending</strong> (waiting for clinician), <strong>Assigned</strong> (clinician found), <strong>In Progress</strong> (consultation active), and <strong>Completed</strong>.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Section: For Clinicians */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                <Users className="w-4 h-4" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Clinician Guide</h2>
            </div>
            <div className="space-y-4">
              <div className="flex gap-4 p-4 hover:bg-gray-50 rounded-2xl transition-colors">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                  <ClipboardList className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">Managing the Queue</h4>
                  <p className="text-sm text-gray-600">The Patient Queue updates live. Select a case to see details, suggested consultants (based on specialty and distance), and the patient's location on the map.</p>
                </div>
              </div>
              <div className="flex gap-4 p-4 hover:bg-gray-50 rounded-2xl transition-colors">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                  <UserCircle className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">Patient Profiles</h4>
                  <p className="text-sm text-gray-600">Switch to the "Patient Profile" tab when a case is selected. You can view and edit patient information to keep records accurate during consultations.</p>
                </div>
              </div>
              <div className="flex gap-4 p-4 hover:bg-gray-50 rounded-2xl transition-colors">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                  <CheckCircle className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">Availability Toggle</h4>
                  <p className="text-sm text-gray-600">Use the toggle in your header to set yourself as "Available" or "Unavailable". This affects whether you appear in the routing suggestions for new cases.</p>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="p-8 bg-gray-50 border-t border-gray-100 text-center">
          <Link to="/" className="inline-flex items-center gap-2 text-blue-600 font-bold hover:underline">
            Back to Dashboard <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

// --- Auth & Main App ---

const Login = () => {
  const [role, setRole] = useState<UserRole>('patient');
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');

  const handleLogin = () => {
    setIsLoading(true);
    setTimeout(() => {
      const mockEmail = email || `user_${Math.random().toString(36).substring(7)}@example.com`;
      mockAuth.login(mockEmail, mockEmail.split('@')[0], role);
      window.dispatchEvent(new Event('auth-change'));
      setIsLoading(false);
    }, 800);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white w-full max-w-md p-8 rounded-3xl shadow-xl border border-gray-100"
      >
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-200">
            <Activity className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">TeleHealth Connect</h1>
          <p className="text-gray-500 mt-2">Secure medical consultation platform (Local Mode)</p>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Email Address</label>
            <input 
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-3">I am a...</label>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => setRole('patient')}
                className={cn(
                  "p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2",
                  role === 'patient' ? "border-blue-600 bg-blue-50 text-blue-700" : "border-gray-100 hover:border-gray-200 text-gray-500"
                )}
              >
                <UserIcon className="w-6 h-6" />
                <span className="font-bold">Patient</span>
              </button>
              <button 
                onClick={() => setRole('clinician')}
                className={cn(
                  "p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2",
                  role === 'clinician' ? "border-blue-600 bg-blue-50 text-blue-700" : "border-gray-100 hover:border-gray-200 text-gray-500"
                )}
              >
                <Users className="w-6 h-6" />
                <span className="font-bold">Clinician</span>
              </button>
            </div>
          </div>

          <button 
            onClick={handleLogin}
            disabled={isLoading}
            className="w-full bg-gray-900 text-white py-4 rounded-2xl font-bold hover:bg-black transition-all flex items-center justify-center gap-3"
          >
            {isLoading ? "Signing in..." : "Sign In (Local)"}
          </button>
        </div>

        <p className="text-center text-xs text-gray-400 mt-8">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </motion.div>
    </div>
  );
};

export default function App() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const profile = mockAuth.getCurrentUser();
      setUserProfile(profile);
      setLoading(false);
    };

    window.addEventListener('auth-change', checkAuth);
    checkAuth();

    return () => window.removeEventListener('auth-change', checkAuth);
  }, []);

  if (loading) return <LoadingScreen />;

  return (
    <ErrorBoundary>
      <Router>
        <div className="min-h-screen bg-gray-50 font-sans">
          {!userProfile ? (
            <Login />
          ) : (
            <>
              <Navbar userProfile={userProfile} />
              <Routes>
                <Route 
                  path="/" 
                  element={
                    userProfile.role === 'clinician' 
                      ? <ClinicianDashboard userProfile={userProfile} /> 
                      : <PatientDashboard userProfile={userProfile} />
                  } 
                />
                <Route path="/manual" element={<UserManual />} />
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </>
          )}
        </div>
      </Router>
    </ErrorBoundary>
  );
}
