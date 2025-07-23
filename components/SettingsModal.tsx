
import React, { useState } from 'react';
import { Modal } from './Modal';
import { ThemeSelector } from './ThemeSelector';
import { BackgroundSelector } from './BackgroundSelector';
import { ThemeCustomizer } from './ThemeCustomizer';
import { useExtendedTheme } from '../hooks/useExtendedTheme';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    setBackgroundImage: (imageDataUrl: string | null) => void;
    timeFormat: '12h' | '24h';
    setTimeFormat: (format: '12h' | '24h') => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
    isOpen,
    onClose,
    setBackgroundImage,
    timeFormat,
    setTimeFormat
}) => {
    const [isThemeCustomizerOpen, setIsThemeCustomizerOpen] = useState(false);
    const { currentTheme, updateThemeSettings, themeSettings } = useExtendedTheme();

    // Legacy theme color setter for backward compatibility
    const setThemeColor = (color: string) => {
        // This is kept for compatibility with the old ThemeSelector
        // The new system handles theme changes through the extended theme hook
        document.documentElement.style.setProperty('--color-accent', color);
    };

    return (
        <>
            <Modal isOpen={isOpen} onClose={onClose} initialFocus="h2" ariaLabelledBy="settings-modal-title">
                <h2 id="settings-modal-title" className="text-2xl font-bold mb-6 text-white" tabIndex={-1}>Settings</h2>

                <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-2 text-gray-200">Theme</h3>
                    <div className="space-y-4">
                        <div>
                            <p className="text-sm text-gray-400 mb-2">Current theme: {currentTheme.name}</p>
                            <button
                                onClick={() => setIsThemeCustomizerOpen(true)}
                                className="bg-[rgb(var(--color-accent))] hover:bg-[rgb(var(--color-accent))] hover:opacity-80 text-white font-bold py-2 px-4 rounded transition-colors"
                            >
                                Advanced Theme Settings
                            </button>
                        </div>

                        <div>
                            <h4 className="text-md font-medium mb-2 text-gray-300">Quick Theme Colors</h4>
                            <ThemeSelector setThemeColor={setThemeColor} />
                        </div>

                        <div>
                            <label className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    checked={themeSettings.autoDetectSystemTheme}
                                    onChange={(e) => updateThemeSettings({ autoDetectSystemTheme: e.target.checked })}
                                    className="rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500"
                                />
                                <span className="text-sm text-gray-300">Auto-detect system theme (dark/light mode)</span>
                            </label>
                        </div>

                        <div>
                            <label className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    checked={themeSettings.themeTransitions}
                                    onChange={(e) => updateThemeSettings({ themeTransitions: e.target.checked })}
                                    className="rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500"
                                />
                                <span className="text-sm text-gray-300">Enable smooth theme transitions</span>
                            </label>
                        </div>
                    </div>
                </div>

                <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-2 text-gray-200">Background Image</h3>
                    <BackgroundSelector setBackgroundImage={setBackgroundImage} />
                </div>

                <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-2 text-gray-200">Time Format</h3>
                    <fieldset>
                        <legend className="sr-only">Choose time format</legend>
                        <div className="flex space-x-4">
                            <label className="inline-flex items-center">
                                <input
                                    type="radio"
                                    className="form-radio text-[rgb(var(--color-accent))] focus:ring-[rgb(var(--color-accent))]"
                                    name="timeFormat"
                                    value="12h"
                                    checked={timeFormat === '12h'}
                                    onChange={() => setTimeFormat('12h')}
                                    aria-describedby="time-format-description"
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
                                    aria-describedby="time-format-description"
                                />
                                <span className="ml-2 text-gray-300">24h</span>
                            </label>
                        </div>
                        <div id="time-format-description" className="sr-only">
                            Select your preferred time format for the clock display
                        </div>
                    </fieldset>
                </div>

                <div className="mt-8 text-right">
                    <button
                        onClick={onClose}
                        className="bg-gray-600 text-white font-bold px-4 py-2 rounded-md hover:bg-gray-500 transition-colors"
                    >
                        Close
                    </button>
                </div>
            </Modal>

            <ThemeCustomizer
                isOpen={isThemeCustomizerOpen}
                onClose={() => setIsThemeCustomizerOpen(false)}
            />
        </>
    );
};
