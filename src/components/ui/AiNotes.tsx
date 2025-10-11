import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNotes } from '@/hooks/useNotes';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronDown, ChevronRight, Loader2, Pin, PinOff, Save, Wand2 } from 'lucide-react';
import DOMPurify from 'dompurify';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

interface AiNotesProps {
  tableKey: string; // unique key per table (e.g., 'sessions:advancedAttendance')
  location?: string; // current selected location
  period?: string;   // e.g., '2025-10' or custom range id
  sectionId?: string; // DOM id of the table section
  initialSummary?: string; // optional generated summary
  author?: string; // optional author name/email
}

export const AiNotes: React.FC<AiNotesProps> = ({ tableKey, location, period, sectionId, initialSummary, author }) => {
  const { notes, loading, error, save } = useNotes({ tableKey, location, period, sectionId });
  const latest = useMemo(() => notes[notes.length - 1], [notes]);

  // Contenteditable for rich text (HTML)
  const summaryRef = useRef<ReactQuill | null>(null);
  const noteRef = useRef<ReactQuill | null>(null);
  const [summaryHtml, setSummaryHtml] = useState(initialSummary || '');
  const [noteHtml, setNoteHtml] = useState('');
  // Per-section pins and toggles
  const storageKeySummary = useMemo(() => `ai-notes-pin:summary:${tableKey}:${location || 'all'}:${period || 'all'}:${sectionId || 'default'}`, [tableKey, location, period, sectionId]);
  const storageKeyNotes = useMemo(() => `ai-notes-pin:notes:${tableKey}:${location || 'all'}:${period || 'all'}:${sectionId || 'default'}`, [tableKey, location, period, sectionId]);
  const [summaryPinned, setSummaryPinned] = useState<boolean>(() => { try { return localStorage.getItem(storageKeySummary) === '1'; } catch { return false; } });
  const [notesPinned, setNotesPinned] = useState<boolean>(() => { try { return localStorage.getItem(storageKeyNotes) === '1'; } catch { return false; } });
  const [summaryOpen, setSummaryOpen] = useState<boolean>(() => summaryPinned || false);
  const [notesOpen, setNotesOpen] = useState<boolean>(() => notesPinned || false);

  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, 4, 5, 6, false] }],
      [{ font: [] }],
      [{ size: ['small', false, 'large', 'huge'] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ color: [] }, { background: [] }],
      [{ script: 'sub' }, { script: 'super' }],
      [{ list: 'ordered' }, { list: 'bullet' }],
      [{ indent: '-1' }, { indent: '+1' }],
      [{ align: [] }],
      ['blockquote', 'code-block'],
      ['link', 'image'],
      ['clean']
    ]
  } as const;
  const formats = ['header','font','size','bold','italic','underline','strike','color','background','script','list','indent','align','blockquote','code-block','link','image'];

  // Auto-formatter: convert plain text into structured HTML (bold, lists, tables)
  const autoFormatToHtml = (text: string) => {
    if (!text) return '';
    const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const lines = text.replace(/\r\n?/g, '\n').split('\n');
    const out: string[] = [];

    // Detect Markdown-style table (pipes) or tab-delimited blocks
    const isPipeRow = (s: string) => /\|/.test(s);
    const isTabRow = (s: string) => /\t/.test(s);
    const tryConsumeTable = (i: number) => {
      const start = i;
      const mode: 'pipe' | 'tab' | null = isPipeRow(lines[i]) ? 'pipe' : isTabRow(lines[i]) ? 'tab' : null;
      if (!mode) return { consumed: 0 };
      const rows: string[][] = [];
      let j = i;
      while (j < lines.length) {
        const row = lines[j];
        if ((mode === 'pipe' && isPipeRow(row)) || (mode === 'tab' && isTabRow(row))) {
          const cells = mode === 'pipe'
            ? row.split('|').map(s => s.trim()).filter((_, idx, arr) => !(idx === 0 && arr[0] === '') && !(idx === arr.length - 1 && arr[arr.length - 1] === ''))
            : row.split('\t').map(s => s.trim());
          if (cells.length > 1) rows.push(cells);
          j++;
          continue;
        }
        break;
      }
      if (rows.length >= 2) {
        const header = rows[0];
        const body = rows.slice(1);
        out.push('<table class="ai-table">');
        out.push('<thead><tr>' + header.map(h => `<th>${esc(h)}</th>`).join('') + '</tr></thead>');
        out.push('<tbody>' + body.map(r => '<tr>' + r.map(c => `<td>${esc(c)}</td>`).join('') + '</tr>').join('') + '</tbody>');
        out.push('</table>');
        return { consumed: j - start };
      }
      return { consumed: 0 };
    };

    // Helper to flush a list buffer into UL with image bullets
    const flushList = (buf: string[]) => {
      if (!buf.length) return;
      out.push('<ul class="ai-image-bullets">' + buf.map(li => `<li>${li}</li>`).join('') + '</ul>');
      buf.length = 0;
    };
    let listBuf: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const raw = lines[i].trim();
      if (!raw) { flushList(listBuf); continue; }

      // Try table
      const table = tryConsumeTable(i);
      if (table.consumed) { flushList(listBuf); i += table.consumed - 1; continue; }

      // Bold **text** inline
      const boldProcessed = esc(raw).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

      // Bullet/numbered detection
      if (/^(?:\*|-|\u2022)\s+/.test(raw) || /^\d+[\.)]\s+/.test(raw)) {
        // Strip marker, push as list item
        const li = raw.replace(/^(?:\*|-|\u2022)\s+/, '').replace(/^\d+[\.)]\s+/, '');
        listBuf.push(boldProcessed.replace(/^(?:\*|-|\u2022|\d+[\.)])\s+/, ''));
        continue;
      }

      // Heading heuristic: ALL CAPS line or ends with ':'
      if (raw.endsWith(':') || (raw.length <= 64 && raw === raw.toUpperCase() && /[A-Z]/.test(raw))) {
        flushList(listBuf);
        out.push(`<h3>${boldProcessed.replace(/:$/, '')}</h3>`);
        continue;
      }

      // Paragraph by default
      flushList(listBuf);
      out.push(`<p>${boldProcessed}</p>`);
    }
    flushList(listBuf);
    return out.join('');
  };

  // Attach auto-format paste handler
  useEffect(() => {
    const attach = (rq: ReactQuill | null) => {
      if (!rq) return;
      const quill = (rq as any).getEditor?.();
      if (!quill || !quill.root) return;
      const onPaste = (e: ClipboardEvent) => {
        const dt = e.clipboardData;
        if (!dt) return;
        const html = dt.getData('text/html');
        const text = dt.getData('text/plain');
        // Only intercept plain text (let rich HTML pass through)
        if (text && !html) {
          e.preventDefault();
          const formatted = autoFormatToHtml(text);
          const safe = DOMPurify.sanitize(formatted, { USE_PROFILES: { html: true } });
          const sel = quill.getSelection(true);
          const index = sel ? sel.index : quill.getLength();
          quill.clipboard.dangerouslyPasteHTML(index, safe, 'user');
        }
      };
      quill.root.addEventListener('paste', onPaste);
      return () => quill.root.removeEventListener('paste', onPaste);
    };
    const clean1 = attach(summaryRef.current);
    const clean2 = attach(noteRef.current);
    return () => {
      if (typeof clean1 === 'function') clean1();
      if (typeof clean2 === 'function') clean2();
    };
  }, [summaryRef.current, noteRef.current]);

  const onSave = async () => {
    const rawSummary = summaryHtml;
    const rawNote = noteHtml;
    // sanitize HTML
    const summary = DOMPurify.sanitize(rawSummary, { USE_PROFILES: { html: true } });
    const note = DOMPurify.sanitize(rawNote, { USE_PROFILES: { html: true } });
    await save({ note, summary, author });
    setNoteHtml('');
  };

  const cleanAndBeautify = () => {
    const htmlToText = (html: string) => {
      const el = document.createElement('div');
      el.innerHTML = html || '';
      return el.innerText; // normalize to plain text
    };
    const newSummary = DOMPurify.sanitize(autoFormatToHtml(htmlToText(summaryHtml)), { USE_PROFILES: { html: true } });
    const newNote = DOMPurify.sanitize(autoFormatToHtml(htmlToText(noteHtml)), { USE_PROFILES: { html: true } });
    setSummaryHtml(newSummary);
    setNoteHtml(newNote);
  };

  const [showHistory, setShowHistory] = useState(false);
  const restoreVersion = async (index: number) => {
    const item = notes[index];
    if (!item) return;
    // For updates, we need the row index (row number in sheet). We don't have it yet,
    // so as a simple approach, append a new version using the chosen previous content.
    const restoredSummary = DOMPurify.sanitize(item.summary || '', { USE_PROFILES: { html: true } });
    const restoredNote = DOMPurify.sanitize(item.note || '', { USE_PROFILES: { html: true } });
    await save({ note: restoredNote, summary: restoredSummary, author });
  };

  const toggleSummaryPin = () => {
    const next = !summaryPinned;
    setSummaryPinned(next);
    try { localStorage.setItem(storageKeySummary, next ? '1' : '0'); } catch {}
    if (next) setSummaryOpen(true);
  };
  const toggleNotesPin = () => {
    const next = !notesPinned;
    setNotesPinned(next);
    try { localStorage.setItem(storageKeyNotes, next ? '1' : '0'); } catch {}
    if (next) setNotesOpen(true);
  };

  // Clean & Beautify a single section using Quill conversion
  const cleanAndBeautifySection = (section: 'summary' | 'notes') => {
    const rq = section === 'summary' ? summaryRef.current : noteRef.current;
    if (!rq) return;
    const quill = (rq as any).getEditor?.();
    if (!quill) return;
    // Get plain text from quill to normalize, then re-structure
    const plain = quill.getText();
    const safe = DOMPurify.sanitize(autoFormatToHtml(plain), { USE_PROFILES: { html: true } });
    // Replace entire contents with structured rich content
    quill.setSelection(0, quill.getLength());
    quill.deleteText(0, quill.getLength());
    quill.clipboard.dangerouslyPasteHTML(0, safe, 'user');
    // Sync state to keep React controlled value up-to-date
    const html = (quill.root as HTMLElement).innerHTML;
    if (section === 'summary') setSummaryHtml(html);
    else setNoteHtml(html);
  };

  return (
    <Card className="mt-4 ai-notes">
      <CardHeader className="flex flex-col gap-3">
        <CardTitle className="text-base">AI Summary & Notes</CardTitle>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => setSummaryOpen(v => !v)}>
            {summaryOpen ? <ChevronDown className="mr-2 h-4 w-4" /> : <ChevronRight className="mr-2 h-4 w-4" />} Summary
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={toggleSummaryPin} title={summaryPinned ? 'Unpin Summary' : 'Pin Summary'}>
            {summaryPinned ? <Pin className="h-4 w-4" /> : <PinOff className="h-4 w-4" />}
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => setNotesOpen(v => !v)}>
            {notesOpen ? <ChevronDown className="mr-2 h-4 w-4" /> : <ChevronRight className="mr-2 h-4 w-4" />} Notes
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={toggleNotesPin} title={notesPinned ? 'Unpin Notes' : 'Pin Notes'}>
            {notesPinned ? <Pin className="h-4 w-4" /> : <PinOff className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {latest && (
          <div className="text-sm text-slate-600 ai-notes-render">
            <div className="font-medium">Last saved:</div>
            <div className="whitespace-pre-wrap">
              {latest.summary && (
                <div className="mb-2">
                  <div className="font-semibold">Summary:</div>
                  <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: latest.summary }} />
                </div>
              )}
              {latest.note && (
                <div>
                  <div className="font-semibold">Note:</div>
                  <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: latest.note }} />
                </div>
              )}
            </div>
            <div className="mt-3">
              <Button type="button" variant="outline" size="sm" onClick={() => setShowHistory(s => !s)}>
                {showHistory ? 'Hide history' : 'Show history'} ({notes.length})
              </Button>
            </div>
            {showHistory && (
              <div className="mt-2 space-y-3 max-h-64 overflow-y-auto border-t pt-2">
                {notes.map((n, idx) => (
                  <div key={idx} className="border rounded p-2 bg-white">
                    <div className="text-xs text-slate-500 mb-1">{n.timestamp} • {n.author || 'Unknown'}</div>
                    {n.summary && (
                      <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(n.summary) }} />
                    )}
                    {n.note && (
                      <div className="prose prose-sm max-w-none mt-1" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(n.note) }} />
                    )}
                    <div className="mt-2">
                      <Button type="button" size="sm" variant="secondary" onClick={() => restoreVersion(idx)}>
                        Restore this version
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Summary Section */}
        {summaryOpen && (
          <div className="grid gap-3">
            <div className="text-xs text-slate-500">Summary</div>
            <ReactQuill
              ref={summaryRef as any}
              theme="snow"
              value={summaryHtml}
              onChange={setSummaryHtml}
              modules={modules}
              formats={formats}
              className="bg-white rounded-md"
            />
            <div className="flex items-center gap-2">
              <Button type="button" variant="secondary" onClick={() => cleanAndBeautifySection('summary')} title="Clean & Beautify Summary">
                <Wand2 className="mr-2 h-4 w-4" /> Clean & Beautify
              </Button>
              <Button
                onClick={async () => {
                  const summary = DOMPurify.sanitize(summaryHtml, { USE_PROFILES: { html: true } });
                  const note = DOMPurify.sanitize(noteHtml || latest?.note || '', { USE_PROFILES: { html: true } });
                  await save({ summary, note, author });
                }}
                disabled={loading}
              >
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4"/>}
                Save Summary
              </Button>
            </div>
          </div>
        )}

        {/* Notes Section */}
        {notesOpen && (
          <div className="grid gap-3">
            <div className="text-xs text-slate-500">Notes</div>
            <ReactQuill
              ref={noteRef as any}
              theme="snow"
              value={noteHtml}
              onChange={setNoteHtml}
              modules={modules}
              formats={formats}
              className="bg-white rounded-md"
            />
            <div className="flex items-center gap-2">
              <Button type="button" variant="secondary" onClick={() => cleanAndBeautifySection('notes')} title="Clean & Beautify Notes">
                <Wand2 className="mr-2 h-4 w-4" /> Clean & Beautify
              </Button>
              <Button
                onClick={async () => {
                  const note = DOMPurify.sanitize(noteHtml, { USE_PROFILES: { html: true } });
                  const summary = DOMPurify.sanitize(summaryHtml || latest?.summary || '', { USE_PROFILES: { html: true } });
                  await save({ summary, note, author });
                }}
                disabled={loading}
              >
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4"/>}
                Save Notes
              </Button>
            </div>
          </div>
        )}
        {error && <div className="text-sm text-red-600">{String(error)}</div>}
      </CardContent>
    </Card>
  );
};
