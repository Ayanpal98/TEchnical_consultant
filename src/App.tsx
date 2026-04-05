import { useState, useEffect, useMemo } from 'react';
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
  Map as MapIcon,
  Search,
  User as UserIcon,
  Activity,
  Database,
  WifiOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
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

  useEffect(() => {
    return mockDb.subscribeToCases((allCases) => {
      const filtered = allCases
        .filter(c => c.patientId === userProfile.uid)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setCases(filtered);
    });
  }, [userProfile.uid]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Health Cases</h1>
          <p className="text-gray-500">Manage and track your medical consultations</p>
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

      <div className="grid gap-6">
        {cases.length === 0 ? (
          <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
            <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No cases yet</h3>
            <p className="text-gray-500">Start by creating your first medical consultation case.</p>
          </div>
        ) : (
          cases.map((c) => (
            <motion.div 
              key={c.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between"
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

  const [image, setImage] = useState<string | null>(null);

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
            <div className="flex items-center gap-4">
              <label className="flex-1 flex flex-col items-center justify-center h-32 border-2 border-dashed border-gray-200 rounded-2xl hover:border-blue-400 hover:bg-blue-50 transition-all cursor-pointer overflow-hidden relative">
                {image ? (
                  <img src={image} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <>
                    <Camera className="w-8 h-8 text-gray-400 mb-2" />
                    <span className="text-xs text-gray-500 font-medium">Capture or Upload</span>
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
                  className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
                >
                  <Plus className="w-5 h-5 rotate-45" />
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
      </motion.div>
    </div>
  );
};

// --- Clinician Views ---

const ClinicianDashboard = ({ userProfile }: { userProfile: UserProfile }) => {
  const [cases, setCases] = useState<MedicalCase[]>([]);
  const [selectedCase, setSelectedCase] = useState<MedicalCase | null>(null);
  const [view, setView] = useState<'queue' | 'map' | 'audit'>('queue');
  const [suggestions, setSuggestions] = useState<ConsultantSuggestion[]>([]);

  useEffect(() => {
    return mockDb.subscribeToCases((allCases) => {
      const sorted = [...allCases].sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setCases(sorted);
      
      // Update selected case if it exists in the new data
      if (selectedCase) {
        const updated = sorted.find(c => c.id === selectedCase.id);
        if (updated) setSelectedCase(updated);
      }
    });
  }, [selectedCase?.id]);

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
    mockDb.updateCase(caseId, {
      status: 'assigned',
      assignedConsultantId: targetConsultant.uid,
      assignedConsultantName: targetConsultant.displayName || targetConsultant.email,
    });
  };

  const handleUpdateStatus = (caseId: string, status: CaseStatus) => {
    mockDb.updateCase(caseId, { status });
  };

  const toggleAvailability = () => {
    mockAuth.updateProfile({ isAvailable: !userProfile.isAvailable });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
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
          </div>
          <button 
            onClick={toggleAvailability}
            className={cn(
              "w-12 h-6 rounded-full p-1 transition-all relative",
              userProfile.isAvailable ? "bg-green-500" : "bg-gray-300"
            )}
          >
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
                        <p className="text-gray-500">Case ID: {selectedCase.id.slice(0, 8)}</p>
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
                        <div>
                          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Suggested Consultants</h3>
                          <div className="space-y-3">
                            {suggestions.slice(0, 3).map((s) => (
                              <div key={s.consultant.uid} className="p-4 bg-blue-50/50 border border-blue-100 rounded-2xl">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-[10px] font-bold">
                                      {s.consultant.displayName?.[0]}
                                    </div>
                                    <div>
                                      <p className="text-sm font-bold text-gray-900">{s.consultant.displayName}</p>
                                      <p className="text-[10px] text-blue-600 font-medium">{s.consultant.specialty}</p>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <span className="text-xs font-bold text-blue-700">{s.score}% Match</span>
                                    <p className="text-[10px] text-gray-400">{s.distance.toFixed(1)}km away</p>
                                  </div>
                                </div>
                                <div className="flex flex-wrap gap-1 mb-3">
                                  {s.reasons.map((r, i) => (
                                    <span key={i} className="text-[9px] bg-white text-gray-500 px-1.5 py-0.5 rounded border border-gray-100">
                                      {r}
                                    </span>
                                  ))}
                                </div>
                                <button 
                                  onClick={() => handleAssign(selectedCase.id, s.consultant)}
                                  className="w-full py-2 bg-white border border-blue-200 text-blue-600 rounded-xl text-xs font-bold hover:bg-blue-600 hover:text-white transition-all"
                                >
                                  Assign to {s.consultant.displayName.split(' ')[0]}
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      <div>
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Location</h3>
                        {selectedCase.location ? (
                          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center gap-3">
                            <MapPin className="w-5 h-5 text-blue-600" />
                            <div>
                              <p className="text-sm font-bold text-gray-900">Coordinates</p>
                              <p className="text-xs text-gray-500">
                                {selectedCase.location.latitude.toFixed(4)}, {selectedCase.location.longitude.toFixed(4)}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <p className="text-gray-400 italic">No location provided</p>
                        )}
                      </div>
                    </div>
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
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Nearby Cases</h2>
          <div className="aspect-video bg-gray-50 rounded-2xl border border-gray-200 relative overflow-hidden flex items-center justify-center">
            <div className="absolute inset-0 opacity-10 pointer-events-none">
              <div className="w-full h-full" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
            </div>
            <div className="text-center z-10">
              <MapIcon className="w-12 h-12 text-blue-200 mx-auto mb-4" />
              <p className="text-gray-400 font-medium italic">Simulated Map View</p>
              <p className="text-xs text-gray-400 mt-1">Showing {cases.filter(c => c.location).length} cases with location data</p>
            </div>
            
            {/* Simulated markers */}
            {cases.filter(c => c.location).map((c, i) => (
              <motion.div 
                key={c.id}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                style={{ 
                  left: `${(c.location!.longitude % 1) * 100}%`, 
                  top: `${(c.location!.latitude % 1) * 100}%` 
                }}
                className="absolute w-4 h-4 bg-blue-600 rounded-full border-2 border-white shadow-lg cursor-pointer hover:scale-125 transition-transform"
                title={c.patientName}
                onClick={() => {
                  setSelectedCase(c);
                  setView('queue');
                }}
              />
            ))}
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
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </>
          )}
        </div>
      </Router>
    </ErrorBoundary>
  );
}
