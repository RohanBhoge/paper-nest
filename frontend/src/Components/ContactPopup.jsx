import React from 'react';
import { X, Mail, Send, ArrowLeft } from 'lucide-react';

const ContactPopup = ({ onClose }) => {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop with blur effect */}
            <div
                className="absolute inset-0 bg-blue-900/20 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Popup Content */}
            <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl p-8 animate-in fade-in zoom-in duration-300">
                <button
                    onClick={onClose}
                    className="absolute left-4 top-4 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer flex items-center gap-1 group"
                >
                    <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="text-sm font-medium">Back</span>
                </button>

                <button
                    onClick={onClose}
                    className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                >
                    <X size={24} />
                </button>

                <div className="text-center mb-6">
                    <div className="mx-auto w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mb-4 shadow-lg text-white">
                        <Mail size={24} />
                    </div>
                    <h2 className="text-3xl font-bold text-[#1D378A]">Contact Us</h2>
                </div>

                <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                    <div>
                        <input
                            type="text"
                            placeholder="Full Name"
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                        />
                    </div>

                    <div>
                        <input
                            type="email"
                            placeholder="Email"
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                        />
                    </div>

                    <div>
                        <input
                            type="tel"
                            placeholder="Mobile"
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                        />
                    </div>

                    <div>
                        <input
                            type="text"
                            placeholder="Organization"
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                        />
                    </div>

                    <div>
                        <textarea
                            placeholder="Message"
                            rows={4}
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all resize-none"
                        ></textarea>
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                    >
                        <Send size={20} />
                        Send Message
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ContactPopup;
