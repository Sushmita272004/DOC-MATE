
import MainLayout from "@/components/layout/MainLayout";

const Patients = () => {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-xl p-6 border border-cyan-400 border-opacity-20">
          <h1 className="text-3xl font-bold text-white mb-2">Patient Management</h1>
          <p className="text-gray-300">Manage patient records, view medical history, and track treatment progress.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-xl p-6">
            <h3 className="text-xl font-semibold text-white mb-4">Search Patients</h3>
            <p className="text-gray-300 mb-4">Find patients by name, ID, or medical condition.</p>
            <button className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-4 py-2 rounded-lg hover:opacity-90">
              Search
            </button>
          </div>

          <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-xl p-6">
            <h3 className="text-xl font-semibold text-white mb-4">Add New Patient</h3>
            <p className="text-gray-300 mb-4">Register a new patient and create their medical profile.</p>
            <button className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 rounded-lg hover:opacity-90">
              Add Patient
            </button>
          </div>

          <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-xl p-6">
            <h3 className="text-xl font-semibold text-white mb-4">Patient Reports</h3>
            <p className="text-gray-300 mb-4">Generate comprehensive patient reports and summaries.</p>
            <button className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-lg hover:opacity-90">
              Generate
            </button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Patients;
