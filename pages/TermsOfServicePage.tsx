
import React from 'react';
import { useSiteContent } from '../contexts/SiteContentContext';

const TermsOfServicePage: React.FC = () => {
    const { legalPagesContent } = useSiteContent();

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="bg-white p-8 rounded-lg shadow-md">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">Terms of Service</h1>
                <div className="prose max-w-none text-gray-600 whitespace-pre-wrap">
                    <p>
                        {legalPagesContent.termsOfService}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default TermsOfServicePage;
