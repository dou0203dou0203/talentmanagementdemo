import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

interface AIContextType {
    getValidApiKey: () => Promise<string | null>;
    handleApiError: (error: any) => void;
}

const AIContext = createContext<AIContextType | null>(null);

export function AIProvider({ children }: { children: ReactNode }) {
    const [isPromptOpen, setIsPromptOpen] = useState(false);
    const [apiKeyInput, setApiKeyInput] = useState('');
    const [resolvePromise, setResolvePromise] = useState<((key: string | null) => void) | null>(null);

    // Initial load from localStorage
    useEffect(() => {
        const stored = localStorage.getItem('gemini_api_key');
        if (stored) setApiKeyInput(stored);
    }, []);

    const processApiRequest = (existingKey: string | null): Promise<string | null> => {
        return new Promise((resolve) => {
            if (existingKey) {
                // Return immediately if key exists in memory
                resolve(existingKey);
            } else {
                // Pause and request user input via modal
                setApiKeyInput('');
                setResolvePromise(() => resolve);
                setIsPromptOpen(true);
            }
        });
    };

    const getValidApiKey = async (): Promise<string | null> => {
        const stored = localStorage.getItem('gemini_api_key');
        return processApiRequest(stored);
    };

    const handleApiError = (error: any) => {
        const msg = error?.message?.toLowerCase() || '';
        // If error seems to be API Key related, prompt again
        if (msg.includes('api key') || msg.includes('403') || msg.includes('401') || msg.includes('unauthorized') || msg.includes('not found') || msg.includes('invalid')) {
            alert('APIキーが無効、もしくは期限切れの可能性があります。再度設定してください。');
            localStorage.removeItem('gemini_api_key');
            setApiKeyInput('');
            
            // Note: Since this is often a synchronous catch, we just open the prompt.
            // Next time the user clicks the AI button, getValidApiKey will pause and wait for input.
            setIsPromptOpen(true);
        } else {
            alert('AIの解析中にエラーが発生しました: ' + (error?.message || '不明なエラー'));
        }
    };

    const submitKey = () => {
        const key = apiKeyInput.trim();
        if (!key) {
            alert('APIキーを入力してください');
            return;
        }
        localStorage.setItem('gemini_api_key', key);
        setIsPromptOpen(false);
        if (resolvePromise) {
            resolvePromise(key);
            setResolvePromise(null);
        }
    };

    const cancelDialog = () => {
        setIsPromptOpen(false);
        if (resolvePromise) {
            resolvePromise(null);
            setResolvePromise(null);
        }
    };

    return (
        <AIContext.Provider value={{ getValidApiKey, handleApiError }}>
            {children}
            {isPromptOpen && (
                <div className="modal-overlay" style={{ zIndex: 9999 }} onClick={cancelDialog}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 450 }}>
                        <div className="modal-header">
                            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span>🔑</span> Gemini APIキーの設定
                            </h3>
                            <button className="modal-close" onClick={cancelDialog}>✕</button>
                        </div>
                        <div style={{ margin: '20px 0', fontSize: '0.9rem', color: '#475569', lineHeight: 1.6 }}>
                            <p>この機能を利用するには Google Gemini の APIキー が必要です。</p>
                            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', marginTop: 12 }}>
                                <strong style={{ color: '#0f172a', display: 'block', marginBottom: 4 }}>🔐 セキュリティについて</strong>
                                入力されたAPIキーは外部サーバーには一切送信されず、<br />
                                <b>お使いのブラウザ内部 (localStorage) にのみ安全に保存されます。</b>
                            </div>
                        </div>
                        <div className="sp-form-field">
                            <label>APIキーを入力してください</label>
                            <input
                                type="password"
                                className="form-input"
                                placeholder="AIzaSy..."
                                value={apiKeyInput}
                                onChange={(e) => setApiKeyInput(e.target.value)}
                                autoFocus
                            />
                        </div>
                        <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                            <button className="btn btn-primary" onClick={submitKey} style={{ flex: 1 }}>保存して続行</button>
                            <button className="btn btn-secondary" onClick={cancelDialog}>キャンセル</button>
                        </div>
                    </div>
                </div>
            )}
        </AIContext.Provider>
    );
}

export function useAI() {
    const ctx = useContext(AIContext);
    if (!ctx) throw new Error('useAI must be used within AIProvider');
    return ctx;
}
