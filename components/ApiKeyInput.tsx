import React, { useState } from 'react';
import { Key, Eye, EyeOff, ExternalLink, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { validateApiKey } from '../services/geminiService';

interface ApiKeyInputProps {
    onApiKeySet: (key: string) => void;
    currentKey: string | null;
}

const ApiKeyInput: React.FC<ApiKeyInputProps> = ({ onApiKeySet, currentKey }) => {
    const [inputKey, setInputKey] = useState('');
    const [showKey, setShowKey] = useState(false);
    const [isEditing, setIsEditing] = useState(!currentKey);
    const [isValidating, setIsValidating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputKey.trim()) return;

        setIsValidating(true);
        setError(null);

        try {
            const result = await validateApiKey(inputKey.trim());

            if (result.valid) {
                onApiKeySet(inputKey.trim());
                setIsEditing(false);
                setInputKey('');
                setError(null);
            } else {
                setError(result.error || 'API key doğrulanamadı');
            }
        } catch (err) {
            setError('Doğrulama sırasında hata oluştu');
        } finally {
            setIsValidating(false);
        }
    };

    const handleRemoveKey = () => {
        onApiKeySet('');
        setIsEditing(true);
        setError(null);
    };

    if (currentKey && !isEditing) {
        return (
            <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl p-5 border border-emerald-200">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-emerald-100 rounded-lg">
                            <CheckCircle className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-emerald-800">API Key Aktif</h3>
                            <p className="text-xs text-emerald-600">Fatura yükleme hazır</p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2 bg-white/60 rounded-lg px-3 py-2 mb-3">
                    <Key className="w-4 h-4 text-emerald-500" />
                    <code className="text-sm text-emerald-700 flex-1 font-mono">
                        {currentKey.slice(0, 10)}••••••••{currentKey.slice(-4)}
                    </code>
                </div>
                <button
                    onClick={handleRemoveKey}
                    className="text-sm text-emerald-600 hover:text-emerald-800 underline transition-colors"
                >
                    Farklı key kullan
                </button>
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-5 border border-amber-200">
            <div className="flex items-center gap-2 mb-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                    <h3 className="font-semibold text-amber-800">API Key Gerekli</h3>
                    <p className="text-xs text-amber-600">Fatura okuma için Gemini API key girin</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
                <div className="relative">
                    <input
                        type={showKey ? 'text' : 'password'}
                        value={inputKey}
                        onChange={(e) => {
                            setInputKey(e.target.value);
                            setError(null);
                        }}
                        placeholder="AIzaSy... şeklinde key girin"
                        className={`w-full px-4 py-3 pr-12 rounded-xl border bg-white focus:outline-none focus:ring-2 focus:border-transparent text-sm font-mono ${error ? 'border-red-300 focus:ring-red-400' : 'border-amber-200 focus:ring-amber-400'
                            }`}
                        disabled={isValidating}
                    />
                    <button
                        type="button"
                        onClick={() => setShowKey(!showKey)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-400 hover:text-amber-600"
                        disabled={isValidating}
                    >
                        {showKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                </div>

                {error && (
                    <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg border border-red-200">
                        ⚠️ {error}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={!inputKey.trim() || isValidating}
                    className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
                >
                    {isValidating ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>Doğrulanıyor...</span>
                        </>
                    ) : (
                        <span>API Key'i Doğrula ve Kaydet</span>
                    )}
                </button>
            </form>

            <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 flex items-center justify-center gap-2 text-sm text-amber-600 hover:text-amber-800 transition-colors"
            >
                <span>Ücretsiz API Key Al</span>
                <ExternalLink className="w-4 h-4" />
            </a>
        </div>
    );
};

export default ApiKeyInput;
