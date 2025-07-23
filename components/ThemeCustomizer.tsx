import React, { useState, useCallback } from 'react';
import type { ExtendedTheme, ThemePreset } from '../types';
import { useExtendedTheme } from '../hooks/useExtendedTheme';
import { exportTheme, importTheme } from '../services/themeUtils';

interface ThemeCustomizerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  description?: string;
}

const ColorPicker: React.FC<ColorPickerProps> = ({ label, value, onChange, description }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [rgbInput, setRgbInput] = useState(value);

  const handleRgbChange = (newValue: string) => {
    setRgbInput(newValue);
    // Validate RGB format before applying
    if (/^\d{1,3}\s+\d{1,3}\s+\d{1,3}$/.test(newValue)) {
      const values = newValue.split(/\s+/).map(Number);
      if (values.every(val => val >= 0 && val <= 255)) {
        onChange(newValue);
      }
    }
  };

  const presetColors = [
    { name: 'Teal', value: '20 184 166' },
    { name: 'Blue', value: '59 130 246' },
    { name: 'Purple', value: '168 85 247' },
    { name: 'Green', value: '34 197 94' },
    { name: 'Red', value: '239 68 68' },
    { name: 'Orange', value: '249 115 22' },
    { name: 'Pink', value: '236 72 153' },
    { name: 'Indigo', value: '99 102 241' },
  ];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-300">{label}</label>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs text-gray-400 hover:text-gray-300 transition-colors"
        >
          {isExpanded ? 'Collapse' : 'Expand'}
        </button>
      </div>

      {description && (
        <p className="text-xs text-gray-400">{description}</p>
      )}

      <div className="flex items-center space-x-3">
        <div
          className="w-8 h-8 rounded border-2 border-gray-600 flex-shrink-0"
          style={{ backgroundColor: `rgb(${value})` }}
        />
        <input
          type="text"
          value={rgbInput}
          onChange={(e) => handleRgbChange(e.target.value)}
          placeholder="255 255 255"
          className="flex-1 px-3 py-1 bg-gray-700 border border-gray-600 rounded text-sm text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
        />
      </div>

      {isExpanded && (
        <div className="grid grid-cols-4 gap-2 mt-2">
          {presetColors.map((color) => (
            <button
              key={color.name}
              onClick={() => {
                setRgbInput(color.value);
                onChange(color.value);
              }}
              className="flex flex-col items-center space-y-1 p-2 rounded hover:bg-gray-700 transition-colors"
              title={color.name}
            >
              <div
                className="w-6 h-6 rounded border border-gray-600"
                style={{ backgroundColor: `rgb(${color.value})` }}
              />
              <span className="text-xs text-gray-400">{color.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export const ThemeCustomizer: React.FC<ThemeCustomizerProps> = ({ isOpen, onClose }) => {
  const {
    currentTheme,
    defaultPresets,
    customThemes,
    setCurrentTheme,
    addCustomTheme,
    removeCustomTheme,
    duplicateTheme,
  } = useExtendedTheme();

  const [editingTheme, setEditingTheme] = useState<ExtendedTheme>(currentTheme);
  const [activeTab, setActiveTab] = useState<'presets' | 'customize' | 'import-export'>('presets');
  const [importText, setImportText] = useState('');
  const [exportText, setExportText] = useState('');

  // Update editing theme when current theme changes
  React.useEffect(() => {
    setEditingTheme(currentTheme);
  }, [currentTheme]);

  const handleThemeChange = useCallback((updates: Partial<ExtendedTheme>) => {
    setEditingTheme(prev => ({ ...prev, ...updates }));
  }, []);

  const handleColorChange = useCallback((colorKey: keyof ExtendedTheme['colors'], value: string) => {
    setEditingTheme(prev => ({
      ...prev,
      colors: { ...prev.colors, [colorKey]: value }
    }));
  }, []);

  const handleApplyTheme = useCallback(() => {
    setCurrentTheme(editingTheme);
  }, [editingTheme, setCurrentTheme]);

  const handleSaveAsCustom = useCallback(() => {
    const customTheme: ExtendedTheme = {
      ...editingTheme,
      id: `custom-${Date.now()}`,
      name: `${editingTheme.name} (Custom)`,
    };
    addCustomTheme(customTheme);
    setCurrentTheme(customTheme);
  }, [editingTheme, addCustomTheme, setCurrentTheme]);

  const handlePresetSelect = useCallback((preset: ThemePreset) => {
    setEditingTheme(preset.theme);
    setCurrentTheme(preset.theme);
  }, [setCurrentTheme]);

  const handleExport = useCallback(() => {
    setExportText(exportTheme(editingTheme));
  }, [editingTheme]);

  const handleImport = useCallback(() => {
    const imported = importTheme(importText);
    if (imported) {
      setEditingTheme(imported);
      setImportText('');
      alert('Theme imported successfully!');
    } else {
      alert('Failed to import theme. Please check the format.');
    }
  }, [importText]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">Theme Customizer</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="Close theme customizer"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-700">
          {[
            { id: 'presets', label: 'Theme Presets' },
            { id: 'customize', label: 'Customize' },
            { id: 'import-export', label: 'Import/Export' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-blue-400 border-b-2 border-blue-400'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'presets' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Default Presets</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {defaultPresets.map((preset) => (
                    <div
                      key={preset.id}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        currentTheme.id === preset.id
                          ? 'border-blue-500 bg-blue-500 bg-opacity-10'
                          : 'border-gray-600 hover:border-gray-500'
                      }`}
                      onClick={() => handlePresetSelect(preset)}
                    >
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="flex space-x-1">
                          {Object.entries(preset.theme.colors).slice(0, 4).map(([key, color]) => (
                            <div
                              key={key}
                              className="w-4 h-4 rounded"
                              style={{ backgroundColor: `rgb(${color})` }}
                            />
                          ))}
                        </div>
                        <div>
                          <h4 className="font-medium text-white">{preset.name}</h4>
                          <p className="text-sm text-gray-400">{preset.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs px-2 py-1 bg-gray-700 rounded text-gray-300">
                          {preset.category}
                        </span>
                        {currentTheme.id === preset.id && (
                          <span className="text-xs text-blue-400">Active</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {customThemes.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Custom Themes</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {customThemes.map((theme) => (
                      <div
                        key={theme.id}
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          currentTheme.id === theme.id
                            ? 'border-blue-500 bg-blue-500 bg-opacity-10'
                            : 'border-gray-600 hover:border-gray-500'
                        }`}
                        onClick={() => setCurrentTheme(theme)}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className="flex space-x-1">
                              {Object.entries(theme.colors).slice(0, 4).map(([key, color]) => (
                                <div
                                  key={key}
                                  className="w-4 h-4 rounded"
                                  style={{ backgroundColor: `rgb(${color})` }}
                                />
                              ))}
                            </div>
                            <h4 className="font-medium text-white">{theme.name}</h4>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeCustomTheme(theme.id);
                            }}
                            className="text-red-400 hover:text-red-300 transition-colors"
                            title="Delete theme"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                        {currentTheme.id === theme.id && (
                          <span className="text-xs text-blue-400">Active</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'customize' && (
            <div className="space-y-6">
              {/* Theme Info */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Theme Name</label>
                  <input
                    type="text"
                    value={editingTheme.name}
                    onChange={(e) => handleThemeChange({ name: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Colors */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Colors</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <ColorPicker
                    label="Primary"
                    value={editingTheme.colors.primary}
                    onChange={(value) => handleColorChange('primary', value)}
                    description="Main brand color"
                  />
                  <ColorPicker
                    label="Accent"
                    value={editingTheme.colors.accent}
                    onChange={(value) => handleColorChange('accent', value)}
                    description="Highlight and interactive elements"
                  />
                  <ColorPicker
                    label="Background"
                    value={editingTheme.colors.background}
                    onChange={(value) => handleColorChange('background', value)}
                    description="Main background color"
                  />
                  <ColorPicker
                    label="Surface"
                    value={editingTheme.colors.surface}
                    onChange={(value) => handleColorChange('surface', value)}
                    description="Cards and elevated surfaces"
                  />
                  <ColorPicker
                    label="Text"
                    value={editingTheme.colors.text}
                    onChange={(value) => handleColorChange('text', value)}
                    description="Primary text color"
                  />
                  <ColorPicker
                    label="Secondary Text"
                    value={editingTheme.colors.textSecondary}
                    onChange={(value) => handleColorChange('textSecondary', value)}
                    description="Muted text and descriptions"
                  />
                </div>
              </div>

              {/* Layout Options */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Layout & Appearance</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Layout Density</label>
                    <select
                      value={editingTheme.layout}
                      onChange={(e) => handleThemeChange({ layout: e.target.value as any })}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="compact">Compact</option>
                      <option value="comfortable">Comfortable</option>
                      <option value="spacious">Spacious</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Content Density</label>
                    <select
                      value={editingTheme.density}
                      onChange={(e) => handleThemeChange({ density: e.target.value as any })}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Border Radius</label>
                    <select
                      value={editingTheme.borderRadius}
                      onChange={(e) => handleThemeChange({ borderRadius: e.target.value as any })}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="none">None</option>
                      <option value="small">Small</option>
                      <option value="medium">Medium</option>
                      <option value="large">Large</option>
                    </select>
                  </div>

                  <div className="space-y-3">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={editingTheme.shadows}
                        onChange={(e) => handleThemeChange({ shadows: e.target.checked })}
                        className="rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-300">Enable Shadows</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={editingTheme.animations}
                        onChange={(e) => handleThemeChange({ animations: e.target.checked })}
                        className="rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-300">Enable Animations</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'import-export' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Export Theme</h3>
                <div className="space-y-3">
                  <button
                    onClick={handleExport}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                  >
                    Export Current Theme
                  </button>
                  {exportText && (
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Theme JSON (copy this to share your theme)
                      </label>
                      <textarea
                        value={exportText}
                        readOnly
                        rows={10}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white font-mono text-sm focus:outline-none"
                        onClick={(e) => e.currentTarget.select()}
                      />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Import Theme</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Paste Theme JSON
                    </label>
                    <textarea
                      value={importText}
                      onChange={(e) => setImportText(e.target.value)}
                      placeholder="Paste theme JSON here..."
                      rows={8}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white font-mono text-sm focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <button
                    onClick={handleImport}
                    disabled={!importText.trim()}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded transition-colors"
                  >
                    Import Theme
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-700">
          <div className="flex space-x-3">
            <button
              onClick={handleApplyTheme}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
            >
              Apply Theme
            </button>
            <button
              onClick={handleSaveAsCustom}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
            >
              Save as Custom
            </button>
            {currentTheme.id !== editingTheme.id && (
              <button
                onClick={() => duplicateTheme(editingTheme, `${editingTheme.name} Copy`)}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded transition-colors"
              >
                Duplicate
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
