import React, { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Activity, Plus, Trash2, AlertCircle, FileText, Pill, Droplet, Save, Calendar, Heart, AlertTriangle, CheckCircle, Search, Clipboard, X } from 'lucide-react';

// --- Medication Database ---
const DRUG_DB = [
  { keywords: ['chlorothiazide', 'diuril', 'chlorthalidone', 'hydrochlorothiazide', 'microzide', 'hydrodiuril', 'polythiazide', 'renese', 'indapamide', 'lozol', 'metolazone', 'mykrox', 'zaroxolyn'], class: 'Thiazide Diuretic' },
  { keywords: ['bumetanide', 'bumex', 'furosemide', 'lasix', 'torsemide', 'demadex'], class: 'Loop Diuretic' },
  { keywords: ['amiloride', 'midamor', 'triamterene', 'dyrenium'], class: 'K-Sparing Diuretic' },
  { keywords: ['eplerenone', 'inspra', 'spironolactone', 'aldactone'], class: 'Aldosterone Antagonist' },
  { keywords: ['atenolol', 'tenormin', 'betaxolol', 'kerlone', 'bisoprolol', 'zebeta', 'metoprolol', 'lopressor', 'toprol', 'nadolol', 'corgard', 'propranolol', 'inderal', 'timolol', 'blocadren', 'acebutolol', 'sectral', 'penbutolol', 'levatol', 'pindolol', 'carvedilol', 'coreg', 'labetalol', 'normodyne', 'trandate'], class: 'Beta Blocker' },
  { keywords: ['benazepril', 'lotensin', 'captopril', 'capoten', 'enalapril', 'vasotec', 'fosinopril', 'monopril', 'lisinopril', 'prinivil', 'zestril', 'moexipril', 'univasc', 'perindopril', 'aceon', 'quinapril', 'accupril', 'ramipril', 'altace', 'trandolapril', 'mavik'], class: 'ACE Inhibitor' },
  { keywords: ['candesartan', 'atacand', 'eprosartan', 'teveten', 'irbesartan', 'avapro', 'losartan', 'cozaar', 'olmesartan', 'benicar', 'telmisartan', 'micardis', 'valsartan', 'diovan'], class: 'ARB' },
  { keywords: ['diltiazem', 'cardizem', 'dilacor', 'tiazac', 'verapamil', 'calan', 'isoptin', 'covera', 'verelan', 'amlodipine', 'norvasc', 'felodipine', 'plendil', 'isradipine', 'dynacirc', 'nicardipine', 'cardene', 'nifedipine', 'adalat', 'procardia', 'nisoldipine', 'sular'], class: 'Calcium Channel Blockers' },
  { keywords: ['doxazosin', 'cardura', 'prazosin', 'minipress', 'terazosin', 'hytrin'], class: 'Alpha-1 Blocker' },
  { keywords: ['clonidine', 'catapres', 'methyldopa', 'aldomet', 'reserpine', 'guanfacine', 'tenex'], class: 'Central Alpha Agonist' },
  { keywords: ['hydralazine', 'apresoline', 'minoxidil', 'loniten'], class: 'Direct Vasodilator' }
];

