import React from 'react';
import { Briefcase, Inbox } from 'lucide-react';

const CareersPage: React.FC = () => {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white py-16 sm:py-20 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
            <div className="max-w-3xl mx-auto">
                <div className="text-center space-y-4 mb-10 animate-fade-in-up">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-cyan-50 dark:bg-cyan-950/60 border border-cyan-200 dark:border-cyan-800 text-cyan-600 dark:text-cyan-400">
                        <Briefcase size={22} strokeWidth={1.75} />
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                        Careers at EZJOB
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">
                        Join our mission to revolutionize the skilled trades industry. We're a passionate team of innovators, thinkers, and builders dedicated to creating a platform that empowers workers and businesses alike.
                    </p>
                </div>

                <div className="text-center py-14 sm:py-16 px-6 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 animate-fade-in-up" style={{ animationDelay: '80ms' }}>
                    <div className="inline-flex items-center justify-center w-11 h-11 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 mb-4">
                        <Inbox size={20} strokeWidth={1.75} />
                    </div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">No Open Positions Currently</h2>
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                        We're always on the lookout for great talent. Please check back later or send your resume to{' '}
                        <a
                            href="mailto:careers@ezjob.com"
                            className="font-semibold text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 underline decoration-cyan-300 dark:decoration-cyan-700 underline-offset-4 transition-colors"
                        >
                            careers@ezjob.com
                        </a>.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default CareersPage;
