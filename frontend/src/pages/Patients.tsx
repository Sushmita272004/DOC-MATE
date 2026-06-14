import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import {
  Search, Plus, Trash2, Edit2, X, ChevronLeft, Calendar, Pill,
  User, Phone, Activity, Clock, FileText,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────
interface Patient { id: string; name: string; age: number; gender: string; disease: string; phone: string; created_at: string; }
interface Appointment { id?: string; patient_id: string; appointment_date: string; appointment_type: string; doctor_name: string; notes: string; status: string; }
interface Prescription { id?: string; patient_id: string; medication_name: string; dosage: string; frequency: string; duration: string; notes: string; status: string; }

const emptyPatient = () => ({ name: "", age: 0, gender: "", disease: "", phone: "" });
const emptyAppointment = (pid: string): Appointment => ({ patient_id: pid, appointment_date: "", appointment_type: "", doctor_name: "", notes: "", status: "scheduled" });

// ─── Status Badge ────────────────────────────────────────────────────────────
const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, string> = {
    scheduled: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
    completed: "bg-green-500/20 text-green-400 border border-green-500/30",
    cancelled: "bg-red-500/20 text-red-400 border border-red-500/30",
    active: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
    discontinued: "bg-gray-500/20 text-gray-400 border border-gray-500/30",
  };
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${map[status] ?? "bg-gray-700 text-gray-300"}`}>{status.charAt(0).toUpperCase() + status.slice(1)}</span>;
};

// ─── Patient Report Generator ────────────────────────────────────────────────
function generateReport(patients: Patient[], appointments: Appointment[], prescriptions: Prescription[]) {
  const now = new Date().toLocaleString();
  const totalMale = patients.filter(p => p.gender === "Male").length;
  const totalFemale = patients.filter(p => p.gender === "Female").length;
  const diseaseCounts = patients.reduce<Record<string, number>>((acc, p) => { acc[p.disease] = (acc[p.disease] ?? 0) + 1; return acc; }, {});
  const topDiseases = Object.entries(diseaseCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const avgAge = patients.length > 0 ? Math.round(patients.reduce((s, p) => s + p.age, 0) / patients.length) : 0;

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <title>Patient Report – DocMate</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f8fafc; color: #1e293b; padding: 40px; }
    .header { background: linear-gradient(135deg, #1e40af, #7c3aed); color: white; padding: 32px 40px; border-radius: 16px; margin-bottom: 32px; }
    .header h1 { font-size: 28px; font-weight: 700; }
    .header p { opacity: 0.8; margin-top: 4px; font-size: 14px; }
    .header .meta { margin-top: 16px; font-size: 12px; opacity: 0.7; }
    .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 32px; }
    .kpi { background: white; border-radius: 12px; padding: 20px; box-shadow: 0 1px 4px rgba(0,0,0,0.08); border: 1px solid #e2e8f0; }
    .kpi .num { font-size: 28px; font-weight: 700; color: #1e40af; }
    .kpi .lbl { font-size: 12px; color: #64748b; margin-top: 4px; }
    .section { background: white; border-radius: 12px; padding: 24px; box-shadow: 0 1px 4px rgba(0,0,0,0.08); border: 1px solid #e2e8f0; margin-bottom: 24px; }
    .section h2 { font-size: 16px; font-weight: 600; color: #1e293b; margin-bottom: 16px; padding-bottom: 10px; border-bottom: 2px solid #f1f5f9; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th { background: #f8fafc; text-align: left; padding: 10px 12px; font-weight: 600; color: #475569; border-bottom: 2px solid #e2e8f0; }
    td { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; color: #334155; }
    tr:last-child td { border-bottom: none; }
    .badge { display: inline-block; padding: 2px 10px; border-radius: 100px; font-size: 11px; font-weight: 600; }
    .badge-active { background: #dcfce7; color: #166534; }
    .badge-scheduled { background: #dbeafe; color: #1d4ed8; }
    .badge-completed { background: #d1fae5; color: #065f46; }
    .badge-cancelled { background: #fee2e2; color: #991b1b; }
    .bar-row { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
    .bar-label { width: 120px; font-size: 13px; color: #475569; flex-shrink: 0; }
    .bar-wrap { flex: 1; background: #f1f5f9; border-radius: 100px; height: 10px; overflow: hidden; }
    .bar-fill { height: 100%; border-radius: 100px; background: linear-gradient(90deg, #3b82f6, #7c3aed); }
    .bar-count { width: 24px; font-size: 13px; font-weight: 600; color:#334155; text-align: right; }
    .footer { text-align: center; color: #94a3b8; font-size: 12px; margin-top: 32px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>DocMate – Patient Report</h1>
    <p>Comprehensive overview of all patient records and medical data</p>
    <div class="meta">Generated: ${now} · Total Records: ${patients.length}</div>
  </div>
  <div class="grid">
    <div class="kpi"><div class="num">${patients.length}</div><div class="lbl">Total Patients</div></div>
    <div class="kpi"><div class="num">${appointments.length}</div><div class="lbl">Total Appointments</div></div>
    <div class="kpi"><div class="num">${prescriptions.filter(p => p.status === "active").length}</div><div class="lbl">Active Prescriptions</div></div>
    <div class="kpi"><div class="num">${avgAge}</div><div class="lbl">Average Age</div></div>
  </div>
  <div class="section">
    <h2>Disease Distribution (Top 5)</h2>
    ${topDiseases.map(([disease, count]) => `
      <div class="bar-row">
        <span class="bar-label">${disease}</span>
        <div class="bar-wrap"><div class="bar-fill" style="width:${Math.round((count / patients.length) * 100)}%"></div></div>
        <span class="bar-count">${count}</span>
      </div>`).join("")}
  </div>
  <div class="section">
    <h2>Gender Summary</h2>
    <div class="bar-row">
      <span class="bar-label">Male</span>
      <div class="bar-wrap"><div class="bar-fill" style="width:${patients.length ? Math.round((totalMale / patients.length) * 100) : 0}%; background: linear-gradient(90deg,#3b82f6,#06b6d4)"></div></div>
      <span class="bar-count">${totalMale}</span>
    </div>
    <div class="bar-row">
      <span class="bar-label">Female</span>
      <div class="bar-wrap"><div class="bar-fill" style="width:${patients.length ? Math.round((totalFemale / patients.length) * 100) : 0}%; background: linear-gradient(90deg,#ec4899,#a855f7)"></div></div>
      <span class="bar-count">${totalFemale}</span>
    </div>
  </div>
  <div class="section">
    <h2>All Patients</h2>
    <table>
      <thead><tr><th>#</th><th>Name</th><th>Age</th><th>Gender</th><th>Disease</th><th>Phone</th><th>Registered</th></tr></thead>
      <tbody>
        ${patients.map((p, i) => `<tr><td>${i + 1}</td><td><strong>${p.name}</strong></td><td>${p.age}</td><td>${p.gender}</td><td>${p.disease}</td><td>${p.phone}</td><td>${new Date(p.created_at).toLocaleDateString()}</td></tr>`).join("")}
      </tbody>
    </table>
  </div>
  ${appointments.length > 0 ? `
  <div class="section">
    <h2>Appointments Summary</h2>
    <table>
      <thead><tr><th>Date</th><th>Type</th><th>Doctor</th><th>Status</th><th>Notes</th></tr></thead>
      <tbody>
        ${appointments.slice(0, 20).map(a => `<tr><td>${new Date(a.appointment_date).toLocaleString()}</td><td>${a.appointment_type}</td><td>Dr. ${a.doctor_name}</td><td><span class="badge badge-${a.status}">${a.status.charAt(0).toUpperCase() + a.status.slice(1)}</span></td><td>${a.notes || "—"}</td></tr>`).join("")}
      </tbody>
    </table>
  </div>` : ""}
  ${prescriptions.length > 0 ? `
  <div class="section">
    <h2>Prescriptions Summary</h2>
    <table>
      <thead><tr><th>Medication</th><th>Dosage</th><th>Frequency</th><th>Duration</th><th>Status</th></tr></thead>
      <tbody>
        ${prescriptions.slice(0, 20).map(p => `<tr><td><strong>${p.medication_name}</strong></td><td>${p.dosage}</td><td>${p.frequency}</td><td>${p.duration}</td><td><span class="badge badge-${p.status}">${p.status.charAt(0).toUpperCase() + p.status.slice(1)}</span></td></tr>`).join("")}
      </tbody>
    </table>
  </div>` : ""}
  <div class="footer">DocMate – The Doctor's Ally · Report generated on ${now}</div>
</body>
</html>`;

  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `DocMate_Patient_Report_${new Date().toISOString().slice(0, 10)}.html`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Modal + FormField ───────────────────────────────────────────────────────
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <h3 className="font-semibold text-gray-100">{title}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300 transition-colors"><X size={20} /></button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-400 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function Patients() {
  const navigate = useNavigate();

  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"list" | "history">("list");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [historyTab, setHistoryTab] = useState<"appointments" | "prescriptions">("appointments");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [patientForm, setPatientForm] = useState(emptyPatient());
  const [editingPatientId, setEditingPatientId] = useState<string | null>(null);
  const [appointmentForm, setAppointmentForm] = useState<Appointment>(emptyAppointment(""));
  const [editingAppointmentId, setEditingAppointmentId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);

  const [allAppointments, setAllAppointments] = useState<Appointment[]>([]);
  const [allPrescriptions, setAllPrescriptions] = useState<Prescription[]>([]);

  useEffect(() => { fetchPatients(); fetchAllForReport(); }, []);

  const fetchPatients = async () => {
    setLoading(true);
    const { data } = await supabase.from("patients").select("*").order("created_at", { ascending: false });
    setPatients(data ?? []);
    setLoading(false);
  };

  const fetchAllForReport = async () => {
    const [{ data: a }, { data: p }] = await Promise.all([
      supabase.from("appointments").select("*"),
      supabase.from("prescriptions").select("*"),
    ]);
    setAllAppointments(a ?? []);
    setAllPrescriptions(p ?? []);
  };

  const fetchHistory = async (patientId: string) => {
    const [{ data: a }, { data: p }] = await Promise.all([
      supabase.from("appointments").select("*").eq("patient_id", patientId).order("appointment_date", { ascending: false }),
      supabase.from("prescriptions").select("*").eq("patient_id", patientId).order("created_at", { ascending: false }),
    ]);
    setAppointments(a ?? []);
    setPrescriptions(p ?? []);
  };

  const openHistory = (p: Patient) => {
    setSelectedPatient(p);
    setHistoryTab("appointments");
    fetchHistory(p.id);
    setView("history");
  };

  // ── Patient CRUD ──
  const openAddPatient = () => { setPatientForm(emptyPatient()); setEditingPatientId(null); setShowPatientModal(true); };
  const openEditPatient = (p: Patient) => { setPatientForm({ name: p.name, age: p.age, gender: p.gender, disease: p.disease, phone: p.phone }); setEditingPatientId(p.id); setShowPatientModal(true); };
  const savePatient = async () => {
    if (!patientForm.name || !patientForm.age || !patientForm.gender || !patientForm.disease || !patientForm.phone) { alert("Please fill in all fields."); return; }
    setSaving(true);
    if (editingPatientId) { await supabase.from("patients").update(patientForm).eq("id", editingPatientId); }
    else { await supabase.from("patients").insert([patientForm]); }
    setSaving(false); setShowPatientModal(false); fetchPatients();
  };
  const deletePatient = async (id: string) => {
    if (!confirm("Delete this patient? All related records will also be removed.")) return;
    await supabase.from("patients").delete().eq("id", id); fetchPatients();
  };

  // ── Appointment CRUD ──
  const openAddAppointment = () => { setAppointmentForm(emptyAppointment(selectedPatient!.id)); setEditingAppointmentId(null); setShowAppointmentModal(true); };
  const openEditAppointment = (a: Appointment) => { setAppointmentForm({ ...a }); setEditingAppointmentId(a.id!); setShowAppointmentModal(true); };
  const saveAppointment = async () => {
    if (!appointmentForm.appointment_date || !appointmentForm.appointment_type || !appointmentForm.doctor_name) { alert("Fill in date, type and doctor name."); return; }
    setSaving(true);
    if (editingAppointmentId) { const { id, ...rest } = appointmentForm; await supabase.from("appointments").update(rest).eq("id", editingAppointmentId); }
    else { await supabase.from("appointments").insert([appointmentForm]); }
    setSaving(false); setShowAppointmentModal(false); fetchHistory(selectedPatient!.id); fetchAllForReport();
  };
  const deleteAppointment = async (id: string) => {
    if (!confirm("Delete this appointment?")) return;
    await supabase.from("appointments").delete().eq("id", id); fetchHistory(selectedPatient!.id);
  };

  // ── Prescription: navigate to AI Prescriptions page with patient pre-selected ──
  const openAddPrescription = () => {
    if (!selectedPatient) return;
    navigate("/prescriptions", {
      state: {
        preselectedPatient: {
          id: selectedPatient.id,
          name: selectedPatient.name,
          age: selectedPatient.age,
          gender: selectedPatient.gender,
        },
      },
    });
  };

  // ── Prescription edit/delete still happens inline ──
  const deletePrescription = async (id: string) => {
    if (!confirm("Delete this prescription?")) return;
    await supabase.from("prescriptions").delete().eq("id", id); fetchHistory(selectedPatient!.id);
  };

  // ── Report ──
  const handleGenerateReport = async () => {
    setGeneratingReport(true);
    await fetchAllForReport();
    generateReport(patients, allAppointments, allPrescriptions);
    setGeneratingReport(false);
  };

  const filtered = patients.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  // ─── History View ────────────────────────────────────────────────────────────
  if (view === "history" && selectedPatient) {
    return (
      <div className="p-6 min-h-screen bg-gray-950 text-gray-100">
        <button onClick={() => setView("list")} className="flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors text-sm">
          <ChevronLeft size={16} /> Back to Patients
        </button>

        {/* Patient card */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex flex-wrap gap-6 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-xl font-bold flex-shrink-0">
              {selectedPatient.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-semibold">{selectedPatient.name}</h2>
              <p className="text-gray-400 text-sm">Patient Record</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-5 text-sm mt-1">
            <div className="flex items-center gap-2 text-gray-300"><User size={14} className="text-gray-500" />{selectedPatient.age} yrs · {selectedPatient.gender}</div>
            <div className="flex items-center gap-2 text-gray-300"><Activity size={14} className="text-gray-500" />{selectedPatient.disease}</div>
            <div className="flex items-center gap-2 text-gray-300"><Phone size={14} className="text-gray-500" />{selectedPatient.phone}</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {(["appointments", "prescriptions"] as const).map(tab => (
            <button key={tab} onClick={() => setHistoryTab(tab)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${historyTab === tab ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-400 hover:text-white"}`}>
              {tab === "appointments" ? <><Calendar size={14} />Appointments ({appointments.length})</> : <><Pill size={14} />Prescriptions ({prescriptions.length})</>}
            </button>
          ))}
        </div>

        {/* Appointments */}
        {historyTab === "appointments" && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Appointments</h3>
              <button onClick={openAddAppointment} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"><Plus size={15} />Add Appointment</button>
            </div>
            {appointments.length === 0 ? (
              <div className="text-center py-16 text-gray-500"><Calendar size={36} className="mx-auto mb-3 opacity-30" /><p>No appointments yet.</p></div>
            ) : (
              <div className="space-y-3">
                {appointments.map(a => (
                  <div key={a.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex justify-between items-start gap-4">
                    <div className="flex gap-4">
                      <div className="w-10 h-10 rounded-lg bg-blue-600/20 border border-blue-600/30 flex items-center justify-center flex-shrink-0"><Calendar size={17} className="text-blue-400" /></div>
                      <div>
                        <p className="font-medium">{a.appointment_type}</p>
                        <p className="text-sm text-gray-400">Dr. {a.doctor_name}</p>
                        <p className="text-xs text-gray-500 mt-1"><Clock size={11} className="inline mr-1" />{new Date(a.appointment_date).toLocaleString()}</p>
                        {a.notes && <p className="text-xs text-gray-500 mt-1">{a.notes}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <StatusBadge status={a.status} />
                      <button onClick={() => openEditAppointment(a)} className="p-1.5 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"><Edit2 size={14} /></button>
                      <button onClick={() => deleteAppointment(a.id!)} className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"><Trash2 size={14} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Prescriptions */}
        {historyTab === "prescriptions" && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Prescriptions</h3>
              {/* ✅ This now redirects to AI Prescriptions page with patient pre-selected */}
              <button
                onClick={openAddPrescription}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
              >
                <Plus size={15} />Add Prescription
              </button>
            </div>
            {prescriptions.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <Pill size={36} className="mx-auto mb-3 opacity-30" />
                <p className="mb-3">No prescriptions yet.</p>
                <button
                  onClick={openAddPrescription}
                  className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                >
                  <Plus size={15} />Create AI Prescription
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {prescriptions.map(p => (
                  <div key={p.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex justify-between items-start gap-4">
                    <div className="flex gap-4">
                      <div className="w-10 h-10 rounded-lg bg-emerald-600/20 border border-emerald-600/30 flex items-center justify-center flex-shrink-0"><Pill size={17} className="text-emerald-400" /></div>
                      <div>
                        <p className="font-medium">{p.medication_name}</p>
                        <p className="text-sm text-gray-400">{p.dosage} · {p.frequency}</p>
                        <p className="text-xs text-gray-500 mt-1">Duration: {p.duration}</p>
                        {p.notes && <p className="text-xs text-gray-500 mt-1">{p.notes}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <StatusBadge status={p.status} />
                      <button onClick={() => deletePrescription(p.id!)} className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"><Trash2 size={14} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Appointment Modal */}
        {showAppointmentModal && (
          <Modal title={editingAppointmentId ? "Edit Appointment" : "Add Appointment"} onClose={() => setShowAppointmentModal(false)}>
            <div className="space-y-4">
              <FormField label="Date & Time"><input type="datetime-local" value={appointmentForm.appointment_date} onChange={e => setAppointmentForm({ ...appointmentForm, appointment_date: e.target.value })} className="input-field" /></FormField>
              <FormField label="Type">
                <select value={appointmentForm.appointment_type} onChange={e => setAppointmentForm({ ...appointmentForm, appointment_type: e.target.value })} className="input-field">
                  <option value="">Select type</option>
                  {["Consultation", "Follow-up", "Emergency", "Routine Check-up", "Lab Test", "Surgery"].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </FormField>
              <FormField label="Doctor Name"><input type="text" placeholder="Dr. Name" value={appointmentForm.doctor_name} onChange={e => setAppointmentForm({ ...appointmentForm, doctor_name: e.target.value })} className="input-field" /></FormField>
              <FormField label="Status">
                <select value={appointmentForm.status} onChange={e => setAppointmentForm({ ...appointmentForm, status: e.target.value })} className="input-field">
                  <option value="scheduled">Scheduled</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </FormField>
              <FormField label="Notes (optional)"><textarea rows={3} value={appointmentForm.notes} onChange={e => setAppointmentForm({ ...appointmentForm, notes: e.target.value })} className="input-field resize-none" placeholder="Notes…" /></FormField>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowAppointmentModal(false)} className="flex-1 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm transition-colors">Cancel</button>
                <button onClick={saveAppointment} disabled={saving} className="flex-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors disabled:opacity-60">{saving ? "Saving…" : editingAppointmentId ? "Update" : "Save Appointment"}</button>
              </div>
            </div>
          </Modal>
        )}

        <style>{`.input-field{width:100%;background:#111827;border:1px solid #1f2937;border-radius:.5rem;padding:.5rem .75rem;color:#f3f4f6;font-size:.875rem;outline:none;transition:border-color .15s}.input-field:focus{border-color:#3b82f6}.input-field option{background:#111827}`}</style>
      </div>
    );
  }

  // ─── List View ───────────────────────────────────────────────────────────────
  return (
    <div className="p-6 min-h-screen bg-gray-950 text-gray-100">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Patient Management</h1>
        <p className="text-gray-400 mt-1">Manage patient records, view medical history and track treatment progress.</p>
      </div>

      {/* Search + Add */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input type="text" placeholder="Search patients by name…" value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500 text-sm" />
        </div>
        <button onClick={openAddPatient} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors">
          <Plus size={16} /> Add Patient
        </button>
      </div>

      {/* Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div onClick={openAddPatient} className="bg-gray-900 border border-gray-800 hover:border-blue-600/50 rounded-xl p-5 cursor-pointer transition-all group">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-600/30 flex items-center justify-center group-hover:bg-blue-600/30 transition-colors"><Plus size={22} className="text-blue-400" /></div>
            <div><h3 className="font-semibold text-white">Add New Patient</h3><p className="text-sm text-gray-400">Register a new patient and create their medical profile.</p></div>
          </div>
        </div>
        <div onClick={handleGenerateReport} className="bg-gray-900 border border-purple-700/40 hover:border-purple-600/60 rounded-xl p-5 cursor-pointer transition-all group">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-600/20 border border-purple-600/30 flex items-center justify-center group-hover:bg-purple-600/30 transition-colors"><FileText size={22} className="text-purple-400" /></div>
            <div>
              <h3 className="font-semibold text-white">Patient Reports</h3>
              <p className="text-sm text-gray-400">{generatingReport ? "Generating report…" : "Generate comprehensive patient reports and summaries."}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-800">
          <h2 className="font-semibold text-gray-100">All Patients ({filtered.length})</h2>
        </div>
        {loading ? (
          <div className="text-center py-16 text-gray-500">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />Loading…
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-500"><User size={36} className="mx-auto mb-3 opacity-30" /><p>{search ? "No patients match your search." : "No patients yet."}</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-gray-500 text-xs uppercase tracking-wide">
                  <th className="text-left px-5 py-3">Name</th>
                  <th className="text-left px-5 py-3">Age</th>
                  <th className="text-left px-5 py-3">Gender</th>
                  <th className="text-left px-5 py-3">Disease</th>
                  <th className="text-left px-5 py-3">Phone</th>
                  <th className="text-left px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((patient, idx) => (
                  <tr key={patient.id} className={`border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors ${idx === filtered.length - 1 ? "border-b-0" : ""}`}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold flex-shrink-0">{patient.name.charAt(0).toUpperCase()}</div>
                        <span className="font-medium text-gray-100">{patient.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-gray-400">{patient.age}</td>
                    <td className="px-5 py-3 text-gray-400">{patient.gender}</td>
                    <td className="px-5 py-3"><span className="px-2 py-0.5 bg-orange-500/10 border border-orange-500/20 text-orange-400 rounded-full text-xs">{patient.disease}</span></td>
                    <td className="px-5 py-3 text-gray-400">{patient.phone}</td>
                    <td className="px-5 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => openHistory(patient)} className="flex items-center gap-1 px-2.5 py-1 bg-purple-600/10 hover:bg-purple-600/20 border border-purple-600/30 text-purple-400 rounded-lg text-xs transition-colors"><Clock size={11} />History</button>
                        <button onClick={() => openEditPatient(patient)} className="p-1.5 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"><Edit2 size={13} /></button>
                        <button onClick={() => deletePatient(patient.id)} className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Patient Modal */}
      {showPatientModal && (
        <Modal title={editingPatientId ? "Edit Patient" : "Add New Patient"} onClose={() => setShowPatientModal(false)}>
          <div className="space-y-4">
            <FormField label="Full Name"><input type="text" placeholder="Patient's full name" value={patientForm.name} onChange={e => setPatientForm({ ...patientForm, name: e.target.value })} className="input-field" /></FormField>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Age"><input type="number" placeholder="Age" value={patientForm.age || ""} onChange={e => setPatientForm({ ...patientForm, age: parseInt(e.target.value) })} className="input-field" /></FormField>
              <FormField label="Gender">
                <select value={patientForm.gender} onChange={e => setPatientForm({ ...patientForm, gender: e.target.value })} className="input-field">
                  <option value="">Select</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </FormField>
            </div>
            <FormField label="Disease / Condition"><input type="text" placeholder="e.g. Diabetes, Fever…" value={patientForm.disease} onChange={e => setPatientForm({ ...patientForm, disease: e.target.value })} className="input-field" /></FormField>
            <FormField label="Phone Number"><input type="tel" placeholder="10-digit phone number" value={patientForm.phone} onChange={e => setPatientForm({ ...patientForm, phone: e.target.value })} className="input-field" /></FormField>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowPatientModal(false)} className="flex-1 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm transition-colors">Cancel</button>
              <button onClick={savePatient} disabled={saving} className="flex-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors disabled:opacity-60">{saving ? "Saving…" : editingPatientId ? "Update Patient" : "Save Patient"}</button>
            </div>
          </div>
        </Modal>
      )}

      <style>{`.input-field{width:100%;background:#111827;border:1px solid #1f2937;border-radius:.5rem;padding:.5rem .75rem;color:#f3f4f6;font-size:.875rem;outline:none;transition:border-color .15s}.input-field:focus{border-color:#3b82f6}.input-field option{background:#111827}`}</style>
    </div>
  );
}