const BPManager = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // --- State Data ---
  const [readings, setReadings] = useState([
    { id: 1, date: '2023-10-24', sys: 142, dia: 88, hr: 72 },
    { id: 2, date: '2023-10-25', sys: 138, dia: 85, hr: 70 },
    { id: 3, date: '2023-10-26', sys: 145, dia: 92, hr: 75 },
    { id: 4, date: '2023-10-27', sys: 135, dia: 82, hr: 68 },
    { id: 5, date: '2023-10-28', sys: 150, dia: 95, hr: 78 },
  ]);

  const [meds, setMeds] = useState([
    { id: 1, name: 'Nifedipine', dose: '30mg', freq: 'Daily', class: 'Calcium Channel Blockers' },
  ]);

  const [labs, setLabs] = useState({
    creatinine: 1.1,
    potassium: 4.8,
    gfr: 75,
    sodium: 138
  });

  const [patientHistory, setPatientHistory] = useState({
    diabetes: false,
    ckd: false
  });

  // --- Input States ---
  const [newReading, setNewReading] = useState({ 
    sys: '', 
    dia: '', 
    hr: '', 
    date: new Date().toISOString().split('T')[0] 
  });
  const [newMed, setNewMed] = useState({ name: '', dose: '', freq: '', class: '' });
  
  // Bulk Import State
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState('');

  // --- Logic / Calculations ---
  const averages = useMemo(() => {
    if (readings.length === 0) return { sys: 0, dia: 0 };
    const totalSys = readings.reduce((acc, curr) => acc + curr.sys, 0);
    const totalDia = readings.reduce((acc, curr) => acc + curr.dia, 0);
    return {
      sys: Math.round(totalSys / readings.length),
      dia: Math.round(totalDia / readings.length)
    };
  }, [readings]);

  // --- Handlers ---
  const handleMedNameChange = (e) => {
    const name = e.target.value;
    let detectedClass = 'Other';
    const lowerName = name.toLowerCase();
    for (const group of DRUG_DB) {
      if (group.keywords.some(k => lowerName.includes(k))) {
        detectedClass = group.class;
        break;
      }
    }
    setNewMed({ ...newMed, name: name, class: detectedClass });
  };

  const generateRecommendations = () => {
    const recs = [];
    const criticalReading = readings.find(r => r.sys < 95 || r.sys > 180);

    if (criticalReading) {
      return [{
        type: 'alert',
        title: 'CRITICAL ACTION REQUIRED',
        text: `Critical reading detected (Sys: ${criticalReading.sys} mmHg on ${criticalReading.date}). Standard analysis suspended. Reach out to patient or schedule patient for follow-up immediately.`
      }];
    }

    const isUncontrolled = averages.sys >= 130 || averages.dia >= 80;
    const isHyperkalemic = labs.potassium > 5.0;
    
    const hasACE = meds.some(m => m.class.includes('ACE'));
    const hasARB = meds.some(m => m.class.includes('ARB'));
    const hasThiazide = meds.some(m => m.class.includes('Thiazide'));
    const hasCCB = meds.some(m => m.class.includes('Calcium'));
    const hasRASBlockade = hasACE || hasARB;

    if (isUncontrolled) {
      recs.push({
        type: 'warning',
        title: 'BP Above Goal (>130/80)',
        text: `Current average is ${averages.sys}/${averages.dia}. Intensification of therapy recommended.`
      });

      if (meds.length === 0) {
        if ((patientHistory.diabetes || patientHistory.ckd) && !isHyperkalemic) {
          recs.push({
            type: 'alert',
            title: 'Recommendation: Start ARB',
            text: 'Due to history of Diabetes/CKD, an ARB (or ACE Inhibitor) is the preferred first-line agent for renal protection.'
          });
          recs.push({
            type: 'info',
            title: 'Monitoring Plan',
            text: 'Repeat BMP in 14-21 days to check Potassium and Creatinine after starting ARB.'
          });
        } else {
          let monotherapyOptions = ['Thiazide Diuretic', 'Calcium Channel Blockers'];
          if (!isHyperkalemic) monotherapyOptions.push('ACE/ARB');

          recs.push({
            type: 'info',
            title: 'Recommendation: Initiate Monotherapy',
            text: 'Start one of the following first-line classes:',
            list: monotherapyOptions
          });
          recs.push({
            type: 'info',
            title: 'Monitoring Plan',
            text: 'If starting Thiazide or ACE/ARB: Repeat labs in 14-21 days. If starting CCB: Monitor for peripheral edema.'
          });
        }
      } else {
        if ((patientHistory.diabetes || patientHistory.ckd) && !hasRASBlockade && !isHyperkalemic) {
             recs.push({
                type: 'alert',
                title: 'Recommendation: Add ACE/ARB',
                text: 'Patient has history of Diabetes/CKD but is not on a RAS blocker. Add ACE Inhibitor or ARB for renal protection as priority.',
                list: ['ACE Inhibitor', 'ARB']
             });
             recs.push({
                type: 'info',
                title: 'Monitoring Plan',
                text: 'Repeat BMP in 14-21 days to check Potassium and Creatinine after starting ACE/ARB.'
             });
        } else {
            let options = [];
            if (!hasThiazide) options.push('Thiazide Diuretic');
            if (!hasCCB) options.push('Calcium Channel Blockers');
            if (!hasRASBlockade && !isHyperkalemic) options.push('ACE/ARB');
    
            if (options.length > 0) {
               let title = 'Recommendation: Add Agent';
               let text = 'Consider adding a complementary class to current regimen:';
               let recommendedOptions = options;
    
               if (averages.sys > 140) {
                 title = 'Recommendation: Intensify Therapy';
                 recommendedOptions = options; 
                 text = 'Add complementary class from the following options:';
               }
    
               recs.push({ type: 'alert', title: title, text: text, list: recommendedOptions });
              
               const needsLabMonitoring = recommendedOptions.some(o => o.includes('Thiazide') || o.includes('ACE') || o.includes('ARB'));
               if (needsLabMonitoring) {
                 recs.push({
                    type: 'info',
                    title: 'Monitoring Plan',
                    text: 'If Thiazide or ACE/ARB is added, repeat labs in 14-21 days.'
                 });
               }
            } else {
              recs.push({ type: 'warning', title: 'Resistant Hypertension', text: 'Patient is on multiple first-line classes. Consider mineralocorticoid receptor antagonists (e.g., Spironolactone) or referring to specialist.' });
            }
        }
      }
    } else {
      recs.push({ type: 'success', title: 'BP Controlled', text: 'Blood pressure is within goal (<130/80). Continue current therapy.' });
    }

    if (labs.potassium > 5.0 && hasRASBlockade) {
      recs.push({ type: 'alert', title: 'Safety Warning: Hyperkalemia', text: `Potassium is ${labs.potassium}. Review ACE/ARB dosage or consider alternatives.` });
    }
    return recs;
  };

  const recommendations = generateRecommendations();

  const handleAddReading = () => {
    if (!newReading.sys || !newReading.dia) return;
    const reading = {
      id: Date.now(),
      date: newReading.date || new Date().toISOString().split('T')[0],
      sys: parseInt(newReading.sys),
      dia: parseInt(newReading.dia),
      hr: parseInt(newReading.hr) || 0
    };
    const updatedReadings = [...readings, reading].sort((a, b) => new Date(a.date) - new Date(b.date));
    setReadings(updatedReadings);
    setNewReading({ sys: '', dia: '', hr: '', date: new Date().toISOString().split('T')[0] });
  };
  
  const handleBulkImport = () => {
    if (!importText) return;
    const lines = importText.split('\n');
    const newReadings = [];
    const today = new Date().toISOString().split('T')[0];
    const currentYear = new Date().getFullYear();
    
    lines.forEach(line => {
      let text = line.trim();
      if (!text) return;
      let date = today;
      const dateMatch = text.match(/(\d{4}[\/\-.]\d{1,2}[\/\-.]\d{1,2})|(\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4})|(\d{1,2}[\/\-.]\d{1,2})/);
      if (dateMatch) {
        let dStr = dateMatch[0];
        if (dStr.match(/^\d{1,2}[\/\-.]\d{1,2}$/)) dStr = `${dStr}/${currentYear}`;
        const d = new Date(dStr);
        if (!isNaN(d.getTime())) {
            date = d.toISOString().split('T')[0];
            text = text.replace(dateMatch[0], ''); 
        }
      }
      let sys = null, dia = null, hr = 0;
      const slashMatch = text.match(/(\d{2,3})\s*[\/]\s*(\d{2,3})/);
      if (slashMatch) {
          sys = parseInt(slashMatch[1]); dia = parseInt(slashMatch[2]);
          text = text.replace(slashMatch[0], '');
      } else {
          const numbers = text.match(/\d+/g);
          if (numbers) {
              const nums = numbers.map(n => parseInt(n));
              for (let i = 0; i < nums.length - 1; i++) {
                  const val1 = nums[i], val2 = nums[i+1];
                  if (val1 > 60 && val1 < 300 && val2 > 30 && val2 < 160 && val1 > val2) {
                      sys = val1; dia = val2;
                      if (nums[i+2] && nums[i+2] > 30 && nums[i+2] < 200) hr = nums[i+2];
                      break;
                  }
              }
          }
      }
      if (sys && dia && !hr) {
          const remainingNums = text.match(/\d+/g);
          if (remainingNums) {
             const rNums = remainingNums.map(n => parseInt(n));
             const potentialHr = rNums.find(n => n > 35 && n < 200 && n !== sys && n !== dia);
             if (potentialHr) hr = potentialHr;
          }
      }
      if (sys && dia) newReadings.push({ id: Date.now() + Math.random(), date, sys, dia, hr });
    });
    
    if (newReadings.length > 0) {
      const updatedReadings = [...readings, ...newReadings].sort((a, b) => new Date(a.date) - new Date(b.date));
      setReadings(updatedReadings);
      setImportText('');
      setShowImport(false);
    } else {
      alert("No valid readings detected.");
    }
  };

  const handleAddMed = () => {
    if (!newMed.name) return;
    setMeds([...meds, { ...newMed, id: Date.now() }]);
    setNewMed({ name: '', dose: '', freq: '', class: '' });
  };

  const handleDeleteMed = (id) => { setMeds(meds.filter(m => m.id !== id)); };
  const handleDeleteReading = (id) => { setReadings(readings.filter(r => r.id !== id)); };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      <header className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="bg-blue-600 p-2 rounded-lg text-white">
              <Activity size={20} />
            </div>
            <h1 className="text-xl font-bold text-slate-800">BP Navigator <span className="text-xs font-normal text-slate-500 ml-1">v0.5.0-beta</span></h1>
          </div>
          <nav className="hidden md:flex space-x-1">
            {['dashboard', 'readings', 'meds', 'labs'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-md text-sm font-medium capitalize transition ${
                  activeTab === tab ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* DASHBOARD VIEW */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* CLINICAL ANALYSIS */}
            <div className="bg-slate-800 text-white rounded-xl shadow-lg overflow-hidden relative">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 rounded-full opacity-10 blur-3xl -mt-10 -mr-10 pointer-events-none"></div>
              <div className="flex flex-col md:flex-row">
                {/* Left Side: Logic Output */}
                <div className="p-6 md:w-2/3 space-y-4 relative z-10">
                  <h3 className="text-xl font-bold flex items-center mb-4">
                    <FileText size={20} className="mr-2 text-blue-400" />
                    Clinical Analysis
                  </h3>
                  <div className="space-y-3">
                    {recommendations.map((rec, idx) => (
                      <div key={idx} className={`p-4 rounded-lg border-l-4 ${
                        rec.type === 'alert' ? 'bg-red-900/40 border-red-500' :
                        rec.type === 'warning' ? 'bg-amber-900/40 border-amber-500' :
                        rec.type === 'success' ? 'bg-emerald-900/40 border-emerald-500' :
                        'bg-blue-900/40 border-blue-500'
                      }`}>
                        <h4 className={`font-bold text-sm mb-1 flex items-center ${
                          rec.type === 'alert' ? 'text-red-400' :
                          rec.type === 'warning' ? 'text-amber-400' :
                          rec.type === 'success' ? 'text-emerald-400' :
                          'text-blue-300'
                        }`}>
                          {rec.type === 'alert' && <AlertCircle size={14} className="mr-1"/>}
                          {rec.type === 'warning' && <AlertTriangle size={14} className="mr-1"/>}
                          {rec.type === 'success' && <CheckCircle size={14} className="mr-1"/>}
                          {rec.title}
                        </h4>
                        <p className="text-sm text-slate-300 leading-relaxed">{rec.text}</p>
                        {rec.list && (
                          <ul className="list-disc list-inside text-sm text-slate-300 mt-2 space-y-1 ml-1">
                            {rec.list.map((item, i) => (
                              <li key={i}>{item}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                {/* Right Side: Clinical Context */}
                <div className="p-6 md:w-1/3 bg-slate-900/50 border-l border-slate-700/50 text-sm">
                   <h4 className="font-bold text-slate-400 uppercase tracking-wider mb-3">Patient History</h4>
                   <div className="space-y-2 mb-6">
                      <label className="flex items-center space-x-3 cursor-pointer group">
                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition ${patientHistory.diabetes ? 'bg-blue-500 border-blue-500' : 'border-slate-500 group-hover:border-slate-400'}`}>
                           {patientHistory.diabetes && <CheckCircle size={14} className="text-white" />}
                        </div>
                        <input type="checkbox" className="hidden" checked={patientHistory.diabetes} onChange={(e) => setPatientHistory({...patientHistory, diabetes: e.target.checked})} />
                        <span className="text-slate-300 group-hover:text-white transition">Diabetes History</span>
                      </label>
                      <label className="flex items-center space-x-3 cursor-pointer group">
                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition ${patientHistory.ckd ? 'bg-blue-500 border-blue-500' : 'border-slate-500 group-hover:border-slate-400'}`}>
                           {patientHistory.ckd && <CheckCircle size={14} className="text-white" />}
                        </div>
                        <input type="checkbox" className="hidden" checked={patientHistory.ckd} onChange={(e) => setPatientHistory({...patientHistory, ckd: e.target.checked})} />
                        <span className="text-slate-300 group-hover:text-white transition">CKD (Chronic Kidney)</span>
                      </label>
                   </div>
                   <h4 className="font-bold text-slate-400 uppercase tracking-wider mb-3 border-t border-slate-700 pt-4">Current Regimen</h4>
                   <div className="space-y-2 mb-6">
                     {meds.length > 0 ? (
                       meds.map(m => (
                         <div key={m.id} className="flex justify-between text-slate-300">
                           <span className="truncate pr-2" title={m.name}>{m.name}</span>
                           <span className="text-slate-500 whitespace-nowrap">{m.dose}</span>
                         </div>
                       ))
                     ) : (
                       <div className="text-slate-600 italic">No active medications</div>
                     )}
                   </div>
                   <h4 className="font-bold text-slate-400 uppercase tracking-wider mb-3 border-t border-slate-700 pt-4">Relevant Labs</h4>
                   <div className="space-y-2">
                     <div className="flex justify-between text-slate-300">
                       <span>Potassium</span>
                       <span className={labs.potassium > 5 ? 'text-red-400 font-bold' : 'text-slate-400'}>{labs.potassium}</span>
                     </div>
                     <div className="flex justify-between text-slate-300">
                       <span>Creatinine</span>
                       <span className={labs.creatinine > 1.2 ? 'text-amber-400 font-bold' : 'text-slate-400'}>{labs.creatinine}</span>
                     </div>
                   </div>
                </div>
              </div>
            </div>
            {/* Top Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h3 className="text-sm font-medium text-slate-500 mb-1">Average BP (Last 7 Days)</h3>
                <div className="flex items-baseline space-x-2">
                  <span className={`text-3xl font-bold ${averages.sys >= 130 || averages.dia >= 80 ? 'text-amber-600' : 'text-slate-800'}`}>
                    {averages.sys}/{averages.dia}
                  </span>
                  <span className="text-sm text-slate-400">mmHg</span>
                </div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h3 className="text-sm font-medium text-slate-500 mb-1">Last Lab Date</h3>
                <div className="flex items-baseline space-x-2">
                  <span className="text-3xl font-bold text-slate-800">Oct 12</span>
                  <span className="text-sm text-slate-400">2023</span>
                </div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h3 className="text-sm font-medium text-slate-500 mb-1">Active Meds</h3>
                <div className="flex items-baseline space-x-2">
                  <span className="text-3xl font-bold text-slate-800">{meds.length}</span>
                  <span className="text-sm text-slate-400">Prescriptions</span>
                </div>
              </div>
            </div>
            {/* Main Content Split */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                  <h3 className="text-lg font-bold text-slate-800 mb-4">Blood Pressure Trend</h3>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={readings}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="date" tick={{fontSize: 12}} stroke="#94a3b8" />
                        <YAxis domain={[60, 180]} tick={{fontSize: 12}} stroke="#94a3b8" />
                        <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}/>
                        <ReferenceLine y={130} stroke="orange" strokeDasharray="3 3" label={{ position: 'right',  value: 'Goal 130', fill: 'orange', fontSize: 10 }} />
                        <Line type="monotone" dataKey="sys" stroke="#2563eb" strokeWidth={2} name="Systolic" dot={{r: 4}} />
                        <Line type="monotone" dataKey="dia" stroke="#64748b" strokeWidth={2} name="Diastolic" dot={{r: 4}} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-slate-800">Recent Readings</h3>
                    <button onClick={() => setActiveTab('readings')} className="text-sm text-blue-600 hover:underline">Manage</button>
                  </div>
                  <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-6 py-3 font-medium">Date</th>
                        <th className="px-6 py-3 font-medium">Pressure</th>
                        <th className="px-6 py-3 font-medium">Pulse</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {readings.slice(-3).reverse().map(r => (
                        <tr key={r.id}>
                          <td className="px-6 py-3">{r.date}</td>
                          <td className="px-6 py-3 font-medium text-slate-900">{r.sys}/{r.dia}</td>
                          <td className="px-6 py-3">{r.hr} bpm</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="lg:col-span-1 space-y-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="font-bold text-slate-800 mb-3 flex items-center">
                      <Droplet size={18} className="mr-2 text-purple-500" />
                      Key Lab Values
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500">Potassium</span>
                        <span className={`font-medium ${labs.potassium > 5 ? 'text-red-600' : 'text-slate-800'}`}>{labs.potassium} mEq/L</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500">Creatinine</span>
                        <span className={`font-medium ${labs.creatinine > 1.2 ? 'text-amber-600' : 'text-slate-800'}`}>{labs.creatinine} mg/dL</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500">eGFR</span>
                        <span className="font-medium text-slate-800">{labs.gfr}</span>
                      </div>
                      <button onClick={() => setActiveTab('labs')} className="w-full mt-2 text-xs text-blue-600 border border-blue-200 rounded py-1 hover:bg-blue-50">
                        Update Labs
                      </button>
                    </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* READINGS INPUT TAB */}
        {activeTab === 'readings' && (
          <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Manage Readings</h2>
                <p className="text-sm text-slate-500">Log your daily AM and PM pressures.</p>
              </div>
              <button onClick={() => setShowImport(true)} className="text-sm bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg border border-blue-100 hover:bg-blue-100 flex items-center">
                <Clipboard size={14} className="mr-1.5" /> Bulk Import
              </button>
            </div>
            {showImport && (
              <div className="bg-blue-50 p-6 border-b border-blue-100 relative">
                 <button onClick={() => setShowImport(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
                   <X size={20} />
                 </button>
                 <h3 className="font-bold text-slate-800 mb-2 flex items-center">
                   <Clipboard size={18} className="mr-2 text-blue-600" /> Paste Readings
                 </h3>
                 <p className="text-xs text-slate-500 mb-3">
                   Paste readings from Excel, email, or notes. Format example: <strong>"10/24 120/80 72"</strong> or just <strong>"120/80"</strong>.
                 </p>
                 <textarea
                   value={importText}
                   onChange={(e) => setImportText(e.target.value)}
                   className="w-full h-32 p-3 border border-slate-300 rounded text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                   placeholder={`10/25/2023 125/82 72\n10/26/2023 120/80 70\n118/78`}
                 />
                 <div className="flex justify-end mt-3">
                   <button onClick={handleBulkImport} className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50" disabled={!importText.trim()}>
                     Process & Add Readings
                   </button>
                 </div>
              </div>
            )}
            <div className="p-6 bg-slate-50 border-b border-slate-100">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-end mb-4">
                <div className="col-span-2 md:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1 flex items-center">
                    <Calendar size={12} className="mr-1"/> Date
                  </label>
                  <input type="date" value={newReading.date} onChange={(e) => setNewReading({...newReading, date: e.target.value})} className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                   <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Sys</label>
                   <input type="number" value={newReading.sys} onChange={(e) => setNewReading({...newReading, sys: e.target.value})} className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none" placeholder="120"/>
                </div>
                <div>
                   <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Dia</label>
                   <input type="number" value={newReading.dia} onChange={(e) => setNewReading({...newReading, dia: e.target.value})} className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none" placeholder="80"/>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-end">
                <div className="col-span-2">
                   <label className="block text-xs font-bold text-slate-500 uppercase mb-1 flex items-center">
                    <Heart size={12} className="mr-1"/> Heart Rate
                   </label>
                   <input type="number" value={newReading.hr} onChange={(e) => setNewReading({...newReading, hr: e.target.value})} className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none" placeholder="72"/>
                </div>
                <div className="col-span-2">
                  <button onClick={handleAddReading} className="w-full bg-blue-600 text-white h-[42px] rounded font-medium hover:bg-blue-700 flex items-center justify-center">
                    <Plus size={18} className="mr-1" /> Add Entry
                  </button>
                </div>
              </div>
            </div>
            <div className="divide-y divide-slate-100">
              {readings.slice().reverse().map(r => (
                <div key={r.id} className="p-4 flex justify-between items-center hover:bg-slate-50">
                  <div>
                    <div className="font-bold text-slate-800">{r.sys} / {r.dia} <span className="text-slate-400 font-normal text-sm">mmHg</span></div>
                    <div className="text-xs text-slate-500">{r.date} • HR: {r.hr || '--'} bpm</div>
                  </div>
                  <button onClick={() => handleDeleteReading(r.id)} className="text-slate-400 hover:text-red-500">
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MEDS TAB */}
        {activeTab === 'meds' && (
          <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-800">Current Medications</h2>
              <p className="text-sm text-slate-500">Medication classes affect recommendation logic.</p>
            </div>
            <div className="p-6 bg-slate-50 border-b border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="col-span-1 md:col-span-2 relative">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Medication Name</label>
                <div className="relative">
                  <input placeholder="e.g., Lisinopril, Amlodipine" value={newMed.name} onChange={handleMedNameChange} className="w-full p-2 pl-9 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none" />
                  <Search size={16} className="absolute left-3 top-3 text-slate-400" />
                </div>
                <div className="mt-2 text-xs flex items-center text-slate-500 bg-slate-100 p-2 rounded border border-slate-200">
                   <span className="font-bold mr-2 uppercase">Detected Class:</span> 
                   <span className={newMed.class === 'Other' || !newMed.class ? 'text-slate-400 italic' : 'text-blue-600 font-bold'}>
                     {newMed.class || 'Start typing to detect...'}
                   </span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Dose</label>
                <input placeholder="e.g., 10mg" value={newMed.dose} onChange={(e) => setNewMed({...newMed, dose: e.target.value})} className="w-full p-2 border border-slate-300 rounded" />
              </div>
              <div className="flex items-end">
                <button onClick={handleAddMed} className="w-full bg-emerald-600 text-white h-[42px] rounded font-medium hover:bg-emerald-700 flex items-center justify-center">
                  <Plus size={18} className="mr-1" /> Add Medication
                </button>
              </div>
            </div>
            <div className="divide-y divide-slate-100">
              {meds.map(m => (
                <div key={m.id} className="p-4 flex justify-between items-center hover:bg-slate-50">
                  <div className="flex items-start space-x-3">
                    <div className="bg-emerald-100 text-emerald-600 p-2 rounded-lg">
                      <Pill size={20} />
                    </div>
                    <div>
                      <div className="font-bold text-slate-800">{m.name} <span className="text-xs bg-slate-200 px-2 py-0.5 rounded text-slate-600 ml-2">{m.class}</span></div>
                      <div className="text-sm text-slate-500">{m.dose} • {m.freq}</div>
                    </div>
                  </div>
                  <button onClick={() => handleDeleteMed(m.id)} className="text-slate-400 hover:text-red-500">
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* LABS TAB */}
        {activeTab === 'labs' && (
          <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
             <div className="p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-800">Laboratory Values</h2>
              <p className="text-sm text-slate-500">Recent Metabolic Panel results.</p>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <label className="flex justify-between text-sm font-medium text-slate-700 mb-1">
                  <span>Potassium (K+)</span>
                  <span className="text-slate-400">Normal: 3.5 - 5.0</span>
                </label>
                <div className="flex items-center space-x-4">
                  <input type="range" min="2.5" max="6.5" step="0.1" value={labs.potassium} onChange={(e) => setLabs({...labs, potassium: parseFloat(e.target.value)})} className="flex-1" />
                  <input type="number" value={labs.potassium} onChange={(e) => setLabs({...labs, potassium: parseFloat(e.target.value)})} className="w-20 p-2 border border-slate-300 rounded font-bold text-center" />
                </div>
              </div>
              <div>
                <label className="flex justify-between text-sm font-medium text-slate-700 mb-1">
                  <span>Serum Creatinine</span>
                  <span className="text-slate-400">Normal: 0.7 - 1.2</span>
                </label>
                <div className="flex items-center space-x-4">
                  <input type="range" min="0.5" max="3.0" step="0.1" value={labs.creatinine} onChange={(e) => setLabs({...labs, creatinine: parseFloat(e.target.value)})} className="flex-1" />
                  <input type="number" value={labs.creatinine} onChange={(e) => setLabs({...labs, creatinine: parseFloat(e.target.value)})} className="w-20 p-2 border border-slate-300 rounded font-bold text-center" />
                </div>
              </div>
              <div className="pt-6 border-t border-slate-100 flex justify-end">
                <button onClick={() => setActiveTab('dashboard')} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium flex items-center">
                  <Save size={18} className="mr-2" /> Save & Analyze
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default BPManager;