import { useMemo, useState, useCallback } from 'react';

/* ─── Types ─────────────────────────────────────────────────────── */
type HeaderFields = {
  batchNumber: string;
  batchCategory: string;
  batchType: string;
  batchName: string;
  preparerOrganization: string;
  preparerName: string;
  preparerHOFI: string;
  createdDate: string;
  batchStatus: string;
  workflowStatus: string;
  bankName: string;
  bankAccount: string;
  bankDate: string;
  bankReference: string;
  bankAmount: string;
};

/* ─── Placeholder dropdown data ─────────────────────────────────── */
const batchCategories = ['Deposit', 'Transfer', 'Reallocation'];

const batchTypesByCategory: Record<string, string[]> = {
  Deposit: ['Swept Cash ZBA', 'Deposit Correction (Same-HOFI)', 'Deposit Correction (Cross-HOFI)'],
  Transfer: ['Interfund Transfer', 'Intrafund Transfer', 'Cash Transfer'],
  Reallocation: ['IA Reallocation', 'Project Reallocation', 'Fund Reallocation'],
};

const organizations = [
  { code: 'AUD', label: 'AUD — Auditor & Controller' },
  { code: 'TES', label: 'TES — Treasurer-Tax Collector' },
  { code: 'HHS', label: 'HHS — Health & Human Services' },
  { code: 'DPW', label: 'DPW — Public Works' },
  { code: 'SHR', label: 'SHR — Sheriff' },
  { code: 'LIB', label: 'LIB — Library' },
  { code: 'PLN', label: 'PLN — Planning & Development' },
];

const preparersByOrg: Record<string, string[]> = {
  AUD: ['Moana Wavecrest', 'Kai Tidemark', 'Leilani Shore'],
  TES: ['Levi Stream', 'Coral Banks', 'Marina Depth'],
  HHS: ['Ava Harbor', 'Reef Castillo', 'Isla Sandoval'],
  DPW: ['Duncan Bridger', 'Sierra Granite', 'Clay Asphalt'],
  SHR: ['Morgan Shield', 'Barrett Ironwood', 'Quinn Patrol'],
  LIB: ['Paige Turner', 'Dewey Bookend', 'Margot Shelf'],
  PLN: ['Skyler Blueprint', 'Mason Parcel', 'Zara Overlay'],
};

const bankAccounts = [
  { name: 'County of SD Pooled Cash — Wells Fargo', account: '4021-7789-0001', hofi: 'AUD' },
  { name: 'County of SD Pooled Cash — Bank of America', account: '6833-4420-0055', hofi: 'TES' },
  { name: 'County of SD Treasury ZBA — Chase', account: '9102-5567-0032', hofi: 'TES' },
  { name: 'HHS Grant Deposits — US Bank', account: '7714-0098-2210', hofi: 'HHS' },
  { name: 'Public Works Capital — Citibank', account: '3308-6621-4477', hofi: 'DPW' },
];

const batchStatuses = ['Incomplete', 'Pending Review', 'Ready for Approval', 'Complete'];
const workflowStates = ['Not Submitted', 'Submitted', 'Awaiting HOFI Approval', 'Awaiting A&C Approval', 'Approved', 'Rejected'];

/* ─── Mock GL lines ─────────────────────────────────────────────── */
const glLines = [
  { id: 1, fund: '10100', org: '15675', account: '47535', project: '0000000', task: '000', award: '000000', fundingSource: '000000', debit: 0, credit: 45000.00, description: 'State Public Health Reimbursement' },
  { id: 2, fund: '10100', org: '14565', account: '47535', project: '0000000', task: '000', award: '000000', fundingSource: '000000', debit: 0, credit: 25000.00, description: 'Federal Housing Authority Grant' },
  { id: 3, fund: '61142', org: '00000', account: '80100', project: '1042789', task: '100', award: 'AWD-0891', fundingSource: '200100', debit: 15000.00, credit: 0, description: 'Capital Improvement — Road Resurfacing' },
  { id: 4, fund: '10100', org: '15675', account: '47200', project: '0000000', task: '000', award: '000000', fundingSource: '000000', debit: 0, credit: 22550.70, description: 'Permit Fee Collections — December' },
  { id: 5, fund: '20300', org: '16890', account: '48100', project: '2001456', task: '200', award: 'AWD-1234', fundingSource: '300200', debit: 0, credit: 12000.00, description: 'Behavioral Health Services Revenue' },
];

