import { useState } from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import React from 'react';

interface VideoLinkInputProps {
    label: string;
    value: string;
    onChange: (val: string) => void;
    placeholder: string;
}

export default function VideoLinkInput({ label, value, onChange, placeholder }: VideoLinkInputProps) {
  const [status, setStatus] = useState<'idle' | 'valid' | 'invalid'>('idle'); 

  const validateUrl = (url: string) => {
    // Pragmatic allowlist for common video platforms (and their common subdomains/short-link forms).
    const videoRegex = /^(https?:\/\/)?(www\.|m\.|player\.)?(youtube\.com|youtu\.be|youtube-nocookie\.com|tiktok\.com|vimeo\.com|facebook\.com|fb\.watch)\/.+$/;

    if (!url) {
      setStatus('idle');
      return;
    }
    
    if (videoRegex.test(url)) {
      setStatus('valid');
    } else {
      setStatus('invalid');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onChange(val);
    validateUrl(val);
  };

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{label}</label>
      <div className="relative">
        <input
          type="url"
          value={value}
          onChange={handleChange}
          onBlur={(e) => validateUrl(e.target.value)}
          placeholder={placeholder}
          className={`w-full rounded-md border px-3 py-2 pr-10 text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 ${
            status === 'invalid'
              ? 'border-red-300 dark:border-red-800 focus:ring-red-200 dark:focus:ring-red-900'
              : status === 'valid'
                ? 'border-green-300 dark:border-green-800 focus:ring-green-200 dark:focus:ring-green-900'
                : 'border-slate-300 dark:border-slate-700 focus:ring-emerald-200 dark:focus:ring-emerald-900'
          }`}
        />
        <div className="absolute right-3 top-2.5">
          {status === 'valid' && <CheckCircle2 className="text-green-500 dark:text-green-400" size={18} />}
          {status === 'invalid' && <AlertCircle className="text-red-500 dark:text-red-400" size={18} />}
        </div>
      </div>
      {status === 'invalid' && (
        <p className="text-xs text-red-500 dark:text-red-400 mt-1">Please enter a valid link (YouTube, TikTok, Vimeo, FB).</p>
      )}
    </div>
  );
}