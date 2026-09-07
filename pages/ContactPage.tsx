import React from 'react';
import { Mail, Phone, MapPin } from 'lucide-react';

const ContactPage: React.FC = () => {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white py-16 sm:py-20 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
            <div className="max-w-4xl mx-auto">
                <div className="text-center space-y-4 mb-12 animate-fade-in-up">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-cyan-50 dark:bg-cyan-950/60 border border-cyan-200 dark:border-cyan-800 text-cyan-600 dark:text-cyan-400">
                        <Mail size={22} strokeWidth={1.75} />
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                        Contact Us
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">
                        We'd love to hear from you! Whether you have a question about our features, a partnership proposal, or anything else, our team is ready to answer all your questions.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm animate-fade-in-up" style={{ animationDelay: '80ms' }}>
                        <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4">General Inquiries</h2>
                        <div className="space-y-2">
                            <a
                                href="mailto:contact@ezjob.com"
                                className="flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:border-cyan-400/60 hover:bg-cyan-50/60 dark:hover:bg-cyan-950/30 hover:text-cyan-700 dark:hover:text-cyan-300 transition-all active:scale-[0.98]"
                            >
                                <Mail size={16} strokeWidth={1.75} className="text-cyan-600 dark:text-cyan-400 shrink-0" />
                                <span className="text-sm font-medium truncate">contact@ezjob.com</span>
                            </a>
                            <a
                                href="tel:+6512345678"
                                className="flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:border-cyan-400/60 hover:bg-cyan-50/60 dark:hover:bg-cyan-950/30 hover:text-cyan-700 dark:hover:text-cyan-300 transition-all active:scale-[0.98]"
                            >
                                <Phone size={16} strokeWidth={1.75} className="text-cyan-600 dark:text-cyan-400 shrink-0" />
                                <span className="text-sm font-medium">+65 1234 5678</span>
                            </a>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm animate-fade-in-up" style={{ animationDelay: '150ms' }}>
                        <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4">Our Office</h2>
                        <div className="flex items-start gap-3 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800">
                            <MapPin size={16} strokeWidth={1.75} className="text-cyan-600 dark:text-cyan-400 shrink-0 mt-0.5" />
                            <p className="text-sm font-medium text-slate-700 dark:text-slate-200 leading-relaxed">
                                123 Tech Avenue<br />
                                Singapore 123456
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ContactPage;
