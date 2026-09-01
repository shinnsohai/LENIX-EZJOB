
import React from 'react';

const CareersPage: React.FC = () => {
    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="bg-white p-8 rounded-lg shadow-md">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">Careers at EZJOB</h1>
                 <p className="text-gray-600 mb-6">
                    Join our mission to revolutionize the skilled trades industry. We're a passionate team of innovators, thinkers, and builders dedicated to creating a platform that empowers workers and businesses alike.
                </p>
                <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-lg">
                    <h2 className="text-xl font-semibold text-gray-800">No Open Positions Currently</h2>
                    <p className="mt-2 text-gray-500">
                        We're always on the lookout for great talent. Please check back later or send your resume to <a href="mailto:careers@ezjob.com" className="text-emerald-600">careers@ezjob.com</a>.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default CareersPage;
