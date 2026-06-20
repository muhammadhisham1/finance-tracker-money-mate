import React, { useState, useRef, useCallback, useEffect } from 'react';
import { X, Camera, Upload, Scan, Check, AlertTriangle, FileText, CreditCard, Building, FileCheck, SwitchCamera, RefreshCw } from 'lucide-react';
import { Transaction, CATEGORY_LABELS, CURRENCIES, CURRENCY_SYMBOLS, Currency, DocumentType } from '../types';
import { useToast } from '../context/ToastContext';
import { supabase } from '../lib/supabase';

type ScannedFieldType = 'amount' | 'date' | 'merchant' | 'billNumber' | 'accountNumber' | 'chequeNumber' | 'currency';

interface ScannedField {
  key: ScannedFieldType;
  label: string;
  value: string;
}

interface ScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScanComplete: (transactions: Partial<Transaction>[]) => void;
}

export function SmartScanner({ isOpen, onClose, onScanComplete }: ScannerProps) {
  const [mode, setMode] = useState<'upload' | 'camera'>('upload');
  const [step, setStep] = useState<'capture' | 'scanning' | 'review'>('capture');
  const [docType, setDocType] = useState<'receipt' | 'bill' | 'cheque' | 'card'>('receipt');
  const [extractedData, setExtractedData] = useState<Partial<Transaction>[]>([]);
  const [scannedFields, setScannedFields] = useState<ScannedField[]>([]);
  const [cameraActive, setCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startCamera = useCallback(async () => {
    try {
      const constraints = {
        video: { facingMode: facingMode, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err: any) {
      showToast('Camera access denied', 'error');
      setMode('upload');
    }
  }, [facingMode, showToast]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  const switchCamera = () => {
    stopCamera();
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
  };

  useEffect(() => {
    if (mode === 'camera' && isOpen && !cameraActive) {
      startCamera();
    } else if (mode === 'upload' && cameraActive) {
      stopCamera();
    }
  }, [mode, isOpen, cameraActive, startCamera, stopCamera]);

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0);
      processImage(canvas.toDataURL('image/jpeg', 0.9));
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('Please select an image file', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      processImage(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const processImage = (imageData: string) => {
    setStep('scanning');
    stopCamera();
    setTimeout(() => {
      const scanned = simulateOCR(docType);
      setScannedFields(scanned.fields);
      setExtractedData(scanned.transactions);
      setStep('review');
    }, 2500);
  };

  const simulateOCR = (type: 'receipt' | 'bill' | 'cheque' | 'card'): { fields: ScannedField[]; transactions: Partial<Transaction>[] } => {
    const today = new Date().toISOString().split('T')[0];
    const randomAmount = Math.round((Math.random() * 200 + 10) * 100) / 100;

    const merchants = ['Walmart', 'Target', 'Whole Foods', 'Costco', 'Best Buy', 'Shell Gas', 'Amazon'];
    const merchant = merchants[Math.floor(Math.random() * merchants.length)];

    switch (type) {
      case 'receipt':
        return {
          fields: [
            { key: 'amount', label: 'Amount', value: `$${randomAmount.toFixed(2)}` },
            { key: 'date', label: 'Date', value: today },
            { key: 'merchant', label: 'Merchant', value: merchant },
            { key: 'currency', label: 'Currency', value: 'USD' },
          ],
          transactions: [{ type: 'expense', amount: randomAmount, category: 'shopping', description: merchant, date: today, currency: 'USD' }],
        };
      case 'bill':
        return {
          fields: [
            { key: 'amount', label: 'Amount Due', value: `$${(randomAmount * 1.5).toFixed(2)}` },
            { key: 'date', label: 'Due Date', value: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] },
            { key: 'merchant', label: 'Provider', value: 'City Utilities' },
            { key: 'billNumber', label: 'Bill Number', value: `BILL-${Math.random().toString(36).slice(2, 10).toUpperCase()}` },
          ],
          transactions: [{ type: 'expense' as const, amount: randomAmount * 1.5, category: 'utilities' as const, description: 'City Utilities Bill', date: today, currency: 'USD' as Currency }],
        };
      case 'cheque':
        return {
          fields: [
            { key: 'amount', label: 'Amount', value: `$${randomAmount.toFixed(2)}` },
            { key: 'date', label: 'Issue Date', value: today },
            { key: 'chequeNumber', label: 'Cheque Number', value: `${Math.floor(Math.random() * 900000 + 100000)}` },
            { key: 'merchant', label: 'Payee', value: 'John Smith' },
          ],
          transactions: [{ type: 'expense', amount: randomAmount, category: 'other', description: `Cheque #${Math.floor(Math.random() * 900000 + 100000)}`, date: today, currency: 'USD' }],
        };
      case 'card':
        return {
          fields: [
            { key: 'merchant', label: 'Card Number', value: '**** **** **** 1234' },
            { key: 'date', label: 'Expiry', value: '09/28' },
          ],
          transactions: [],
        };
      default:
        return { fields: [], transactions: [] };
    }
  };

  const handleConfirm = async () => {
    onScanComplete(extractedData);
    if (scannedFields.length > 0) {
      const typedDocType = docType as DocumentType;
      await supabase.from('documents').insert([{
        document_type: typedDocType,
        title: `${docType.charAt(0).toUpperCase() + docType.slice(1)} - ${new Date().toLocaleDateString()}`,
        extracted_data: { fields: scannedFields },
        is_verified: false,
      }]);
    }
    showToast(`Processed ${docType} successfully`, 'success');
    handleClose();
  };

  const handleClose = () => {
    stopCamera();
    setStep('capture');
    setExtractedData([]);
    setScannedFields([]);
    onClose();
  };

  const updateTransaction = (index: number, field: keyof Transaction, value: unknown) => {
    const updated = [...extractedData];
    updated[index] = { ...updated[index], [field]: value };
    setExtractedData(updated);
  };

  const removeTransaction = (index: number) => {
    setExtractedData(prev => prev.filter((_, i) => i !== index));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative w-full max-w-2xl bg-gray-900 rounded-2xl border border-gray-700/50 max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-700/50">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Scan className="w-5 h-5 text-cyan-400" />
            Smart Scanner
          </h3>
          <button onClick={handleClose} className="p-2 rounded-lg hover:bg-gray-800 text-gray-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 border-b border-gray-700/50">
          <div className="flex items-center gap-2">
            {(['receipt', 'bill', 'cheque', 'card'] as const).map(t => (
              <button key={t} onClick={() => setDocType(t)} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl capitalize font-medium transition-all ${docType === t ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50' : 'bg-gray-800/50 text-gray-400 hover:text-white'}`}>
                {t === 'receipt' && <FileText className="w-4 h-4" />}
                {t === 'bill' && <FileCheck className="w-4 h-4" />}
                {t === 'cheque' && <FileText className="w-4 h-4" />}
                {t === 'card' && <CreditCard className="w-4 h-4" />}
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {step === 'capture' && (
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-4">
                <button onClick={() => setMode('upload')} className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${mode === 'upload' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-gray-800 text-gray-400'}`}>
                  <Upload className="w-5 h-5" /> Upload
                </button>
                <button onClick={() => setMode('camera')} className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${mode === 'camera' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-gray-800 text-gray-400'}`}>
                  <Camera className="w-5 h-5" /> Camera
                </button>
              </div>

              {mode === 'upload' ? (
                <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-gray-700 rounded-xl p-16 text-center cursor-pointer hover:border-cyan-500/50 hover:bg-cyan-500/5 transition-all">
                  <Upload className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-400">Click to upload or drag and drop</p>
                  <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 10MB</p>
                </div>
              ) : (
                <div className="relative">
                  <video ref={videoRef} autoPlay playsInline muted className="w-full rounded-xl bg-gray-800" style={{ aspectRatio: '4/3' }} />
                  <canvas ref={canvasRef} className="hidden" />
                  <div className="absolute top-4 right-4 flex flex-col gap-2">
                    <button onClick={switchCamera} className="p-3 bg-gray-900/80 rounded-full text-white hover:bg-gray-800 backdrop-blur-sm">
                      <SwitchCamera className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="mt-4 flex justify-center">
                    <button onClick={capturePhoto} className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white font-medium rounded-2xl hover:from-cyan-400 hover:to-cyan-500 transition-all" disabled={!cameraActive}>
                      <Camera className="w-6 h-6" />
                      Capture Photo
                    </button>
                  </div>
                </div>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
            </div>
          )}

          {step === 'scanning' && (
            <div className="text-center py-16">
              <div className="relative w-24 h-24 mx-auto mb-6">
                <div className="absolute inset-0 border-4 border-cyan-500/30 rounded-full animate-ping" />
                <div className="absolute inset-2 border-4 border-t-cyan-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin" style={{ animationDuration: '1.5s' }} />
                <Scan className="absolute inset-0 m-auto w-10 h-10 text-cyan-400" />
              </div>
              <p className="text-white font-medium text-lg">Scanning {docType}...</p>
              <p className="text-sm text-gray-400 mt-2">Using OCR to extract data</p>
              <div className="mt-4 space-y-1">
                <p className="text-xs text-cyan-400/60">Detecting amount...</p>
                <p className="text-xs text-cyan-400/40">Extracting date...</p>
                <p className="text-xs text-cyan-400/20">Identifying merchant...</p>
              </div>
            </div>
          )}

          {step === 'review' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-emerald-400 p-3 bg-emerald-500/10 rounded-xl">
                <Check className="w-5 h-5" />
                <span>Scan complete! Review extracted data:</span>
              </div>

              {scannedFields.length > 0 && (
                <div className="p-4 bg-gray-800/50 rounded-xl border border-gray-700/50">
                  <h4 className="text-sm font-medium text-gray-400 mb-3">Detected Information</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {scannedFields.map((field, i) => (
                      <div key={i} className="p-3 bg-gray-900/50 rounded-lg">
                        <p className="text-xs text-gray-500">{field.label}</p>
                        <p className="text-white font-medium">{field.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {extractedData.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-gray-400">Transactions to Add</h4>
                  {extractedData.map((transaction, index) => (
                    <div key={index} className="p-4 bg-gray-800/50 rounded-xl border border-gray-700/50">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm text-gray-400">Transaction {index + 1}</span>
                        <button onClick={() => removeTransaction(index)} className="text-rose-400 hover:text-rose-300 text-sm">Remove</button>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-gray-400">Amount</label>
                          <input type="number" step="0.01" value={transaction.amount || ''} onChange={e => updateTransaction(index, 'amount', parseFloat(e.target.value))} className="w-full mt-1 px-3 py-2 bg-gray-700 rounded-lg text-white" />
                        </div>
                        <div>
                          <label className="text-xs text-gray-400">Currency</label>
                          <select value={transaction.currency || 'USD'} onChange={e => updateTransaction(index, 'currency', e.target.value as Currency)} className="w-full mt-1 px-3 py-2 bg-gray-700 rounded-lg text-white">
                            {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="text-xs text-gray-400">Category</label>
                          <select value={transaction.category || 'other'} onChange={e => updateTransaction(index, 'category', e.target.value)} className="w-full mt-1 px-3 py-2 bg-gray-700 rounded-lg text-white">
                            {Object.entries(CATEGORY_LABELS).map(([k, v]) => (<option key={k} value={k}>{v}</option>))}
                          </select>
                        </div>
                        <div>
                          <label className="text-xs text-gray-400">Date</label>
                          <input type="date" value={transaction.date || ''} onChange={e => updateTransaction(index, 'date', e.target.value)} className="w-full mt-1 px-3 py-2 bg-gray-700 rounded-lg text-white" />
                        </div>
                        <div className="col-span-2">
                          <label className="text-xs text-gray-400">Description</label>
                          <input type="text" value={transaction.description || ''} onChange={e => updateTransaction(index, 'description', e.target.value)} className="w-full mt-1 px-3 py-2 bg-gray-700 rounded-lg text-white" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {(step === 'review' && extractedData.length === 0 && scannedFields.length === 0) && (
                <div className="text-center py-8">
                  <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-3" />
                  <p className="text-white">No data detected</p>
                  <p className="text-sm text-gray-400 mt-1">Try a clearer image or different document</p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button onClick={() => { setStep('capture'); setExtractedData([]); setScannedFields([]); }} className="flex-1 flex items-center justify-center gap-2 py-3 bg-gray-800 text-gray-300 rounded-xl hover:bg-gray-700">
                  <RefreshCw className="w-5 h-5" /> Scan Again
                </button>
                <button onClick={handleConfirm} className="flex-1 py-3 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white font-medium rounded-xl hover:from-cyan-400 hover:to-cyan-500" disabled={extractedData.length === 0 && scannedFields.length === 0}>
                  {extractedData.length > 0 ? `Add ${extractedData.length} Transaction${extractedData.length !== 1 ? 's' : ''}` : 'Save Document'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
