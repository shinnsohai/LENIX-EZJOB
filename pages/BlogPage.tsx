import React from 'react';
import { useSiteContent } from '../contexts/SiteContentContext';

const BlogPage: React.FC = () => {
    const { blogPosts } = useSiteContent();

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="bg-white p-8 rounded-lg shadow-md">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">EZJOB Blog</h1>
                <p className="text-gray-600 mb-8">
                    Insights, news, and stories from the world of skilled trades and technology.
                </p>
                 <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {blogPosts.map(post => (
                        <div key={post.id} className="bg-slate-50 rounded-lg shadow-sm overflow-hidden flex flex-col">
                            <img 
                                src={post.imageUrl || 'https://via.placeholder.com/400x200'} 
                                alt={post.title} 
                                className="h-48 w-full object-cover" 
                            />
                            <div className="p-6 flex flex-col flex-grow">
                                <h3 className="font-bold text-xl mb-2">{post.title}</h3>
                                <div className="text-xs text-gray-500 mb-3">
                                    <span>By {post.author}</span> &middot; <span>{new Date(post.publishDate).toLocaleDateString()}</span>
                                </div>
                                <p className="text-sm text-gray-600 flex-grow">{post.content.substring(0, 120)}...</p>
                                <button className="text-emerald-600 hover:underline mt-4 inline-block self-start text-sm font-semibold">
                                    Read More &rarr;
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default BlogPage;