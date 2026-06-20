import React, { useState, useRef } from 'react';
import { X, Camera, Upload, Scan, Check, AlertTriangle, FileText } from 'lucide-react';
import { Transaction, CATEGORY_LABELS, CURRENCIES, CURRENCY_SYMBOLS, Currency } from '../types';
import { useToast } from '../context/ToastContext';

interface ReceiptScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScanComplete: (transactions: Partial<Transaction>[]) => void;
}

export function ReceiptScanner({ isOpen, onClose, onScanComplete }: ReceiptScannerProps) {
  const [step, setStep] = useState<'upload' | 'scanning' | 'review'>('upload');
  const [extractedData, setExtractedData] = useState<Partial<Transaction>[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  if (!isOpen) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select an image file', 'error');
      return;
    }

    setStep('scanning');

    // Simulate receipt scanning with OCR
    // In production, you would use a real OCR service like Google Vision API, AWS Textract, or Tesseract.js
    setTimeout(() => {
      const simulatedData: Partial<Transaction>[] = [
        {
          type: 'expense',
          amount: Math.round((Math.random() * 100 + 10) * 100) / 100,
          category: 'food',
          description: 'Grocery Store Purchase',
          date: new Date().toISOString().split('T')[0],
          currency: 'USD',
        },
        {
          type: 'expense',
          amount: Math.round((Math.random() * 50 + 5) * 100) / 100,
          category: 'shopping',
          description: 'Retail Store Item',
          date: new Date().toISOString().split('T')[0],
          currency: 'USD',
        },
      ];
      setExtractedData(simulatedData);
      setStep('review');
    }, 2000);
  };

  const handleConfirm = () => {
    onScanComplete(extractedData);
    showToast(`Added ${extractedData.length} transaction${extractedData.length !== 1 ? 's' : ''}`, 'success');
    handleClose();
  };

  const handleClose = () => {
    setStep('upload');
    setExtractedData([]);
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative w-full max-w-2xl bg-gray-900 rounded-2xl border border-gray-700/50 p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-cyan-400" />
            Receipt Scanner
          </h3>
          <button onClick={handleClose} className="p-2 rounded-lg hover:bg-gray-800 text-gray-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {step === 'upload' && (
          <div className="space-y-6">
            <p className="text-gray-400 text-sm">Upload a receipt image to automatically extract transaction details.</p>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-700 rounded-xl p-12 text-center cursor-pointer hover:border-cyan-500/50 hover:bg-cyan-500/5 transition-all"
            >
              <Upload className="w-12 h-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400">Click to upload or drag and drop</p>
              <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 10MB</p>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
          </div>
        )}

        {step === 'scanning' && (
          <div className="text-center py-16">
            <div className="relative w-20 h-20 mx-auto mb-4">
              <div className="absolute inset-0 border-4 border-cyan-500/30 rounded-full animate-ping" />
              <div className="absolute inset-2 border-4 border-cyan-500 rounded-full animate-spin" style={{ animationDuration: '2s' }} />
              <Scan className="absolute inset-0 m-auto w-8 h-8 text-cyan-400" />
            </div>
            <p className="text-white font-medium">Scanning receipt...</p>
            <p className="text-sm text-gray-400 mt-1">Extracting transaction details</p>
          </div>
        )}

        {step === 'review' && extractedData.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center gap-2 text-emerald-400">
              <Check className="w-5 h-5" />
              <span>Scan complete! Review extracted transactions:</span>
            </div>

            <div className="space-y-3">
              {extractedData.map((transaction, index) => (
                <div key={index} className="p-4 bg-gray-800/50 rounded-xl border border-gray-700/50">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-gray-400">Transaction {index + 1}</span>
                    <button onClick={() => removeTransaction(index)} className="text-rose-400 hover:text-rose-300 text-sm">
                      Remove
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-400">Amount</label>
                      <input
                        type="number"
                        step="0.01"
                        value={transaction.amount || ''}
                        onChange={e => updateTransaction(index, 'amount', parseFloat(e.target.value))}
                        className="w-full mt-1 px-3 py-2 bg-gray-700 rounded-lg text-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400">Currency</label>
                      <select
                        value={transaction.currency || 'USD'}
                        onChange={e => updateTransaction(index, 'currency', e.target.value)}
                        className="w-full mt-1 px-3 py-2 bg-gray-700 rounded-lg text-white"
                      >
                        {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-gray-400">Category</label>
                      <select
                        value={transaction.category || 'other'}
                        onChange={e => updateTransaction(index, 'category', e.target.value)}
                        className="w-full mt-1 px-3 py-2 bg-gray-700 rounded-lg text-white"
                      >
                        {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                          <option key={k} value={k}>{v}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-gray-400">Date</label>
                      <input
                        type="date"
                        value={transaction.date || ''}
                        onChange={e => updateTransaction(index, 'date', e.target.value)}
                        className="w-full mt-1 px-3 py-2 bg-gray-700 rounded-lg text-white"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="text-xs text-gray-400">Description</label>
                      <input
                        type="text"
                        value={transaction.description || ''}
                        onChange={e => updateTransaction(index, 'description', e.target.value)}
                        className="w-full mt-1 px-3 py-2 bg-gray-700 rounded-lg text-white"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button onClick={handleClose} className="flex-1 py-2.5 bg-gray-800 text-gray-300 rounded-xl hover:bg-gray-700">
                Cancel
              </button>
              <button onClick={handleConfirm} className="flex-1 py-2.5 bg-cyan-500 text-white rounded-xl hover:bg-cyan-600">
                Add {extractedData.length} Transaction{extractedData.length !== 1 ? 's' : ''}
              </button>
            </div>
          </div>
        )}

        {step === 'review' && extractedData.length === 0 && (
          <div className="text-center py-12">
            <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-3" />
            <p className="text-white">No transactions detected</p>
            <p className="text-sm text-gray-400 mt-1">Try uploading a clearer receipt image</p>
            <button onClick={() => setStep('upload')} className="mt-4 px-4 py-2 bg-gray-800 text-gray-300 rounded-xl hover:bg-gray-700">
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
