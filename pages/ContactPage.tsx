import React from 'react';
import { Mail, Phone, MapPin } from 'lucide-react';

const ContactPage: React.FC = () => {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-20 sm:py-28 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
            <div className="max-w-3xl mx-auto">
                <div className="text-center space-y-5 mb-16 sm:mb-20 animate-fade-in-up">
                    <h1 className="text-4xl sm:text-5xl font-semibold tracking-tighter leading-[1.05] text-slate-900 dark:text-slate-100">
                        Contact Us
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400 text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
                        We'd love to hear from you! Whether you have a question about our features, a partnership proposal, or anything else, our team is ready to answer all your questions.
                    </p>
                </div>

                <div className="space-y-14 sm:space-y-16">
                    <div className="animate-fade-in-up" style={{ animationDelay: '80ms' }}>
                        <h2 className="font-mono text-xs uppercase tracking-widest font-semibold text-slate-500 dark:text-slate-400 mb-5">
                            General Inquiries
                        </h2>
                        <div className="space-y-4">
                            <a
                                href="mailto:contact@ezjob.com"
                                className="flex items-center gap-3 w-fit text-slate-700 dark:text-slate-300 hover:text-cyan-700 dark:hover:text-cyan-400 transition-colors"
                            >
                                <Mail size={18} strokeWidth={1.75} className="text-slate-400 dark:text-slate-500 shrink-0" />
                                <span className="text-base">contact@ezjob.com</span>
                            </a>
                            <a
                                href="tel:+6512345678"
                                className="flex items-center gap-3 w-fit text-slate-700 dark:text-slate-300 hover:text-cyan-700 dark:hover:text-cyan-400 transition-colors"
                            >
                                <Phone size={18} strokeWidth={1.75} className="text-slate-400 dark:text-slate-500 shrink-0" />
                                <span className="text-base">+65 1234 5678</span>
                            </a>
                        </div>
                    </div>

                    <div className="animate-fade-in-up" style={{ animationDelay: '150ms' }}>
                        <h2 className="font-mono text-xs uppercase tracking-widest font-semibold text-slate-500 dark:text-slate-400 mb-5">
                            Our Office
                        </h2>
                        <div className="flex items-start gap-3 text-slate-700 dark:text-slate-300">
                            <MapPin size={18} strokeWidth={1.75} className="text-slate-400 dark:text-slate-500 shrink-0 mt-0.5" />
                            <p className="text-base leading-relaxed">
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
