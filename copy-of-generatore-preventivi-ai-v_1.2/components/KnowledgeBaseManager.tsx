import React, { useRef } from 'react';
import { IndexingStatus, type StoredFile } from '../types';
import { UploadIcon } from './icons/UploadIcon';
import { FileIcon } from './icons/FileIcon';
import { SpinnerIcon } from './icons/SpinnerIcon';
import { CheckIcon } from './icons/CheckIcon';
import { TrashIcon } from './icons/TrashIcon';
import { XIcon } from './icons/XIcon';

interface KnowledgeBaseManagerProps {
  knowledgeFiles: StoredFile[];
  onFilesChange: (files: FileList | null) => void;
  onRemoveFile: (fileName: string) => void;
  onIndex: () => void;
  onClear: () => void;
  indexingStatus: IndexingStatus;
}

export const KnowledgeBaseManager: React.FC<KnowledgeBaseManagerProps> = ({
  knowledgeFiles,
  onFilesChange,
  onRemoveFile,
  onIndex,
  onClear,
  indexingStatus,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isIndexing = indexingStatus === IndexingStatus.INDEXING;
  const isIndexed = indexingStatus === IndexingStatus.INDEXED;

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };
  
  const hasFiles = knowledgeFiles.length > 0;
  const showClearButton = isIndexed || knowledgeFiles.some(f => !f.isDefault);

  return (
    <div className="flex flex-col h-full">
      <h2 className="text-lg font-semibold text-slate-200 mb-1">Base di Conoscenza</h2>
      <p className="text-sm text-slate-400 mb-4">
        Rimuovi o aggiungi file (.txt, .csv, .md, .json) per costruire la base di conoscenza.
      </p>

      <div className="flex-1 overflow-y-auto pr-2 -mr-2 mb-4 space-y-2">
         {knowledgeFiles.map((file, index) => (
          <div key={`${file.name}-${index}`} className="bg-slate-700/50 p-2 rounded-md flex items-center justify-between gap-3 group">
            <div className="flex items-center gap-3 overflow-hidden">
               <FileIcon className={`w-5 h-5 flex-shrink-0 ${file.isDefault ? 'text-cyan-400' : 'text-teal-400'}`} />
               <span className="text-sm text-slate-300 truncate" title={file.name}>{file.name}</span>
            </div>
            <button 
              onClick={() => onRemoveFile(file.name)}
              className="text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0 flex-shrink-0"
              aria-label={`Rimuovi ${file.name}`}
              disabled={isIndexing}
            >
              <XIcon className="w-4 h-4" />
            </button>
          </div>
        ))}
        {knowledgeFiles.length === 0 && (
          <div className="text-center text-slate-500 py-8 border-2 border-dashed border-slate-700 rounded-lg">
              <p className="font-semibold">Base di conoscenza vuota.</p>
              <p className="text-sm">Carica documenti per iniziare.</p>
          </div>
        )}
      </div>
      
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => onFilesChange(e.target.files)}
        multiple
        accept=".txt,.csv,.md,.json"
        className="hidden"
      />

      <div className="mt-auto pt-4 border-t border-slate-700/50">
        <div className="space-y-3">
            <button
            onClick={handleUploadClick}
            className="w-full flex items-center justify-center gap-2 bg-slate-600 hover:bg-slate-500 text-slate-200 font-semibold py-2 px-4 rounded-md transition-colors duration-200 disabled:opacity-50"
            disabled={isIndexing}
            >
            <UploadIcon className="w-5 h-5" />
            Carica Documenti
            </button>

            <button
            onClick={onIndex}
            disabled={!hasFiles || isIndexing || isIndexed}
            className={`w-full flex items-center justify-center gap-2 text-white font-bold py-2 px-4 rounded-md transition-all duration-200 
                ${isIndexed ? 'bg-green-600 cursor-default' : ''}
                ${!isIndexed && !isIndexing ? 'bg-cyan-600 hover:bg-cyan-500' : ''}
                ${isIndexing ? 'bg-cyan-700 cursor-wait' : ''}
                ${!hasFiles ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : ''}
            `}
            >
            {isIndexing && <SpinnerIcon className="w-5 h-5 animate-spin" />}
            {isIndexed && <CheckIcon className="w-5 h-5" />}
            {isIndexing ? 'Indicizzando...' : (isIndexed ? 'Indicizzato' : 'Indicizza Base di Conoscenza')}
            </button>
        </div>

        {showClearButton && (
            <div className="text-center mt-3">
                <button
                onClick={onClear}
                disabled={isIndexing}
                className="text-xs text-slate-400 hover:text-red-400 disabled:text-slate-600 disabled:cursor-not-allowed transition-colors flex items-center gap-1 mx-auto"
                aria-label="Svuota e ricomincia"
                >
                <TrashIcon className="w-3 h-3" />
                <span>Svuota e ricomincia</span>
                </button>
            </div>
        )}
      </div>
    </div>
  );
};
