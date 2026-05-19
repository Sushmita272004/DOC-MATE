import MainLayout from "@/components/layout/MainLayout";
import { useState } from "react";

const Prescriptions = () => {
  const [title, setTitle] = useState("Mr");
  const [age, setAge] = useState("25");
  const [gender, setGender] = useState("Male");
  const [symptoms, setSymptoms] = useState("");
  const [medicalHistory, setMedicalHistory] = useState("");
  const [generatedPrescription, setGeneratedPrescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGeneratePrescription = async () => {
    setIsLoading(true);
    setError(null);
    setGeneratedPrescription(""); // Clear previous prescription

    try {
      const response = await fetch('http://localhost:5000/api/ai/generate-prescription', { // Assuming backend runs on port 5000
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ symptoms, medicalHistory }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate prescription');
      }

      const data = await response.json();
      setGeneratedPrescription(data.prescription);

    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-xl p-6 border border-cyan-400 border-opacity-20">
          <h1 className="text-3xl font-bold text-white mb-2">AI Prescriptions</h1>
          <p className="text-gray-300">
            Generate AI-powered prescriptions based on patient symptoms and medical history.
          </p>
        </div>

        {/* 2x2 Grid Top Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Create New Prescription */}
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
                {isLoading ? 'Generating...' : 'Generate AI Prescription'}
              </button>
            </div>
          </div>

          {/* Generated Prescription */} 
          <div className="bg-gray-900 border border-cyan-700 rounded-xl p-6 h-[600px] flex flex-col">
            <h4 className="text-xl font-semibold text-white mb-3">AI Generated Prescription</h4>
            {isLoading && (
              <div className="flex-grow flex items-center justify-center">
                <p className="text-cyan-400">Generating prescription, please wait...</p>
                {/* You can add a spinner icon here */}
              </div>
            )}
            {error && (
              <div className="flex-grow flex items-center justify-center">
                <p className="text-red-500">Error: {error}</p>
              </div>
            )}
            {!isLoading && !error && generatedPrescription && (
              <div className="flex-grow overflow-y-auto">
                <pre className="text-gray-300 whitespace-pre-wrap text-sm leading-relaxed">{generatedPrescription}</pre>
              </div>
            )}
            {!isLoading && !error && !generatedPrescription && (
              <p className="text-gray-400 text-sm flex-grow flex items-center justify-center">
                The AI-generated prescription will appear here once generated.
              </p>
            )}
          </div>
        </div>

        {/* Prescription Output by the Doctor - Full Width */}
        <div className="bg-gray-800 border border-cyan-600 border-opacity-30 rounded-xl p-6 shadow-md space-y-3 col-span-2 w-full">
          <h4 className="text-xl font-semibold text-white mb-3">Prescription (to be filled by the doctor)</h4>

          {/* Title */}
          <div>
            <label className="block text-gray-300 mb-1">Title</label>
            <select
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-md p-3 text-white"
            >
              <option>Master</option>
              <option>Miss</option>
              <option>Mr</option>
              <option>Mrs</option>
            </select>
          </div>

          {/* Name */}
          <div>
            <label className="block text-gray-300 mb-1">Patient Name</label>
            <textarea
              className="w-full bg-gray-900 border border-gray-700 rounded-md p-3 text-white"
              rows={1}
              placeholder="Enter patient name"
            />
          </div>

          {/* Age */}
          <div>
            <label className="block text-gray-300 mb-1">Age</label>
            <select
              value={age}
              onChange={(e) => setAge(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-md p-3 text-white"
            >
              {Array.from({ length: 100 }, (_, i) => (
                <option key={i + 1}>{i + 1}</option>
              ))}
            </select>
          </div>

          {/* Gender */}
          <div>
            <label className="block text-gray-300 mb-1">Gender</label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-md p-3 text-white"
            >
              <option>Male</option>
              <option>Female</option>
              <option>Other</option>
            </select>
          </div>

          {/* Doctor Fields */}
          {[
            { label: "Diagnosis", placeholder: "e.g., Type 2 Diabetes Mellitus" },
            { label: "Test/Surgery Suggested", placeholder: "e.g., CBC, MRI, or Appendectomy" }, // new field added here
            { label: "Medications", placeholder: "e.g., Metformin 500mg twice a day" },
            { label: "Dosage & Instructions", placeholder: "e.g., After meals, 12-hour gap" },
            { label: "Follow-up Advice", placeholder: "e.g., Review after 15 days with fasting sugar report" },
            { label: "Notes / Observations", placeholder: "e.g., Patient should avoid sugary food." }
          ].map((field, index) => (
            <div key={index}>
              <label className="block text-gray-300 mb-1">{field.label}</label>
              <textarea
                className="w-full bg-gray-900 border border-gray-700 rounded-md p-3 text-white"
                rows={2}
                placeholder={field.placeholder}
              />
            </div>
          ))}

          {/* Download PDF Button */}
          <div className="text-right mt-4">
            <button className="bg-cyan-600 hover:bg-cyan-700 text-white font-semibold py-2 px-6 rounded-lg">
              Download PDF
            </button>
          </div>
        </div>

        {/* Recent Prescriptions - Below */}
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-xl p-6 overflow-y-auto max-h-[500px]">
          <h3 className="text-xl font-semibold text-white mb-4">Recent Prescriptions</h3>
          <div className="space-y-3">
            {[
              { name: "John Smith", condition: "Hypertension Treatment", time: "2 hours ago" },
              { name: "Maria Garcia", condition: "Diabetes Management", time: "4 hours ago" },
              { name: "David Johnson", condition: "Antibiotic Therapy", time: "6 hours ago" },
            ].map((entry, index) => (
              <div key={index} className="bg-gray-800 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-white font-medium">{entry.name}</h4>
                    <p className="text-gray-400 text-sm">{entry.condition}</p>
                  </div>
                  <span className="text-xs text-cyan-400">{entry.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Prescriptions;
