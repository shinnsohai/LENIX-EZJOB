
import React from 'react';

const ContactPage: React.FC = () => {
    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="bg-white p-8 rounded-lg shadow-md">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">Contact Us</h1>
                <p className="text-gray-600 mb-6">
                    We'd love to hear from you! Whether you have a question about our features, a partnership proposal, or anything else, our team is ready to answer all your questions.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-800 mb-2">General Inquiries</h2>
                        <p className="text-gray-600">
                            <strong>Email:</strong> <a href="mailto:contact@ezjob.com" className="text-emerald-600">contact@ezjob.com</a>
                        </p>
                        <p className="text-gray-600">
                            <strong>Phone:</strong> +65 1234 5678
                        </p>
                    </div>
                     <div>
                        <h2 className="text-xl font-semibold text-gray-800 mb-2">Our Office</h2>
                        <p className="text-gray-600">
                            123 Tech Avenue<br />
                            Singapore 123456
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ContactPage;