/* ─── Mock PNG lines ────────────────────────────────────────────── */
const pngLines = [
  { id: 1, project: '1042789', task: '100', award: 'AWD-0891', expenditureOrg: 'DPW', expenditureType: 'Labor', amount: 8500.00, hofi: 'DPW', description: 'Road Resurfacing — Labor Q4' },
  { id: 2, project: '2001456', task: '200', award: 'AWD-1234', expenditureOrg: 'HHS', expenditureType: 'Supplies', amount: 3200.00, hofi: 'HHS', description: 'BHS Program Supplies' },
  { id: 3, project: '1042789', task: '300', award: 'AWD-0891', expenditureOrg: 'DPW', expenditureType: 'Equipment', amount: 6500.00, hofi: 'DPW', description: 'Road Resurfacing — Equipment Rental' },
];

/* ─── Mock AR Receipt lines ─────────────────────────────────────── */
const arLines = [
  { id: 1, receiptNumber: 'AR-DART-000001-01', customer: 'State of California — DHCS', amount: 45000.00, receiptDate: '2024-12-27', status: 'Applied', dartBatch: 'DART-000001' },
  { id: 2, receiptNumber: 'AR-DART-000001-02', customer: 'US Dept of Housing & Urban Dev', amount: 25000.00, receiptDate: '2024-12-27', status: 'Applied', dartBatch: 'DART-000001' },
  { id: 3, receiptNumber: 'AR-DART-000001-03', customer: 'San Diego County Permits', amount: 22550.70, receiptDate: '2024-12-27', status: 'Unapplied', dartBatch: 'DART-000001' },
];

/* ─── Initial form state ────────────────────────────────────────── */
const initialState: HeaderFields = {
  batchNumber: 'DART-000001',
  batchCategory: 'Deposit',
  batchType: 'Swept Cash ZBA',
  batchName: 'AUDITMSCRT27DEC2024.DEMO',
  preparerOrganization: 'AUD',
  preparerName: 'Moana Wavecrest',
  preparerHOFI: 'AUD',
  createdDate: new Date().toISOString().split('T')[0],
  batchStatus: 'Incomplete',
  workflowStatus: 'Not Submitted',
  bankName: 'County of SD Pooled Cash — Wells Fargo',
  bankAccount: '4021-7789-0001',
  bankDate: '2024-12-27',
  bankReference: '0005794549XF',
  bankAmount: '119550.70',
};

/* ─── Helpers ───────────────────────────────────────────────────── */
const usd = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

