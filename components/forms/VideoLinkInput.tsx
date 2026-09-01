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
    // Simple regex for common video platforms
    const videoRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be|tiktok\.com|vimeo\.com|facebook\.com)\/.+$/;
    
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
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      <div className="relative">
        <input
          type="url"
          value={value}
          onChange={handleChange}
          onBlur={(e) => validateUrl(e.target.value)}
          placeholder={placeholder}
          className={`w-full rounded-md border px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 ${
            status === 'invalid' 
              ? 'border-red-300 focus:ring-red-200' 
              : status === 'valid' 
                ? 'border-green-300 focus:ring-green-200' 
                : 'border-slate-300 focus:ring-emerald-200'
          }`}
        />
        <div className="absolute right-3 top-2.5">
          {status === 'valid' && <CheckCircle2 className="text-green-500" size={18} />}
          {status === 'invalid' && <AlertCircle className="text-red-500" size={18} />}
        </div>
      </div>
      {status === 'invalid' && (
        <p className="text-xs text-red-500 mt-1">Please enter a valid link (YouTube, TikTok, Vimeo, FB).</p>
      )}
    </div>
  );
}