import './Toolbar.css'

const tools = [
  {
    id: 'select',
    label: 'Select',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M3 2l4.5 13 2.5-4.5L15 8 3 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      </svg>
    )
  },
  {
    id: 'text',
    label: 'Text',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M3 4h12M9 4v10M6 14h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    )
  },
  {
    id: 'signature',
    label: 'Signature',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M2 13c2-4 3-7 5-7s1 4 3 4 2-2 3-2 2 1 3 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    )
  },
]

export default function Toolbar({ activeTool, onToolSelect, onSave, isSaving, onNewFile, fileName }) {
  return (
    <div className="toolbar">
      <div className="toolbar-left">
        <div className="toolbar-logo">
          <svg width="24" height="24" viewBox="0 0 40 40" fill="none">
            <rect width="40" height="40" rx="10" fill="#3B82F6"/>
            <path d="M12 10h10l8 8v16a2 2 0 01-2 2H12a2 2 0 01-2-2V12a2 2 0 012-2z" fill="white" fillOpacity="0.9"/>
            <path d="M22 10l8 8h-6a2 2 0 01-2-2v-6z" fill="white" fillOpacity="0.5"/>
          </svg>
        </div>
        <span className="toolbar-filename" title={fileName}>{fileName}</span>
      </div>

      <div className="toolbar-tools">
        {tools.map(tool => (
          <button
            key={tool.id}
            className={`tool-btn ${activeTool === tool.id || (activeTool === 'signature-place' && tool.id === 'signature') ? 'active' : ''}`}
            onClick={() => onToolSelect(tool.id)}
            title={tool.label}
          >
            {tool.icon}
            <span>{tool.label}</span>
          </button>
        ))}
      </div>

      <div className="toolbar-right">
        <button className="btn-secondary" onClick={onNewFile}>
          Open New
        </button>
        <button className="btn-primary" onClick={onSave} disabled={isSaving}>
          {isSaving ? (
            <>
              <svg className="spin" width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" strokeDasharray="20" strokeDashoffset="5"/>
              </svg>
              Saving…
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 12l2-2h6l2 2M8 3v7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <rect x="1" y="1" width="14" height="14" rx="3" stroke="currentColor" strokeWidth="1.5"/>
              </svg>
              Save PDF
            </>
          )}
        </button>
      </div>
    </div>
  )
}
