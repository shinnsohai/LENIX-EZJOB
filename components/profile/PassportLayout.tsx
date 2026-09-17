import React, { useRef, useState, useEffect } from 'react';
import QRCode from 'qrcode';
import VideoEmbed from "../ui/VideoEmbed";
import {
  BadgeCheck,
  FileCheck,
  AlertTriangle,
  XCircle,
  Activity,
  Download,
  Share2,
  MapPin,
  Calendar,
  Briefcase,
  ShieldCheck,
  Ruler,
  Weight,
  Eye,
  Edit3,
  FileText,
  Check,
  Layers,
  Sparkles
} from "lucide-react";
import type { WorkerProfile, Project, Certification, Reference, UserSkill } from "../../types";

interface PassportLayoutProps {
  profile: WorkerProfile;
  projects: Project[];
  certs: Certification[];
  references: Reference[];
  onEdit?: () => void;
}

export default function PassportLayout({ profile, projects, certs, references, onEdit }: PassportLayoutProps) {
  const passportRef = useRef<HTMLDivElement>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);

  // Router-safe link (no HashRouter '/#' prefix) now that the app uses
  // BrowserRouter. Must be user_id, not the worker_profiles row's own id —
  // getWorkerProfile() (which PublicWorkerProfile calls) looks up by user_id.
  const profileUrl = `${window.location.origin}/worker/profile/${profile.user_id}`;

  const handleDownloadPDF = () => {
    window.print();
  };

  const handleShare = () => {
    navigator.clipboard.writeText(profileUrl).then(() => {
      setIsSharing(true);
      setShareError(null);
      setTimeout(() => setIsSharing(false), 2000);
    }).catch((err) => {
      console.error('[PassportLayout] Failed to copy share link:', err);
      setShareError('Could not copy link automatically. Please copy it from your browser address bar instead.');
      setTimeout(() => setShareError(null), 5000);
    });
  };

  // Generated once per profile URL, client-side (no network call) — used
  // only in the printable header (#pdf-header) so a paper copy or exported
  // PDF still carries a way back to the live, always-up-to-date profile.
  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(profileUrl, { width: 160, margin: 1, color: { dark: '#0f172a', light: '#ffffff' } })
      .then(dataUrl => { if (!cancelled) setQrCodeDataUrl(dataUrl); })
      .catch(err => console.error('[PassportLayout] Failed to generate QR code:', err));
    return () => { cancelled = true; };
  }, [profileUrl]);

  // Calculate Profile Completeness Score (a completeness/points count, not a
  // third-party audit — see the "Profile Completeness Score" label below).
  const calculateScore = () => {
    let score = 50;
    if (profile.photo_url) score += 10;
    if (profile.cv_url) score += 10;
    if (profile.media_links?.intro_video_url || profile.media_links?.skill_video_url) score += 10;
    if (projects.length > 0) score += 10;
    if (certs.length > 0) score += 10;
    return Math.min(score, 98);
  };

  const integrityScore = calculateScore();
  const passportId = `LENIX-WSP-${profile.id.substring(0, 8).toUpperCase()}`;

  // Helper to check cert expiry
  const getCertStatus = (dateString: string) => {
    if (!dateString) return { status: 'Valid', color: 'text-cyan-400', icon: BadgeCheck, bg: 'bg-cyan-950/80 border-cyan-800' };
    const expiry = new Date(dateString);
    if (isNaN(expiry.getTime())) {
      // Malformed/unparseable expiry date — don't silently label it as active.
      return { status: 'Unverifiable', color: 'text-slate-400', icon: AlertTriangle, bg: 'bg-slate-800/80 border-slate-700' };
    }
    const now = new Date();
    const monthsUntil = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30);

    if (expiry < now) return { status: 'Expired', color: 'text-red-400', icon: XCircle, bg: 'bg-red-950/80 border-red-800' };
    if (monthsUntil < 3) return { status: 'Expires Soon', color: 'text-yellow-400', icon: AlertTriangle, bg: 'bg-yellow-950/80 border-yellow-800' };
    return { status: 'Active', color: 'text-cyan-400', icon: BadgeCheck, bg: 'bg-cyan-950/80 border-cyan-800' };
  };

  // Helper to parse skills
  const getSkillsList = (): UserSkill[] => {
    if (profile.skills && profile.skills.length > 0) {
      return profile.skills;
    }
    if (profile.trade_or_skill) {
      return [{
        trade: profile.trade_or_skill,
        tags: profile.trade_specifics || {},
        isPrimary: true
      }];
    }
    return [];
  };

  const skillsList = getSkillsList();
  const primarySkill = skillsList.find(s => s.isPrimary) || skillsList[0];
  const secondarySkills = skillsList.filter(s => s !== primarySkill);

  // SVG Gauge calculations
  const circumference = 2 * Math.PI * 45; // 282.7
  const strokeDashoffset = circumference - (integrityScore / 100) * circumference;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-800 dark:text-slate-200 transition-colors duration-300">
      {/* Top Bar Actions */}
      <div className="border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md sticky top-20 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-tr from-cyan-500 to-blue-600 p-2 rounded-xl text-slate-950 font-bold shadow-md">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 dark:text-white leading-tight flex items-center gap-2">
                Digital Skill Passport
                <span className="text-[10px] font-mono font-bold bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-400 border border-cyan-300 dark:border-cyan-800/60 px-2 py-0.5 rounded-full">
                  ACTIVE
                </span>
              </h1>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">{passportId}</span>
            </div>
          </div>

          <div className="flex gap-2.5 flex-wrap justify-center font-mono text-xs">
            {onEdit && (
              <button
                onClick={onEdit}
                className="flex items-center gap-1.5 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-full transition-all shadow-md cursor-pointer"
              >
                <Edit3 size={14} /> <span>Edit Passport</span>
              </button>
            )}

            {profile.cv_url && (
              <a
                href={profile.cv_url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-full transition-colors"
              >
                <FileText size={14} className="text-cyan-600 dark:text-cyan-400" /> <span>View CV</span>
              </a>
            )}

            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-full transition-colors cursor-pointer"
            >
              <Download size={14} className="text-cyan-600 dark:text-cyan-400" />
              <span>Export PDF</span>
            </button>

            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-full transition-colors cursor-pointer"
            >
              {isSharing ? <Check size={14} className="text-emerald-500" /> : <Share2 size={14} className="text-cyan-600 dark:text-cyan-400" />}
              <span>{isSharing ? 'Copied Link!' : 'Share Profile'}</span>
            </button>
          </div>
        </div>
        {shareError && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-3">
            <p className="text-xs text-red-600 dark:text-red-400 font-mono text-center md:text-right">{shareError}</p>
          </div>
        )}
      </div>

      <div ref={passportRef} id="passport-print-root" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Printable Header — screen-hidden, shown only via print CSS
            (see #pdf-header in index.css). Carries a QR code + clickable
            link back to the live profile since a paper copy otherwise has
            no way to reach it; Chrome's "Save as PDF" print path keeps
            <a href> as a real clickable link in the resulting PDF too.
            Stacked in one column rather than a title/QR two-column row:
            a fixed-width side-by-side layout starved the title of room on
            narrower print/page widths, wrapping "EZJOB by LENIX" onto
            three lines and clipping the profile URL. Always the light-
            theme logo marks here — paper is always light regardless of
            the on-screen theme, same reasoning as the rest of this
            print stylesheet (see index.css's @media print block). */}
        <div id="pdf-header" className="hidden mb-6 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2.5 flex-wrap">
            <img src="/assets/ezjob-logo-light.png" alt="EZJOB" className="h-9 w-auto" />
            <span className="text-base font-semibold text-slate-400">by</span>
            <img src="/assets/lenix-logo-light.png" alt="LENIX" className="h-7 w-auto" />
          </div>
          <p className="text-slate-500 text-sm font-mono mt-1.5">Skilled Trades Verification & Digital Skill Passport</p>

          <div className="mt-4 flex items-center gap-3">
            {qrCodeDataUrl && (
              <img src={qrCodeDataUrl} alt="QR code linking to this Skill Passport online" className="w-16 h-16 flex-shrink-0" />
            )}
            <div className="min-w-0">
              <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Full Digital Profile</p>
              <a href={profileUrl} className="text-xs font-mono text-cyan-600 underline break-all">
                {profileUrl}
              </a>
            </div>
          </div>
        </div>

        {/* --- Hero Banner Card --- */}
        <div className="relative w-full overflow-hidden bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 text-white rounded-3xl p-6 sm:p-8 mb-8 shadow-2xl">
          <div className="absolute inset-0 opacity-20 pointer-events-none" 
            style={{ backgroundImage: 'radial-gradient(circle at 85% 20%, #06b6d4 0%, transparent 45%), radial-gradient(circle at 15% 90%, #d946ef 0%, transparent 45%)' }}
          />

          <div className="relative z-10 flex flex-col lg:flex-row gap-8 items-start lg:items-center justify-between">
            {/* Left: Avatar & Info */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <div className="relative group flex-shrink-0">
                <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden border-2 border-cyan-500/50 bg-slate-800 shadow-xl">
                  {profile.photo_url ? (
                    <img
                      src={profile.photo_url}
                      alt={profile.full_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-cyan-400 text-4xl font-extrabold bg-slate-900">
                      {profile.full_name?.charAt(0) || 'W'}
                    </div>
                  )}
                </div>
                <div className="absolute -bottom-2 -right-2 bg-gradient-to-tr from-cyan-500 to-blue-600 text-slate-950 p-1.5 rounded-full shadow-lg">
                  <BadgeCheck size={18} />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] font-bold text-cyan-300 uppercase tracking-widest bg-cyan-950/90 border border-cyan-800/80 px-2.5 py-0.5 rounded-full">
                    Skill Passport Active
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">
                  {profile.full_name}
                </h1>
                <p className="text-cyan-400 font-mono text-sm flex items-center gap-1.5">
                  <Briefcase size={15} />
                  <span>{primarySkill ? primarySkill.trade : 'Skilled Technical Specialist'}</span>
                </p>
                <div className="flex flex-wrap gap-2 mt-1 font-mono text-xs text-slate-300">
                  <span className="px-3 py-1 bg-slate-900 rounded-full border border-slate-800 flex items-center gap-1">
                    <MapPin size={13} className="text-cyan-400" />
                    {profile.country_of_origin || 'Singapore / Regional'}
                  </span>
                  <span className="px-3 py-1 bg-slate-900 rounded-full border border-slate-800 flex items-center gap-1">
                    <Calendar size={13} className="text-cyan-400" />
                    {profile.experience_years} Years Experience
                  </span>
                  <span className="px-3 py-1 bg-slate-900 rounded-full border border-slate-800 flex items-center gap-1">
                    <Sparkles size={13} className="text-cyan-400" />
                    Immediate Start
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Circular Integrity Gauge */}
            <div className="w-full lg:w-72 bg-slate-900/90 rounded-2xl p-5 border border-slate-800 shadow-lg flex flex-col items-center justify-center relative overflow-hidden flex-shrink-0">
              <div className="relative w-28 h-28 flex items-center justify-center mb-2">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle className="stroke-slate-800" cx="50" cy="50" fill="none" r="45" strokeWidth="8" />
                  <circle 
                    className="stroke-cyan-400 transition-all duration-1000 ease-out" 
                    cx="50" 
                    cy="50" 
                    fill="none" 
                    r="45" 
                    strokeDasharray={circumference} 
                    strokeDashoffset={strokeDashoffset} 
                    strokeLinecap="round" 
                    strokeWidth="8" 
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-extrabold text-white font-mono leading-none">{integrityScore}%</span>
                  <span className="text-[10px] text-slate-400 font-mono uppercase mt-0.5">Complete</span>
                </div>
              </div>
              <p className="text-xs font-mono text-cyan-400 text-center">Profile Completeness Score</p>
              <p className="text-[10px] text-slate-500 text-center font-mono mt-0.5">Ready for 1-Click Placement</p>
            </div>
          </div>
        </div>

        {/* --- Main Content Grid --- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column (Video demos & Physical attributes) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Intro Video — screen only; a paper printout can't play a video. */}
            <div data-print-hide className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm p-5 transition-colors">
              <h3 className="font-mono text-xs uppercase tracking-wider text-cyan-700 dark:text-cyan-400 font-bold mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></span>
                Video Introduction
              </h3>
              <VideoEmbed url={profile.media_links?.intro_video_url} label="Intro" />
            </div>

            {/* Skill Demo Video — screen only; a paper printout can't play a video. */}
            <div data-print-hide className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm p-5 transition-colors">
              <h3 className="font-mono text-xs uppercase tracking-wider text-cyan-700 dark:text-cyan-400 font-bold mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-fuchsia-500 animate-pulse"></span>
                On-Site Skill Demonstration
              </h3>
              <VideoEmbed url={profile.media_links?.skill_video_url} label="Skill" />
            </div>

            {/* Physical Attributes */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm transition-colors">
              <h3 className="font-mono text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300 font-bold mb-4">
                Physical Readiness & Medical
              </h3>
              <div className="space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800/80">
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                    <Ruler size={16} className="text-cyan-600 dark:text-cyan-400" />
                    <span>Height</span>
                  </div>
                  <span className="font-bold text-slate-900 dark:text-white">{profile.physical_attributes?.height_cm || '-'} cm</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800/80">
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                    <Weight size={16} className="text-cyan-600 dark:text-cyan-400" />
                    <span>Weight</span>
                  </div>
                  <span className="font-bold text-slate-900 dark:text-white">{profile.physical_attributes?.weight_kg || '-'} kg</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800/80">
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                    <Eye size={16} className="text-cyan-600 dark:text-cyan-400" />
                    <span>Color Blindness</span>
                  </div>
                  <span className="font-bold text-slate-900 dark:text-white">{profile.physical_attributes?.color_blindness ? 'Yes' : 'Normal Vision'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column (Skills, Qualifications, Work History) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Primary & Secondary Trade Stack */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm transition-colors">
              <h3 className="font-mono text-xs uppercase tracking-wider text-cyan-700 dark:text-cyan-400 font-bold mb-4 flex items-center gap-2">
                <Layers size={16} />
                Technical Trade Specializations
              </h3>

              {primarySkill ? (
                <div className="p-5 rounded-xl border-l-4 border-l-cyan-500 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/80 shadow-sm mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-lg font-bold text-slate-900 dark:text-white uppercase tracking-wide flex items-center gap-2">
                      {primarySkill.trade}
                      <BadgeCheck size={18} className="text-cyan-600 dark:text-cyan-400" />
                    </h4>
                    <span className="text-[10px] font-mono font-bold uppercase bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-400 border border-cyan-300 dark:border-cyan-800 px-2 py-0.5 rounded">
                      Primary Trade
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(primarySkill.tags).filter(([_, v]) => v).map(([key]) => (
                      <span key={key} className="px-3 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-mono">
                        {key.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-slate-500 text-sm italic">No primary trade registered.</p>
              )}

              {secondarySkills.length > 0 && (
                <div className="space-y-3">
                  {secondarySkills.map((skill, idx) => (
                    <div key={`${skill.trade}-${idx}`} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div>
                        <h5 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">{skill.trade}</h5>
                        <div className="flex flex-wrap gap-1.5">
                          {Object.entries(skill.tags).filter(([_, v]) => v).map(([key]) => (
                            <span key={key} className="px-2 py-0.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 rounded text-[11px] font-mono">
                              {key.replace(/_/g, ' ')}
                            </span>
                          ))}
                        </div>
                      </div>
                      <span className="text-[10px] font-mono uppercase text-slate-500 bg-slate-200 dark:bg-slate-900 px-2 py-1 rounded w-fit">Secondary</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Verified Qualifications Vault */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm transition-colors">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-mono text-xs uppercase tracking-wider text-cyan-700 dark:text-cyan-400 font-bold flex items-center gap-2">
                  <FileCheck size={16} />
                  Verified Qualifications & Licences
                </h3>
                <span className="text-xs font-mono text-slate-500 dark:text-slate-400">{certs.length} Records</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {certs.length === 0 ? (
                  <p className="text-slate-500 text-sm italic col-span-full py-4 text-center">No certification records uploaded yet.</p>
                ) : (
                  certs.map((cert, idx) => {
                    const { status, color, icon: Icon, bg } = getCertStatus(cert.expiry_date);
                    return (
                      <div key={cert.id || `${cert.cert_name}-${idx}`} className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800/80 hover:border-cyan-500/50 transition-colors flex flex-col justify-between group">
                        <div>
                          <div className="flex justify-between items-start mb-2">
                            <div className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border flex items-center gap-1 ${bg} ${color}`}>
                              <Icon size={12} />
                              <span>{status}</span>
                            </div>
                            <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                              {cert.expiry_date ? `Exp: ${cert.expiry_date}` : 'No Expiry'}
                            </span>
                          </div>
                          <h4 className="font-bold text-slate-900 dark:text-white text-sm group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                            {cert.cert_name}
                          </h4>
                        </div>
                        {cert.document_url && (
                          <a 
                            href={cert.document_url} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="text-xs font-mono text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1 mt-3 pt-2 border-t border-slate-200 dark:border-slate-900"
                          >
                            <span>View Document</span>
                            <Download size={11} />
                          </a>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Work History Timeline */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm transition-colors">
              <h3 className="font-mono text-xs uppercase tracking-wider text-cyan-700 dark:text-cyan-400 font-bold mb-5 flex items-center gap-2">
                <Briefcase size={16} />
                Work History & Project Track Record
              </h3>

              <div className="relative border-l-2 border-slate-200 dark:border-slate-800 ml-3 space-y-6">
                {projects.length === 0 ? (
                  <div className="pl-6 text-slate-500 text-sm italic">No past project history listed.</div>
                ) : (
                  projects.map((proj, idx) => (
                    <div key={proj.id || `${proj.project_name}-${idx}`} className="pl-6 relative group">
                      <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-white dark:bg-slate-950 border-2 border-cyan-500 group-hover:scale-125 transition-transform"></div>
                      <h4 className="text-base font-bold text-slate-900 dark:text-white">{proj.project_name}</h4>
                      <div className="flex flex-wrap gap-3 text-xs font-mono text-slate-500 dark:text-slate-400 mt-1 mb-2">
                        <span className="text-cyan-600 dark:text-cyan-400 font-semibold">{proj.role}</span>
                        <span>•</span>
                        <span>{proj.year_start} - {proj.year_end || 'Present'}</span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed bg-slate-50 dark:bg-slate-950/70 p-3 rounded-xl border border-slate-200 dark:border-slate-800/60">
                        {proj.description || "Executed trade duties and maintained safety compliance throughout project lifecycle."}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Bio */}
            {profile.bio && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm transition-colors">
                <h3 className="font-mono text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300 font-bold mb-3">
                  Professional Bio
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                  {profile.bio}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

