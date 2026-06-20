import React, { useState, useEffect } from 'react';
import { Plus, X, FileText, Trash2, Eye, Upload, Search, Filter, Download, CheckCircle, AlertTriangle, Clock, FileImage, File, FileSpreadsheet } from 'lucide-react';
import { Document, DOCUMENT_TYPES, DocumentType } from '../types';
import { supabase } from '../lib/supabase';
import { useToast } from '../context/ToastContext';

export function DocumentCenter() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<DocumentType | 'all'>('all');
  const [filterVerified, setFilterVerified] = useState<'all' | 'verified' | 'unverified'>('all');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [viewingDoc, setViewingDoc] = useState<Document | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    const { data } = await supabase.from('documents').select('*').order('created_at', { ascending: false });
    if (data) setDocuments(data as Document[]);
  };

  const handleUpload = async (files: FileList) => {
    const file = files[0];
    if (!file) return;

    // Simulate file upload and OCR extraction
    const extractedData = {
      detected_type: file.name.toLowerCase().includes('receipt') ? 'receipt' : file.name.toLowerCase().includes('bill') ? 'bill' : '',
    };

    const docData = {
      document_type: file.name.toLowerCase().includes('receipt') ? 'receipt' : file.name.toLowerCase().includes('bill') ? 'bill' : 'other',
      title: file.name,
      file_name: file.name,
      file_size: file.size,
      mime_type: file.type,
      extracted_data: extractedData,
      is_verified: false,
    };

    const { error } = await supabase.from('documents').insert([docData]);
    if (error) {
      showToast('Failed to upload document', 'error');
    } else {
      showToast('Document uploaded', 'success');
      fetchDocuments();
    }
    setIsUploadOpen(false);
  };

  const handleDelete = async (id: string) => {
    await supabase.from('documents').delete().eq('id', id);
    showToast('Document deleted', 'success');
    fetchDocuments();
  };

  const handleVerify = async (doc: Document) => {
    await supabase.from('documents').update({ is_verified: !doc.is_verified, verification_notes: !doc.is_verified ? 'Verified by user' : null }).eq('id', doc.id);
    showToast(doc.is_verified ? 'Unverified' : 'Verified', 'success');
    fetchDocuments();
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = !searchQuery || doc.title?.toLowerCase().includes(searchQuery.toLowerCase()) || doc.file_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || doc.document_type === filterType;
    const matchesVerified = filterVerified === 'all' || (filterVerified === 'verified' && doc.is_verified) || (filterVerified === 'unverified' && !doc.is_verified);
    return matchesSearch && matchesType && matchesVerified;
  });

  const getDocIcon = (type: DocumentType) => {
    switch (type) {
      case 'receipt': return FileImage;
      case 'bill': return FileText;
      case 'invoice': return FileSpreadsheet;
      default: return File;
    }
  };

  const typeColors: Record<DocumentType, string> = {
    receipt: 'bg-emerald-500/20 text-emerald-400',
    bill: 'bg-amber-500/20 text-amber-400',
    cheque: 'bg-cyan-500/20 text-cyan-400',
    invoice: 'bg-purple-500/20 text-purple-400',
    statement: 'bg-blue-500/20 text-blue-400',
    other: 'bg-gray-500/20 text-gray-400',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Document Center</h2>
          <p className="text-sm text-gray-400">Store and manage your financial documents</p>
        </div>
        <button onClick={() => setIsUploadOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-white font-medium rounded-xl transition-all">
          <Upload className="w-5 h-5" />
          Upload
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search documents..." className="w-full pl-10 pr-4 py-2 bg-gray-800/50 border border-gray-700/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50" />
        </div>
        <select value={filterType} onChange={e => setFilterType(e.target.value as DocumentType | 'all')} className="px-4 py-2 bg-gray-800/50 border border-gray-700/50 rounded-xl text-white focus:outline-none focus:border-cyan-500/50">
          <option value="all">All Types</option>
          {DOCUMENT_TYPES.map(dt => <option key={dt.value} value={dt.value}>{dt.label}</option>)}
        </select>
        <select value={filterVerified} onChange={e => setFilterVerified(e.target.value as 'all' | 'verified' | 'unverified')} className="px-4 py-2 bg-gray-800/50 border border-gray-700/50 rounded-xl text-white focus:outline-none focus:border-cyan-500/50">
          <option value="all">All Status</option>
          <option value="verified">Verified</option>
          <option value="unverified">Unverified</option>
        </select>
      </div>

      {filteredDocuments.length === 0 ? (
        <div className="text-center py-12 bg-gray-800/30 rounded-2xl border border-gray-700/50">
          <FileText className="w-12 h-12 text-gray-500 mx-auto mb-3" />
          <p className="text-gray-400">No documents found</p>
          <p className="text-sm text-gray-500 mt-1">Upload receipts, bills, and other documents</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredDocuments.map(doc => {
            const Icon = getDocIcon(doc.document_type);
            return (
              <div key={doc.id} className="p-4 bg-gray-800/30 rounded-xl border border-gray-700/50 hover:bg-gray-800/50 transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div className={`p-2 rounded-lg ${typeColors[doc.document_type]}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex items-center gap-1">
                    {doc.is_verified ? (
                      <span className="flex items-center gap-1 px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded text-xs">
                        <CheckCircle className="w-3 h-3" /> Verified
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 px-2 py-1 bg-amber-500/20 text-amber-400 rounded text-xs">
                        <Clock className="w-3 h-3" /> Pending
                      </span>
                    )}
                  </div>
                </div>
                <h3 className="font-medium text-white mb-1 truncate">{doc.title || doc.file_name}</h3>
                <p className="text-xs text-gray-400 mb-3">{new Date(doc.created_at).toLocaleDateString()}</p>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 bg-gray-700/50 rounded text-xs text-gray-300 capitalize">{doc.document_type}</span>
                  {doc.file_size && <span className="text-xs text-gray-500">{(doc.file_size / 1024).toFixed(1)} KB</span>}
                </div>
                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-700/50">
                  <button onClick={() => setViewingDoc(doc)} className="flex-1 flex items-center justify-center gap-2 py-2 bg-gray-700/50 hover:bg-gray-700 text-gray-300 rounded-lg text-sm">
                    <Eye className="w-4 h-4" /> View
                  </button>
                  <button onClick={() => handleVerify(doc)} className="p-2 rounded-lg hover:bg-gray-700/50 text-gray-400 hover:text-cyan-400">
                    {doc.is_verified ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                  </button>
                  <button onClick={() => handleDelete(doc.id)} className="p-2 rounded-lg hover:bg-rose-500/20 text-gray-400 hover:text-rose-400">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Modal */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsUploadOpen(false)} />
          <div className="relative w-full max-w-md bg-gray-900 rounded-2xl border border-gray-700/50 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Upload Document</h3>
              <button onClick={() => setIsUploadOpen(false)} className="p-2 rounded-lg hover:bg-gray-800 text-gray-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div
              className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all ${dragActive ? 'border-cyan-500 bg-cyan-500/5' : 'border-gray-700 hover:border-cyan-500/50'}`}
              onDragOver={e => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={() => setDragActive(false)}
              onDrop={e => { e.preventDefault(); setDragActive(false); if (e.dataTransfer.files) handleUpload(e.dataTransfer.files); }}
              onClick={() => document.getElementById('file-input')?.click()}
            >
              <Upload className="w-12 h-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400">Drag & drop or click to upload</p>
              <p className="text-xs text-gray-500 mt-1">PDF, Image, or scanned document</p>
            </div>
            <input id="file-input" type="file" accept="image/*,.pdf" className="hidden" onChange={e => { if (e.target.files) handleUpload(e.target.files); }} />
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setViewingDoc(null)} />
          <div className="relative w-full max-w-2xl bg-gray-900 rounded-2xl border border-gray-700/50 p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">{viewingDoc.title || viewingDoc.file_name}</h3>
              <button onClick={() => setViewingDoc(null)} className="p-2 rounded-lg hover:bg-gray-800 text-gray-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <span className={`px-3 py-1 rounded ${typeColors[viewingDoc.document_type]}`}>{viewingDoc.document_type}</span>
                {viewingDoc.is_verified ? (
                  <span className="flex items-center gap-1 text-emerald-400 text-sm"><CheckCircle className="w-4 h-4" /> Verified</span>
                ) : (
                  <span className="flex items-center gap-1 text-amber-400 text-sm"><Clock className="w-4 h-4" /> Pending Verification</span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-gray-400">File Name:</span> <span className="text-white">{viewingDoc.file_name}</span></div>
                <div><span className="text-gray-400">Size:</span> <span className="text-white">{viewingDoc.file_size ? `${(viewingDoc.file_size / 1024).toFixed(1)} KB` : 'N/A'}</span></div>
                <div><span className="text-gray-400">Type:</span> <span className="text-white">{viewingDoc.mime_type || 'Unknown'}</span></div>
                <div><span className="text-gray-400">Uploaded:</span> <span className="text-white">{new Date(viewingDoc.created_at).toLocaleString()}</span></div>
              </div>
              {viewingDoc.extracted_data && (
                <div className="p-4 bg-gray-800/50 rounded-xl">
                  <h4 className="text-sm font-medium text-gray-400 mb-2">Extracted Data</h4>
                  <pre className="text-xs text-gray-300">{JSON.stringify(viewingDoc.extracted_data, null, 2)}</pre>
                </div>
              )}
              <div className="flex gap-3">
                <button onClick={() => handleVerify(viewingDoc)} className="flex-1 py-2 bg-cyan-500/20 text-cyan-400 rounded-xl hover:bg-cyan-500/30">
                  {viewingDoc.is_verified ? 'Unverify' : 'Verify'}
                </button>
                <button onClick={() => handleDelete(viewingDoc.id)} className="flex-1 py-2 bg-rose-500/20 text-rose-400 rounded-xl hover:bg-rose-500/30">
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
