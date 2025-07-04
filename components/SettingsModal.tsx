
import React from 'react';
import { ThemeSelector } from './ThemeSelector';
import { BackgroundSelector } from './BackgroundSelector';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    setThemeColor: (color: string) => void;
    setBackgroundImage: (imageDataUrl: string | null) => void;
    timeFormat: '12h' | '24h';
    setTimeFormat: (format: '12h' | '24h') => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, setThemeColor, setBackgroundImage, timeFormat, setTimeFormat }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 transition-opacity" onClick={onClose}>
            <div className="bg-[#1e1e1e] rounded-lg shadow-xl p-8 m-4 max-w-lg w-full transform transition-all" onClick={(e) => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
                <h2 className="text-2xl font-bold mb-6 text-white">Settings</h2>

                <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-2 text-gray-200">Theme Color</h3>
                    <ThemeSelector setThemeColor={setThemeColor} />
                </div>

                <div>
                    <h3 className="text-lg font-semibold mb-2 text-gray-200">Background Image</h3>
                    <BackgroundSelector setBackgroundImage={setBackgroundImage} />
                </div>

                <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-2 text-gray-200">Time Format</h3>
                    <div className="flex space-x-4">
                        <label className="inline-flex items-center">
                            <input
                                type="radio"
                                className="form-radio text-[rgb(var(--color-accent))] focus:ring-[rgb(var(--color-accent))]"
                                name="timeFormat"
                                value="12h"
                                checked={timeFormat === '12h'}
                                onChange={() => setTimeFormat('12h')}
                            />
                            <span className="ml-2 text-gray-300">12h (AM/PM)</span>
                        </label>
                        <label className="inline-flex items-center">
                            <input
                                type="radio"
                                className="form-radio text-[rgb(var(--color-accent))] focus:ring-[rgb(var(--color-accent))]"
                                name="timeFormat"
                                value="24h"
                                checked={timeFormat === '24h'}
                                onChange={() => setTimeFormat('24h')}
                            />
                            <span className="ml-2 text-gray-300">24h</span>
                        </label>
                    </div>
                </div>

                <div className="mt-8 text-right">
                    <button onClick={onClose} className="bg-gray-600 text-white font-bold px-4 py-2 rounded-md hover:bg-gray-500 transition-colors">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};
