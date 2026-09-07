import React from 'react';
import { Newspaper, AlertTriangle, ArrowRight } from 'lucide-react';
import { useSiteContent } from '../contexts/SiteContentContext';

const BlogPage: React.FC = () => {
    const { blogPosts, error } = useSiteContent();

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white py-16 sm:py-20 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
            <div className="max-w-6xl mx-auto">
                <div className="text-center space-y-4 mb-12 animate-fade-in-up">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-cyan-50 dark:bg-cyan-950/60 border border-cyan-200 dark:border-cyan-800 text-cyan-600 dark:text-cyan-400">
                        <Newspaper size={22} strokeWidth={1.75} />
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                        EZJOB Blog
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">
                        Insights, news, and stories from the world of skilled trades and technology.
                    </p>
                </div>

                {error && (
                    <div className="mb-8 flex items-center gap-3 px-4 py-3 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-sm">
                        <AlertTriangle size={16} strokeWidth={1.75} className="shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                {blogPosts.length === 0 ? (
                    <div className="text-center py-14 sm:py-16 px-6 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900">
                        <div className="inline-flex items-center justify-center w-11 h-11 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 mb-4">
                            <Newspaper size={20} strokeWidth={1.75} />
                        </div>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">No articles yet</h2>
                        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                            Check back soon. New stories from the field get posted here as they're published.
                        </p>
                    </div>
                ) : (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                        {blogPosts.map((post, i) => (
                            <article
                                key={post.id}
                                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-lg hover:-translate-y-1 overflow-hidden flex flex-col transition-all duration-300 animate-fade-in-up"
                                style={{ animationDelay: `${Math.min(i, 6) * 70}ms` }}
                            >
                                <div className="aspect-video w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                                    <img
                                        src={post.imageUrl || `https://picsum.photos/seed/ezjob-blog-${post.id}/800/450`}
                                        alt={post.title}
                                        className="h-full w-full object-cover"
                                        loading="lazy"
                                    />
                                </div>
                                <div className="p-6 flex flex-col flex-grow">
                                    <h3 className="font-bold text-lg leading-snug mb-2 line-clamp-2 text-slate-900 dark:text-white">{post.title}</h3>
                                    <div className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                                        <span>By {post.author}</span> <span className="mx-1">·</span> <span>{new Date(post.publishDate).toLocaleDateString()}</span>
                                    </div>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 flex-grow line-clamp-3">{post.content.substring(0, 120)}...</p>
                                    <span className="inline-flex items-center gap-1 text-cyan-600 dark:text-cyan-400 font-semibold text-sm mt-4 self-start">
                                        Read more <ArrowRight size={14} strokeWidth={2} />
                                    </span>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default BlogPage;