/* ─── App ───────────────────────────────────────────────────────── */
function App() {
  const [fields, setFields] = useState<HeaderFields>(initialState);
  const [locked, setLocked] = useState(false);
  const [activeTab, setActiveTab] = useState<'GL Lines' | 'PNG Lines' | 'AR Receipt Lines'>('GL Lines');
  const [showLockToast, setShowLockToast] = useState(false);

  /* derived */
  const currentBatchTypes = batchTypesByCategory[fields.batchCategory] ?? [];
  const currentPreparers = preparersByOrg[fields.preparerOrganization] ?? [];
  const matchingBanks = bankAccounts.filter(b => b.hofi === fields.preparerHOFI);
  const hofiMismatch = fields.preparerHOFI !== fields.preparerOrganization;

  const glTotal = useMemo(() => glLines.reduce((s, l) => s + l.credit - l.debit, 0), []);
  const pngTotal = useMemo(() => pngLines.reduce((s, l) => s + l.amount, 0), []);
  const arTotal = useMemo(() => arLines.reduce((s, l) => s + l.amount, 0), []);

  const handleChange = useCallback((key: keyof HeaderFields, value: string) => {
    if (locked) return;
    setFields(prev => {
      const next = { ...prev, [key]: value };
      /* cascade: category change resets batch type */
      if (key === 'batchCategory') {
        const types = batchTypesByCategory[value] ?? [];
        next.batchType = types[0] ?? '';
      }
      /* cascade: org change updates HOFI and resets preparer */
      if (key === 'preparerOrganization') {
        next.preparerHOFI = value;
        const preps = preparersByOrg[value] ?? [];
        next.preparerName = preps[0] ?? '';
      }
      /* cascade: bank selection fills account */
      if (key === 'bankName') {
        const bank = bankAccounts.find(b => b.name === value);
        if (bank) next.bankAccount = bank.account;
      }
      return next;
    });
  }, [locked]);

  const handleSave = () => {
    setLocked(true);
    setFields(prev => ({ ...prev, batchStatus: 'Complete', workflowStatus: 'Submitted' }));
    setShowLockToast(true);
    setTimeout(() => setShowLockToast(false), 4000);
  };

  const handleUnlock = () => {
    setLocked(false);
    setFields(prev => ({ ...prev, batchStatus: 'Incomplete', workflowStatus: 'Not Submitted' }));
  };

  return (
    <div className="rw-shell">
      {/* ── Global nav bar ── */}
      <nav className="rw-nav">
        <div className="rw-nav-left">
          <span className="rw-nav-hamburger">&#9776;</span>
          <span className="rw-nav-title">Oracle Cloud</span>
          <span className="rw-nav-divider" />
          <span className="rw-nav-module">Cash Management</span>
        </div>
        <div className="rw-nav-right">
          <span className="rw-nav-item">Notifications</span>
          <span className="rw-nav-item">Settings</span>
          <span className="rw-nav-avatar">{fields.preparerName.split(' ').map(n => n[0]).join('')}</span>
        </div>
      </nav>

      {/* ── Page header ── */}
      <header className="rw-page-header">
        <div className="rw-page-header-left">
          <div className="rw-breadcrumb">
            <span>Cash Management</span>
            <span className="rw-bc-sep">/</span>
            <span>DART Batches</span>
            <span className="rw-bc-sep">/</span>
            <span className="rw-bc-active">Deposit Swept Cash ZBA</span>
          </div>
          <h1 className="rw-page-title">
            DART Deposit Batch
            <span className="rw-batch-id">{fields.batchNumber}</span>
          </h1>
          <p className="rw-page-subtitle">
            County of San Diego — Deposit, Accounts Receivables, Reallocations & Transfers
          </p>
        </div>
        <div className="rw-page-header-right">
          <div className={`rw-lock-badge ${locked ? 'locked' : 'unlocked'}`}>
            <svg className="rw-lock-svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {locked ? (
                <>
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0110 0v4" />
                </>
              ) : (
                <>
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 019.9-1" />
                </>
              )}
            </svg>
            <span>{locked ? 'Record Locked' : 'No Lock'}</span>
          </div>
          <div className={`rw-status-chip ${fields.batchStatus === 'Complete' ? 'complete' : 'incomplete'}`}>
            {fields.batchStatus}
          </div>
        </div>
      </header>

      {/* ── Toast notification ── */}
      {showLockToast && (
        <div className="rw-toast">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
          Batch saved and record locked. This bank deposit cannot be selected by another preparer.
        </div>
      )}

      {/* ── HOFI mismatch warning ── */}
      {hofiMismatch && !locked && (
        <div className="rw-warning-bar">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
          HOFI Mismatch — Preparer HOFI ({fields.preparerHOFI}) does not match Organization ({fields.preparerOrganization}). Cross-HOFI corrections require Owning HOFI authorization.
        </div>
      )}

      <div className="rw-content">
        {/* ── Action bar ── */}
        <div className="rw-action-bar">
          <div className="rw-lock-message">
            {locked ? (
              <>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>
                This deposit record is locked. The bank deposit cannot be selected by another preparer in DART.
              </>
            ) : (
              <>Saving will create a record lock preventing duplicate access to this bank deposit.</>
            )}
          </div>
          <div className="rw-action-buttons">
            {locked && (
              <button className="rw-btn rw-btn-ghost" onClick={handleUnlock}>Unlock (Demo)</button>
            )}
            <button className="rw-btn rw-btn-primary" onClick={handleSave} disabled={locked}>
              {locked ? 'Batch Locked' : 'Save Batch & Lock Record'}
            </button>
          </div>
        </div>

        {/* ── Standard Header ── */}
        <section className="rw-card">
          <div className="rw-card-header">
            <h2>Standard Header</h2>
            <span className="rw-card-badge">Batch Entry</span>
          </div>
          <div className="rw-form-grid rw-form-grid-3">
            <label className="rw-field">
              <span className="rw-label">Batch Number</span>
              <input className="rw-input" value={fields.batchNumber} readOnly />
            </label>
            <label className="rw-field">
              <span className="rw-label">Batch Category</span>
              <select className="rw-select" value={fields.batchCategory} onChange={e => handleChange('batchCategory', e.target.value)} disabled={locked}>
                {batchCategories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
            <label className="rw-field">
              <span className="rw-label">Batch Type</span>
              <select className="rw-select" value={fields.batchType} onChange={e => handleChange('batchType', e.target.value)} disabled={locked}>
                {currentBatchTypes.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </label>
            <label className="rw-field rw-span-2">
              <span className="rw-label">Batch Name</span>
              <input className="rw-input" value={fields.batchName} onChange={e => handleChange('batchName', e.target.value)} readOnly={locked} />
            </label>
            <label className="rw-field">
              <span className="rw-label">Created Date</span>
              <input className="rw-input" type="date" value={fields.createdDate} onChange={e => handleChange('createdDate', e.target.value)} readOnly={locked} />
            </label>
            <label className="rw-field">
              <span className="rw-label">Preparer Organization</span>
              <select className="rw-select" value={fields.preparerOrganization} onChange={e => handleChange('preparerOrganization', e.target.value)} disabled={locked}>
                {organizations.map(o => <option key={o.code} value={o.code}>{o.label}</option>)}
              </select>
            </label>
            <label className="rw-field">
              <span className="rw-label">Preparer Name</span>
              <select className="rw-select" value={fields.preparerName} onChange={e => handleChange('preparerName', e.target.value)} disabled={locked}>
                {currentPreparers.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </label>
            <label className="rw-field">
              <span className="rw-label">Preparer HOFI</span>
              <input className="rw-input rw-hofi" value={fields.preparerHOFI} onChange={e => handleChange('preparerHOFI', e.target.value)} readOnly={locked} />
            </label>
            <label className="rw-field">
              <span className="rw-label">Batch Status</span>
              <select className="rw-select" value={fields.batchStatus} onChange={e => handleChange('batchStatus', e.target.value)} disabled={locked}>
                {batchStatuses.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
            <label className="rw-field">
              <span className="rw-label">Workflow Status</span>
              <select className="rw-select" value={fields.workflowStatus} onChange={e => handleChange('workflowStatus', e.target.value)} disabled={locked}>
                {workflowStates.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
          </div>
        </section>

        {/* ── Context Header (Bank Info) ── */}
        <section className="rw-card">
          <div className="rw-card-header">
            <h2>Bank Deposit Context</h2>
            <span className="rw-card-badge">HOFI-Restricted</span>
          </div>
          <div className="rw-form-grid rw-form-grid-3">
            <label className="rw-field rw-span-2">
              <span className="rw-label">Bank Name</span>
              <select className="rw-select" value={fields.bankName} onChange={e => handleChange('bankName', e.target.value)} disabled={locked}>
                {(matchingBanks.length > 0 ? matchingBanks : bankAccounts).map(b => (
                  <option key={b.account} value={b.name}>{b.name} ({b.hofi})</option>
                ))}
              </select>
            </label>
            <label className="rw-field">
              <span className="rw-label">Bank Account</span>
              <input className="rw-input" value={fields.bankAccount} readOnly />
            </label>
            <label className="rw-field">
              <span className="rw-label">Bank Date</span>
              <input className="rw-input" type="date" value={fields.bankDate} onChange={e => handleChange('bankDate', e.target.value)} readOnly={locked} />
            </label>
            <label className="rw-field">
              <span className="rw-label">Bank Reference</span>
              <input className="rw-input" value={fields.bankReference} onChange={e => handleChange('bankReference', e.target.value)} readOnly={locked} />
            </label>
            <label className="rw-field">
              <span className="rw-label">Bank Amount</span>
              <input className="rw-input rw-amount" type="text" value={fields.bankAmount} onChange={e => handleChange('bankAmount', e.target.value)} readOnly={locked} />
            </label>
          </div>
          {matchingBanks.length > 0 && !locked && (
            <p className="rw-hint">Showing bank accounts where Owning HOFI matches preparer HOFI ({fields.preparerHOFI}).</p>
          )}
        </section>

        {/* ── Tabs ── */}
        <section className="rw-card rw-card-flush">
          <div className="rw-tabs">
            {(['GL Lines', 'PNG Lines', 'AR Receipt Lines'] as const).map(tab => (
              <button
                key={tab}
                className={`rw-tab ${tab === activeTab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
                <span className="rw-tab-count">
                  {tab === 'GL Lines' ? glLines.length : tab === 'PNG Lines' ? pngLines.length : arLines.length}
                </span>
              </button>
            ))}
          </div>

          <div className="rw-tab-panel">
            {activeTab === 'GL Lines' && (
              <>
                <div className="rw-table-toolbar">
                  <span className="rw-table-title">General Ledger Distribution Lines</span>
                  <span className="rw-row-count">{glLines.length} rows</span>
                </div>
                <div className="rw-table-wrap">
                  <table className="rw-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Fund</th>
                        <th>Org</th>
                        <th>Account</th>
                        <th>Project</th>
                        <th>Task</th>
                        <th>Award</th>
                        <th className="rw-num">Debit</th>
                        <th className="rw-num">Credit</th>
                        <th>Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {glLines.map(l => (
                        <tr key={l.id}>
                          <td>{l.id}</td>
                          <td>{l.fund}</td>
                          <td>{l.org}</td>
                          <td>{l.account}</td>
                          <td>{l.project}</td>
                          <td>{l.task}</td>
                          <td>{l.award}</td>
                          <td className="rw-num">{l.debit > 0 ? usd(l.debit) : '—'}</td>
                          <td className="rw-num">{l.credit > 0 ? usd(l.credit) : '—'}</td>
                          <td>{l.description}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan={7} className="rw-foot-label">Block Total</td>
                        <td className="rw-num">{usd(glLines.reduce((s, l) => s + l.debit, 0))}</td>
                        <td className="rw-num">{usd(glLines.reduce((s, l) => s + l.credit, 0))}</td>
                        <td>Net: {usd(glTotal)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </>
            )}

            {activeTab === 'PNG Lines' && (
              <>
                <div className="rw-table-toolbar">
                  <span className="rw-table-title">Projects & Grants (POETA) Lines</span>
                  <span className="rw-row-count">{pngLines.length} rows</span>
                </div>
                <div className="rw-table-wrap">
                  <table className="rw-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Project</th>
                        <th>Task</th>
                        <th>Award</th>
                        <th>Exp Org</th>
                        <th>Exp Type</th>
                        <th>HOFI</th>
                        <th className="rw-num">Amount</th>
                        <th>Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pngLines.map(l => (
                        <tr key={l.id}>
                          <td>{l.id}</td>
                          <td>{l.project}</td>
                          <td>{l.task}</td>
                          <td>{l.award}</td>
                          <td>{l.expenditureOrg}</td>
                          <td>{l.expenditureType}</td>
                          <td><span className="rw-hofi-tag">{l.hofi}</span></td>
                          <td className="rw-num">{usd(l.amount)}</td>
                          <td>{l.description}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan={7} className="rw-foot-label">Total</td>
                        <td className="rw-num">{usd(pngTotal)}</td>
                        <td />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </>
            )}

            {activeTab === 'AR Receipt Lines' && (
              <>
                <div className="rw-table-toolbar">
                  <span className="rw-table-title">Accounts Receivable Receipts</span>
                  <span className="rw-row-count">{arLines.length} rows</span>
                </div>
                <div className="rw-table-wrap">
                  <table className="rw-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Receipt Number</th>
                        <th>Customer</th>
                        <th className="rw-num">Amount</th>
                        <th>Receipt Date</th>
                        <th>Status</th>
                        <th>DART Batch</th>
                      </tr>
                    </thead>
                    <tbody>
                      {arLines.map(l => (
                        <tr key={l.id}>
                          <td>{l.id}</td>
                          <td className="rw-mono">{l.receiptNumber}</td>
                          <td>{l.customer}</td>
                          <td className="rw-num">{usd(l.amount)}</td>
                          <td>{l.receiptDate}</td>
                          <td><span className={`rw-status-tag ${l.status === 'Applied' ? 'applied' : 'unapplied'}`}>{l.status}</span></td>
                          <td className="rw-mono">{l.dartBatch}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan={3} className="rw-foot-label">Total Receipts</td>
                        <td className="rw-num">{usd(arTotal)}</td>
                        <td colSpan={3} />
                      </tr>
                    </tfoot>
                  </table>
                </div>
                <p className="rw-hint">DART Batch number is incorporated into the AR Receipt number for traceability between bank deposit, DART batch, and AR receipt.</p>
              </>
            )}
          </div>
        </section>
      </div>

      {/* ── Footer ── */}
      <footer className="rw-footer">
        <span>DART Deposit Batch Demo — County of San Diego</span>
        <span>Sierra-Cedar &middot; Interactive Prototype &middot; Not for Production Use</span>
      </footer>
    </div>
  );
}

export default App;
