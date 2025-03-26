import React, { useState, useRef } from 'react';
import { useTaxOrganizer } from '../context/TaxOrganizerContext';
import Layout from '../components/layout/Layout';
import AnimatedCard from '../components/ui/AnimatedCard';
import { Pencil, XCircle, Save, SkipForward, Check } from 'lucide-react';

const DocumentHighlight: React.FC = () => {
  const { state, dispatch } = useTaxOrganizer();
  const [activeDocument, setActiveDocument] = useState(state.documents[0]?.id || null);
  const [isHighlighting, setIsHighlighting] = useState(false);
  const [highlightLabel, setHighlightLabel] = useState('');
  const [startPoint, setStartPoint] = useState({ x: 0, y: 0 });
  const [currentPoint, setCurrentPoint] = useState({ x: 0, y: 0 });
  const documentRef = useRef<HTMLDivElement>(null);

  const HIGHLIGHT_COLORS = [
    '#FF6370', // red
    '#FFCE73', // yellow
    '#44C4A1', // green
    '#1A85FF', // blue
    '#6C5DD3', // purple
  ];

  const handleDocumentClick = (documentId: string) => {
    setActiveDocument(documentId);
  };

  const startHighlighting = () => {
    setIsHighlighting(true);
  };

  const cancelHighlighting = () => {
    setIsHighlighting(false);
    setHighlightLabel('');
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isHighlighting || !documentRef.current) return;
    
    const rect = documentRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setStartPoint({ x, y });
    setCurrentPoint({ x, y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isHighlighting || !documentRef.current) return;
    
    const rect = documentRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setCurrentPoint({ x, y });
  };

  const handleMouseUp = () => {
    if (!isHighlighting || !documentRef.current) return;
    
    if (Math.abs(currentPoint.x - startPoint.x) > 20 && Math.abs(currentPoint.y - startPoint.y) > 20) {
      // Show label dialog
      document.getElementById('highlight-label-dialog')?.focus();
    }
  };

  const saveHighlight = () => {
    if (!activeDocument || !highlightLabel) return;
    
    const x = Math.min(startPoint.x, currentPoint.x);
    const y = Math.min(startPoint.y, currentPoint.y);
    const width = Math.abs(currentPoint.x - startPoint.x);
    const height = Math.abs(currentPoint.y - startPoint.y);
    
    // Choose a random color
    const color = HIGHLIGHT_COLORS[Math.floor(Math.random() * HIGHLIGHT_COLORS.length)];
    
    const highlight = {
      id: `highlight-${Date.now()}`,
      documentId: activeDocument,
      x,
      y,
      width,
      height,
      label: highlightLabel,
      color
    };
    
    dispatch({ type: 'ADD_HIGHLIGHT', payload: highlight });
    
    setIsHighlighting(false);
    setHighlightLabel('');
  };

  const removeHighlight = (id: string) => {
    dispatch({ type: 'REMOVE_HIGHLIGHT', payload: id });
  };

  const getHighlightsForActiveDocument = () => {
    return state.highlights.filter(h => h.documentId === activeDocument);
  };

  return (
    <Layout 
      nextButtonText={state.highlights.length > 0 ? "Continue" : "Skip this step"}
    >
      <div className="max-w-5xl mx-auto">
        <AnimatedCard delay={100} className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <h1 className="text-2xl font-bold text-gray-800">Highlight Important Information</h1>
            <div className="rounded-full px-3 py-1 bg-gray-100 text-gray-500 text-xs">
              Optional
            </div>
          </div>
          <p className="text-gray-600">
            If you'd like, you can highlight additional information on your documents that might be important for your taxes.
          </p>
        </AnimatedCard>
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-3">
            <AnimatedCard delay={200}>
              <h2 className="text-lg font-medium mb-4">Your Documents</h2>
              
              <div className="space-y-2">
                {state.documents.map((doc) => (
                  <div 
                    key={doc.id}
                    onClick={() => handleDocumentClick(doc.id)}
                    className={`p-3 rounded-lg cursor-pointer border transition-all ${
                      activeDocument === doc.id 
                        ? 'border-tax-blue bg-tax-lightBlue' 
                        : 'border-gray-200 bg-white hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="bg-white p-2 rounded-md shadow-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-file-text text-gray-400"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><line x1="10" x2="8" y1="9" y2="9"/></svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{doc.name}</p>
                        <div className="flex items-center space-x-1 mt-1">
                          {doc.status === 'processed' && (
                            <div className="flex items-center text-xs text-green-600">
                              <Check size={12} className="mr-1" />
                              Processed
                            </div>
                          )}
                          <span className="text-xs text-gray-500">
                            {state.highlights.filter(h => h.documentId === doc.id).length} highlights
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6">
                <h3 className="text-sm font-medium mb-2">Tools</h3>
                <button
                  onClick={startHighlighting}
                  disabled={!activeDocument || isHighlighting}
                  className={`w-full flex items-center justify-center space-x-2 p-3 rounded-lg border transition-all ${
                    isHighlighting 
                      ? 'bg-tax-blue text-white border-tax-blue' 
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <Pencil size={16} />
                  <span>Highlight Area</span>
                </button>
                
                {isHighlighting && (
                  <button
                    onClick={cancelHighlighting}
                    className="w-full mt-2 flex items-center justify-center space-x-2 p-3 rounded-lg border border-red-300 text-red-500 hover:bg-red-50 transition-all"
                  >
                    <XCircle size={16} />
                    <span>Cancel</span>
                  </button>
                )}
              </div>
            </AnimatedCard>
          </div>
          
          <div className="md:col-span-9">
            <AnimatedCard delay={300} className="relative">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium">Document Viewer</h2>
                <div className="text-sm text-gray-500">
                  {isHighlighting 
                    ? 'Click and drag to highlight an area' 
                    : 'Select "Highlight Area" to mark important information'}
                </div>
              </div>
              
              {activeDocument ? (
                <div 
                  ref={documentRef}
                  className={`relative bg-gray-100 rounded-lg min-h-[500px] ${isHighlighting ? 'highlight-area' : ''}`}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                >
                  {state.documents.find(d => d.id === activeDocument)?.previewUrl && (
                    <img 
                      src={state.documents.find(d => d.id === activeDocument)?.previewUrl} 
                      alt="Document preview" 
                      className="w-full rounded-lg"
                    />
                  )}
                  
                  {/* Render existing highlights */}
                  {getHighlightsForActiveDocument().map(highlight => (
                    <div 
                      key={highlight.id}
                      className="absolute border-2 rounded-md bg-opacity-20 flex flex-col justify-end"
                      style={{
                        top: highlight.y,
                        left: highlight.x,
                        width: highlight.width,
                        height: highlight.height,
                        borderColor: highlight.color,
                        backgroundColor: highlight.color + '33', // Add transparency
                      }}
                    >
                      <div 
                        className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2 bg-white rounded-full p-1 cursor-pointer shadow-sm"
                        onClick={() => removeHighlight(highlight.id)}
                      >
                        <XCircle size={16} className="text-red-500" />
                      </div>
                      <div 
                        className="px-2 py-1 text-xs font-medium truncate"
                        style={{
                          backgroundColor: highlight.color,
                          color: 'white',
                          borderRadius: '0 0 4px 4px'
                        }}
                      >
                        {highlight.label}
                      </div>
                    </div>
                  ))}
                  
                  {/* Current highlight being drawn */}
                  {isHighlighting && startPoint.x !== currentPoint.x && startPoint.y !== currentPoint.y && (
                    <div 
                      className="absolute border-2 border-tax-blue bg-tax-blue bg-opacity-10"
                      style={{
                        top: Math.min(startPoint.y, currentPoint.y),
                        left: Math.min(startPoint.x, currentPoint.x),
                        width: Math.abs(currentPoint.x - startPoint.x),
                        height: Math.abs(currentPoint.y - startPoint.y),
                      }}
                    />
                  )}
                </div>
              ) : (
                <div className="bg-gray-100 rounded-lg min-h-[500px] flex items-center justify-center">
                  <p className="text-gray-500">Select a document to view and highlight</p>
                </div>
              )}
              
              {isHighlighting && startPoint.x !== currentPoint.x && startPoint.y !== currentPoint.y && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
                  <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
                    <h3 className="text-lg font-medium mb-4">Label this highlight</h3>
                    <input
                      id="highlight-label-dialog"
                      type="text"
                      value={highlightLabel}
                      onChange={(e) => setHighlightLabel(e.target.value)}
                      placeholder="e.g., Mortgage Interest, Charitable Donation, etc."
                      className="w-full border border-gray-300 rounded-lg p-3 mb-4"
                      autoFocus
                    />
                    <div className="flex justify-end space-x-3">
                      <button
                        onClick={cancelHighlighting}
                        className="px-4 py-2 text-gray-600 hover:text-gray-800"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={saveHighlight}
                        disabled={!highlightLabel}
                        className="px-4 py-2 bg-tax-blue text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        <Save size={16} />
                        Save
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </AnimatedCard>
            
            {state.highlights.length > 0 && (
              <AnimatedCard delay={400} className="mt-6">
                <h2 className="text-lg font-medium mb-4">Highlights Summary</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {state.highlights.map(highlight => {
                    const doc = state.documents.find(d => d.id === highlight.documentId);
                    return (
                      <div 
                        key={highlight.id}
                        className="border rounded-lg p-3 hover:shadow-md transition-all"
                        style={{ borderLeftColor: highlight.color, borderLeftWidth: '4px' }}
                      >
                        <p className="font-medium text-sm">{highlight.label}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          From: {doc?.name || 'Unknown document'}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </AnimatedCard>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default DocumentHighlight;
