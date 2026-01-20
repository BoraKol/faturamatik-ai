import React, { useState, useEffect, useCallback } from 'react';
import { extractInvoiceData } from './services/geminiService';
import { saveInvoice, getInvoices, updateInvoice, validateMath, exportToCSV } from './services/storageService';
import { Invoice, InvoiceStatus, Currency } from './types';
import Dashboard from './components/Dashboard';
import InvoiceTable from './components/InvoiceTable';
import EditModal from './components/EditModal';
import InvoiceDetailModal from './components/InvoiceDetailModal';
import ApiKeyInput from './components/ApiKeyInput';
import { UploadCloud, Loader2, Zap, CheckCircle2 } from 'lucide-react';

const API_KEY_STORAGE = 'faturamatik_api_key';

function App() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [apiKey, setApiKey] = useState<string | null>(null);

  // Initial data load
  useEffect(() => {
    setInvoices(getInvoices());
    // Load API key from localStorage
    const savedKey = localStorage.getItem(API_KEY_STORAGE);
    if (savedKey) setApiKey(savedKey);
  }, []);

  const handleApiKeySet = (key: string) => {
    if (key) {
      localStorage.setItem(API_KEY_STORAGE, key);
      setApiKey(key);
    } else {
      localStorage.removeItem(API_KEY_STORAGE);
      setApiKey(null);
    }
  };

  // Delay helper for rate limiting
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // Process a single file with retry logic for rate limits
  const processFile = async (file: File, retryCount = 0): Promise<Invoice | null> => {
    if (!apiKey) {
      console.error('No API key available');
      return null;
    }

    const MAX_RETRIES = 3;
    const BASE_DELAY = 5000; // 5 seconds base delay for retry

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64String = (reader.result as string).split(',')[1];

        try {
          // 1. Extract
          const extractedData = await extractInvoiceData(base64String, file.type, apiKey);
          console.log('Extracted data:', extractedData);

          // 2. Validate
          const validation = validateMath(extractedData);

          // 3. Construct Invoice Object
          const newInvoice: Invoice = {
            id: crypto.randomUUID().slice(0, 8).toUpperCase(),
            filename: file.name,
            uploadTimestamp: Date.now(),
            status: validation.status,
            validationMessage: validation.message,
            ...extractedData
          };

          // 4. Save
          saveInvoice(newInvoice);
          console.log('Invoice saved:', newInvoice);
          resolve(newInvoice);
        } catch (err: any) {
          console.error('Error processing invoice:', err);

          // Check if it's a rate limit error and we can retry
          const isRateLimit = err?.message?.includes('429') || err?.message?.includes('RESOURCE_EXHAUSTED');

          if (isRateLimit && retryCount < MAX_RETRIES) {
            const waitTime = BASE_DELAY * Math.pow(2, retryCount);
            console.log(`Rate limit hit, retrying in ${waitTime / 1000}s... (attempt ${retryCount + 1}/${MAX_RETRIES})`);
            setProcessingStatus(`API limiti - ${Math.ceil(waitTime / 1000)}s bekleniyor...`);
            await delay(waitTime);
            resolve(await processFile(file, retryCount + 1));
          } else {
            alert(`Fatura işlenirken hata: ${err instanceof Error ? err.message : 'Bilinmeyen hata'}`);
            resolve(null);
          }
        }
      };
      reader.onerror = () => {
        console.error('File read error');
        resolve(null);
      };
      reader.readAsDataURL(file);
    });
  };

  // Handle multiple files upload with rate limiting
  const handleFilesUpload = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    setIsProcessing(true);
    const totalFiles = fileArray.length;
    let processedCount = 0;
    let successCount = 0;

    for (const file of fileArray) {
      processedCount++;
      setProcessingStatus(`Fatura okunuyor (${processedCount}/${totalFiles}): ${file.name}`);

      const invoice = await processFile(file);
      if (invoice) {
        successCount++;
        setInvoices(prev => [invoice, ...prev]);
      }

      // Add delay between files to avoid rate limiting (6 seconds)
      if (processedCount < totalFiles) {
        setProcessingStatus(`Sıradaki fatura için bekleniyor... (${processedCount}/${totalFiles})`);
        await delay(6000);
      }
    }

    setProcessingStatus(`${successCount}/${totalFiles} fatura başarıyla yüklendi!`);
    setTimeout(() => {
      setProcessingStatus('');
      setIsProcessing(false);
    }, 2000);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    await handleFilesUpload(files);
    // Reset input value so the same file can be selected again
    event.target.value = '';
  };

  // Drag and Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      // Filter only valid file types
      const validFiles = Array.from(files).filter(file =>
        file.type.startsWith('image/') || file.type === 'application/pdf'
      );
      if (validFiles.length > 0) {
        await handleFilesUpload(validFiles);
      }
    }
  };

  const handleSaveEdit = (updated: Invoice) => {
    updateInvoice(updated);
    setInvoices(getInvoices()); // Refresh list
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-1.5 rounded-lg text-white">
              <Zap className="w-5 h-5 fill-current" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Faturamatik AI</h1>
          </div>
          <div className="text-sm text-slate-500">
            Fatura yönetimi artık çok kolay
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-8">

        {/* Upload & Stats Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* API Key Input or Upload Zone */}
          <div className="lg:col-span-1">
            {!apiKey ? (
              /* API Key Input Section */
              <div className="h-full min-h-[380px] flex flex-col">
                <ApiKeyInput onApiKeySet={handleApiKeySet} currentKey={apiKey} />
                <div className="flex-1 mt-4 bg-slate-100 rounded-2xl border-2 border-dashed border-slate-300 flex items-center justify-center">
                  <div className="text-center p-6">
                    <UploadCloud className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-400 text-sm">API key girdikten sonra fatura yükleyebilirsin</p>
                  </div>
                </div>
              </div>
            ) : (
              /* Upload Zone - Premium Redesign */
              <div
                className={`relative h-full min-h-[380px] rounded-3xl overflow-hidden group transition-all duration-300 ${isDragging ? 'scale-[1.02] ring-4 ring-white/50' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                {/* Animated gradient background */}
                <div className="absolute inset-0 bg-gradient-to-br from-violet-600 via-blue-600 to-cyan-500 opacity-90"></div>
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.15)_0%,_transparent_50%)]"></div>

                {/* Floating orbs decoration */}
                <div className="absolute top-10 right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl animate-pulse"></div>
                <div className="absolute bottom-20 left-5 w-24 h-24 bg-cyan-300/20 rounded-full blur-xl"></div>
                <div className="absolute top-1/2 right-0 w-40 h-40 bg-purple-400/10 rounded-full blur-3xl"></div>

                {/* Grid pattern overlay */}
                <div className="absolute inset-0 opacity-[0.05]" style={{
                  backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
                  backgroundSize: '20px 20px'
                }}></div>

                {/* Content */}
                <div className="relative z-10 h-full flex flex-col p-6">
                  {/* Header with AI badge */}
                  <div className="mb-6">
                    <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-3 py-1.5 mb-4">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-xs font-medium text-white/90">Akıllı Okuma</span>
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Fatura Yükle</h2>
                    <p className="text-white/70 text-sm leading-relaxed">
                      Faturanı yükle, bilgiler otomatik olarak çıkarılsın. Elle veri girişine son!
                    </p>
                  </div>

                  {/* Upload Area */}
                  <label
                    className={`
                     flex-1 relative rounded-2xl cursor-pointer transition-all duration-300
                     ${isProcessing
                        ? 'pointer-events-none'
                        : 'hover:scale-[1.02] active:scale-[0.98]'}
                   `}
                  >
                    {/* Glassmorphism card */}
                    <div className={`
                     absolute inset-0 rounded-2xl backdrop-blur-xl bg-white/10 
                     border border-white/20 shadow-2xl transition-all duration-300
                     ${!isProcessing && 'group-hover:bg-white/15 group-hover:border-white/30'}
                   `}></div>

                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      className="hidden"
                      onChange={handleFileUpload}
                      disabled={isProcessing}
                      multiple
                    />

                    <div className="relative z-10 h-full flex flex-col items-center justify-center p-6">
                      {isProcessing ? (
                        <div className="flex flex-col items-center">
                          {/* AI Processing Animation */}
                          <div className="relative mb-4">
                            <div className="w-16 h-16 rounded-full border-2 border-white/20 border-t-white animate-spin"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <Zap className="w-6 h-6 text-white animate-pulse" />
                            </div>
                          </div>
                          <span className="font-medium text-white text-sm text-center">{processingStatus}</span>
                          <div className="mt-3 flex gap-1">
                            <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                            <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                            <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                          </div>
                        </div>
                      ) : (
                        <>
                          {/* Upload Icon with glow */}
                          <div className="relative mb-4">
                            <div className="absolute inset-0 bg-white/20 rounded-full blur-xl scale-150"></div>
                            <div className="relative w-16 h-16 bg-white/10 backdrop-blur rounded-full flex items-center justify-center border border-white/20">
                              <UploadCloud className="w-8 h-8 text-white" />
                            </div>
                          </div>

                          <span className="font-semibold text-white text-base mb-1">Dosya Yükle</span>
                          <span className="text-white/60 text-xs mb-4">veya sürükle bırak</span>

                          {/* File type badges */}
                          <div className="flex gap-2">
                            <span className="px-2.5 py-1 bg-white/10 backdrop-blur-sm rounded-full text-xs font-medium text-white/80">PDF</span>
                            <span className="px-2.5 py-1 bg-white/10 backdrop-blur-sm rounded-full text-xs font-medium text-white/80">PNG</span>
                            <span className="px-2.5 py-1 bg-white/10 backdrop-blur-sm rounded-full text-xs font-medium text-white/80">JPG</span>
                          </div>
                        </>
                      )}
                    </div>
                  </label>

                  {/* Bottom stats */}
                  <div className="mt-4 flex items-center justify-between text-xs text-white/50">
                    <span>Maks. 10MB</span>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Güvenli işlem</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Dashboard Stats */}
          <div className="lg:col-span-2">
            <Dashboard invoices={invoices} />
          </div>
        </div>

        {/* Data Table */}
        <InvoiceTable
          invoices={invoices}
          onEdit={setEditingInvoice}
          onView={setViewingInvoice}
          onExport={() => exportToCSV(invoices)}
        />

      </main>

      {/* Edit Modal */}
      <EditModal
        isOpen={!!editingInvoice}
        invoice={editingInvoice}
        onClose={() => setEditingInvoice(null)}
        onSave={handleSaveEdit}
      />

      {/* Detail Modal */}
      <InvoiceDetailModal
        isOpen={!!viewingInvoice}
        invoice={viewingInvoice}
        onClose={() => setViewingInvoice(null)}
      />
    </div>
  );
}

export default App;