import MainLayout from "@/components/layout/MainLayout";
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import html2pdf from "html2pdf.js";
import { supabase } from "../lib/supabaseClient";
import { CheckCircle, AlertCircle } from "lucide-react";

interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
}

const Prescriptions = () => {
  const location = useLocation();
  const preselected = (location.state as any)?.preselectedPatient ?? null;

  const [title, setTitle] = useState("Mr");
  const [patientName, setPatientName] = useState("");
  const [age, setAge] = useState("25");
  const [gender, setGender] = useState("Male");

  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>("");

  const [symptoms, setSymptoms] = useState("");
  const [medicalHistory, setMedicalHistory] = useState("");
  const [generatedPrescription, setGeneratedPrescription] = useState("");

  const [diagnosis, setDiagnosis] = useState("");
  const [tests, setTests] = useState("");
  const [medications, setMedications] = useState("");
  const [dosage, setDosage] = useState("");
  const [followUp, setFollowUp] = useState("");
  const [notes, setNotes] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  // Fetch patients on mount
  useEffect(() => {
    const fetchPatients = async () => {
      const { data } = await supabase.from("patients").select("id, name, age, gender").order("name");
      if (data) {
        setPatients(data);

        // ✅ If redirected from Patient Management, auto-select that patient
        if (preselected) {
          const match = data.find((p: Patient) => p.id === preselected.id);
          if (match) {
            setSelectedPatientId(match.id);
            setPatientName(match.name);
            setAge(String(match.age));
            setGender(match.gender);
          } else {
            // Patient exists in DB but maybe name differs — still pre-fill
            setPatientName(preselected.name);
            setAge(String(preselected.age));
            setGender(preselected.gender);
          }
        }
      }
    };
    fetchPatients();
  }, []);

  const handlePatientSelect = (patientId: string) => {
    setSelectedPatientId(patientId);
    const patient = patients.find((p) => p.id === patientId);
    if (patient) {
      setPatientName(patient.name);
      setAge(String(patient.age));
      setGender(patient.gender);
    }
  };

  const handleGeneratePrescription = async () => {
    setIsLoading(true);
    setError(null);
    setGeneratedPrescription("");

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/ai/generate-prescription`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ symptoms, medicalHistory }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to generate prescription");

      const cleanedPrescription = data.prescription.replace(/\\n/g, "\n").replace(/\\"/g, '"').trim();
      setGeneratedPrescription(cleanedPrescription);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAutofill = () => {
    const extractSection = (startLabel: string, endLabel?: string) => {
      const startIndex = generatedPrescription.indexOf(startLabel);
      if (startIndex === -1) return "";
      const contentStart = startIndex + startLabel.length;
      let contentEnd = generatedPrescription.length;
      if (endLabel) {
        const endIndex = generatedPrescription.indexOf(endLabel);
        if (endIndex !== -1) contentEnd = endIndex;
      }
      return generatedPrescription.substring(contentStart, contentEnd).replace(/\n/g, " ").trim();
    };

    setDiagnosis(extractSection("1. Diagnosis:", "2. Test/Surgery Suggested:").split(".")[0]);
    setTests(extractSection("2. Test/Surgery Suggested:", "3. Medications:").split(".")[0]);
    setMedications(extractSection("3. Medications:", "4. Dosage and Instructions:").split(".")[0]);
    setDosage(extractSection("4. Dosage and Instructions:", "5. Follow-up advice:").split(".")[0]);
    setFollowUp(extractSection("5. Follow-up advice:", "6. Notes/Observations:").split(".")[0]);
    setNotes(extractSection("6. Notes/Observations:").split(".")[0]);
  };

  const saveToSupabase = async () => {
    if (!selectedPatientId && !patientName.trim()) return;

    setSaveStatus("saving");

    let finalPatientId = selectedPatientId;

    if (!selectedPatientId && patientName.trim()) {
      const { data: newPatient, error: createError } = await supabase
        .from("patients")
        .insert({
          name: patientName.trim(),
          age: parseInt(age) || null,
          gender: gender || null,
          disease: diagnosis ? diagnosis.split(".")[0].trim() : null,
          phone: null,
        })
        .select("id")
        .single();

      if (createError || !newPatient) {
        console.error("Patient create error:", createError);
        setSaveStatus("error");
        setTimeout(() => setSaveStatus("idle"), 3000);
        return;
      }

      finalPatientId = newPatient.id;

      const { data: refreshed } = await supabase.from("patients").select("id, name, age, gender").order("name");
      if (refreshed) setPatients(refreshed);
      setSelectedPatientId(finalPatientId);
    }

    const frequencyMatch = dosage.match(/(once|twice|three times|four times)[^,]*/i);
    const durationMatch = dosage.match(/for\s+([\w\s]+)/i);

    const { error: saveError } = await supabase.from("prescriptions").insert({
      patient_id: finalPatientId,
      medication_name: medications || "See notes",
      dosage: dosage || null,
      frequency: frequencyMatch ? frequencyMatch[0].trim() : null,
      duration: durationMatch ? durationMatch[1].trim() : null,
      notes: `Diagnosis: ${diagnosis}\nTests: ${tests}\nFollow-up: ${followUp}\nNotes: ${notes}`,
      status: "active",
    });

    if (saveError) {
      console.error("Save error:", saveError);
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } else {
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 3000);
    }
  };

  const handleDownloadPDF = async () => {
    await saveToSupabase();

    const pdfContentDiv = document.createElement("div");
    pdfContentDiv.style.padding = "40px";
    pdfContentDiv.style.width = "800px";
    pdfContentDiv.style.background = "white";
    document.body.appendChild(pdfContentDiv);

    const now = new Date();
    pdfContentDiv.innerHTML = `
      <div style="font-family: Arial; color: #111827;">
        <h1 style="text-align:center; color:#1e3a8a; margin-bottom:10px;">DocMate AI Prescription</h1>
        <hr />
        <div style="margin-top:20px; margin-bottom:20px;">
          <p><strong>Title:</strong> ${title}</p>
          <p><strong>Patient Name:</strong> ${patientName}</p>
          <p><strong>Age:</strong> ${age}</p>
          <p><strong>Gender:</strong> ${gender}</p>
          <p><strong>Date:</strong> ${now.toLocaleString("en-IN")}</p>
        </div>
        <hr />
        <div style="margin-top:25px;"><h3 style="color:#2563eb;">Diagnosis</h3><p>${diagnosis}</p></div>
        <div style="margin-top:25px;"><h3 style="color:#2563eb;">Test/Surgery Suggested</h3><p>${tests}</p></div>
        <div style="margin-top:25px;"><h3 style="color:#2563eb;">Medications</h3><p>${medications}</p></div>
        <div style="margin-top:25px;"><h3 style="color:#2563eb;">Dosage & Instructions</h3><p>${dosage}</p></div>
        <div style="margin-top:25px;"><h3 style="color:#2563eb;">Follow-up Advice</h3><p>${followUp}</p></div>
        <div style="margin-top:25px;"><h3 style="color:#2563eb;">Notes / Observations</h3><p>${notes}</p></div>
        <div style="margin-top:80px;"><p>______________________</p><p>Doctor Signature</p></div>
      </div>
    `;

    html2pdf()
      .from(pdfContentDiv)
      .save("Prescription.pdf")
      .then(() => { document.body.removeChild(pdfContentDiv); });
  };

  return (
    <MainLayout>
      <div className="space-y-6">

        {/* Header */}
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-xl p-6 border border-cyan-400 border-opacity-20">
          <h1 className="text-3xl font-bold text-white mb-2">AI Prescriptions</h1>
          <p className="text-gray-300">Generate AI-powered prescriptions based on patient symptoms and medical history.</p>
          {/* ✅ Banner when redirected from Patient Management */}
          {preselected && (
            <div className="mt-3 flex items-center gap-2 bg-cyan-900/30 border border-cyan-600/40 text-cyan-300 rounded-lg px-4 py-2 text-sm">
              <CheckCircle size={14} />
              Creating prescription for <strong className="ml-1">{preselected.name}</strong> — already linked to their patient record.
            </div>
          )}
        </div>

        {/* Top Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Left Side */}
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-xl p-6 h-[600px] flex flex-col">
            <h3 className="text-xl font-semibold text-white mb-4">Create New Prescription</h3>
            <div className="flex flex-col gap-4 flex-grow">
              <div className="flex-1 flex flex-col">
                <label className="block text-gray-300 mb-2">Patient Symptoms</label>
                <textarea
                  className="w-full flex-1 bg-gray-800 border border-gray-700 rounded-lg p-3 text-white resize-none"
                  placeholder="Describe patient symptoms..."
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className="flex-1 flex flex-col">
                <label className="block text-gray-300 mb-2">Medical History</label>
                <textarea
                  className="w-full flex-1 bg-gray-800 border border-gray-700 rounded-lg p-3 text-white resize-none"
                  placeholder="Relevant medical history..."
                  value={medicalHistory}
                  onChange={(e) => setMedicalHistory(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <button
                className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-6 py-3 rounded-lg hover:opacity-90 w-full disabled:opacity-50"
                onClick={handleGeneratePrescription}
                disabled={isLoading || !symptoms || !medicalHistory}
              >
                {isLoading ? "Generating..." : "Generate AI Prescription"}
              </button>
            </div>
          </div>

          {/* Right Side */}
          <div className="bg-gray-900 border border-cyan-700 rounded-xl p-6 h-[600px] flex flex-col">
            <h4 className="text-xl font-semibold text-white mb-3">AI Generated Prescription</h4>

            {!generatedPrescription && !isLoading && (
              <div className="flex-grow flex items-center justify-center">
                <div className="text-center">
                  <p className="text-gray-400 text-lg">Your AI prescription will appear here</p>
                  <p className="text-gray-500 text-sm mt-2">Enter symptoms and medical history to generate a prescription.</p>
                </div>
              </div>
            )}

            {isLoading && (
              <div className="flex-grow flex items-center justify-center">
                <p className="text-cyan-400">Generating prescription...</p>
              </div>
            )}

            {error && (
              <div className="flex-grow flex items-center justify-center">
                <p className="text-red-500">Error: {error}</p>
              </div>
            )}

            {!isLoading && !error && generatedPrescription && (
              <div className="flex-grow overflow-y-auto">
                <pre className="text-gray-200 whitespace-pre-wrap text-sm leading-8 font-medium tracking-wide">
                  {generatedPrescription}
                </pre>
                <button
                  onClick={handleAutofill}
                  className="mt-4 bg-cyan-500 hover:bg-cyan-600 text-white px-4 py-2 rounded-lg"
                >
                  Autofill Prescription Form
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Doctor Prescription Form */}
        <div className="bg-gray-800 border border-cyan-600 border-opacity-30 rounded-xl p-6 shadow-md space-y-4">
          <h4 className="text-xl font-semibold text-white mb-3">Prescription (Editable by Doctor)</h4>

          {/* Patient Selector */}
          <div className="bg-gray-900 border border-cyan-500 border-opacity-30 rounded-xl p-4 space-y-3">
            <p className="text-cyan-400 text-sm font-semibold uppercase tracking-wide">
              🔗 Link to Patient Record
            </p>
            <p className="text-gray-400 text-xs">
              Select a patient to automatically save this prescription to their record in Patient Management.
            </p>
            <select
              value={selectedPatientId}
              onChange={(e) => handlePatientSelect(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white outline-none focus:border-cyan-400"
            >
              <option value="">— Select Patient (optional) —</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} · Age {p.age} · {p.gender}
                </option>
              ))}
            </select>

            {selectedPatientId && (
              <div className="flex items-center gap-2 text-green-400 text-sm">
                <CheckCircle size={14} />
                Prescription will be saved to this patient's record when you download the PDF.
              </div>
            )}
            {!selectedPatientId && patientName.trim() && (
              <div className="flex items-center gap-2 text-yellow-400 text-sm">
                <AlertCircle size={14} />
                <span><strong>"{patientName}"</strong> will be created as a new patient and prescription saved to their record.</span>
              </div>
            )}
            {!selectedPatientId && !patientName.trim() && (
              <div className="flex items-center gap-2 text-gray-500 text-sm">
                <AlertCircle size={14} />
                No patient selected — fill in Patient Name below or select from the list.
              </div>
            )}
          </div>

          {/* Title */}
          <div>
            <label className="block text-gray-300 mb-1">Title</label>
            <select value={title} onChange={(e) => setTitle(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-md p-3 text-white">
              <option>Master</option>
              <option>Miss</option>
              <option>Mr</option>
              <option>Mrs</option>
            </select>
          </div>

          {/* Patient Name */}
          <div>
            <label className="block text-sm text-gray-300 mb-2">Patient Name</label>
            <input
              type="text"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              placeholder="Enter patient name"
              className="w-full bg-[#0B1220] border border-gray-700 rounded-lg px-4 py-3 text-white outline-none focus:border-cyan-400"
            />
          </div>

          {/* Age */}
          <div>
            <label className="block text-gray-300 mb-1">Age</label>
            <select value={age} onChange={(e) => setAge(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-md p-3 text-white">
              {Array.from({ length: 100 }, (_, i) => (<option key={i + 1}>{i + 1}</option>))}
            </select>
          </div>

          {/* Gender */}
          <div>
            <label className="block text-gray-300 mb-1">Gender</label>
            <select value={gender} onChange={(e) => setGender(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-md p-3 text-white">
              <option>Male</option>
              <option>Female</option>
              <option>Other</option>
            </select>
          </div>

          <div>
            <label className="block text-gray-300 mb-1">Diagnosis</label>
            <textarea value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-md p-3 text-white" rows={2} />
          </div>
          <div>
            <label className="block text-gray-300 mb-1">Test/Surgery Suggested</label>
            <textarea value={tests} onChange={(e) => setTests(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-md p-3 text-white" rows={2} />
          </div>
          <div>
            <label className="block text-gray-300 mb-1">Medications</label>
            <textarea value={medications} onChange={(e) => setMedications(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-md p-3 text-white" rows={2} />
          </div>
          <div>
            <label className="block text-gray-300 mb-1">Dosage & Instructions</label>
            <textarea value={dosage} onChange={(e) => setDosage(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-md p-3 text-white" rows={2} />
          </div>
          <div>
            <label className="block text-gray-300 mb-1">Follow-up Advice</label>
            <textarea value={followUp} onChange={(e) => setFollowUp(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-md p-3 text-white" rows={2} />
          </div>
          <div>
            <label className="block text-gray-300 mb-1">Notes / Observations</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-md p-3 text-white" rows={2} />
          </div>

          {saveStatus === "saved" && (
            <div className="flex items-center gap-2 bg-green-900/40 border border-green-600 text-green-400 rounded-lg px-4 py-3 text-sm">
              <CheckCircle size={16} />
              Prescription saved to patient record successfully!
            </div>
          )}
          {saveStatus === "error" && (
            <div className="flex items-center gap-2 bg-red-900/40 border border-red-600 text-red-400 rounded-lg px-4 py-3 text-sm">
              <AlertCircle size={16} />
              Failed to save prescription. Please check the patient selection and try again.
            </div>
          )}

          <div className="pt-2">
            <button
              onClick={handleDownloadPDF}
              disabled={saveStatus === "saving"}
              className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-6 py-3 rounded-lg"
            >
              {saveStatus === "saving" ? "Saving & Downloading..." : "Download Final Prescription PDF"}
            </button>
          </div>
        </div>

      </div>
    </MainLayout>
  );
};

export default Prescriptions;