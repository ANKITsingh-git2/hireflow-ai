import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function StatsChart({ data }) {
  // Transform data for the chart
  const chartData = data.map(interview => ({
    name: interview.candidateName.split(" ")[0], // Just first name
    Technical: interview.feedback.technicalScore,
    Communication: interview.feedback.communicationScore
  }));

  return (
    <div className="h-[300px] w-full bg-white p-4 rounded-xl border border-border shadow-sm">
      <h3 className="text-sm font-bold text-gray-500 mb-4">Performance Overview</h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" tick={{fontSize: 12}} />
          <YAxis tick={{fontSize: 12}} />
          <Tooltip 
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
          />
          <Legend />
          <Bar dataKey="Technical" fill="#2563eb" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Communication" fill="#7c3aed" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}