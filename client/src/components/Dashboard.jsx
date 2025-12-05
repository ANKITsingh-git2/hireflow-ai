import { useEffect, useState } from "react";
import api from "../lib/api";
import { Loader2, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";

export default function Dashboard() {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get("/api/interviews");
        setInterviews(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin"/></div>;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Candidate Database</h1>
      
      <div className="grid gap-4">
        {interviews.map((interview) => (
          <div key={interview._id} className="p-6 border border-border bg-card rounded-xl shadow-sm hover:shadow-md transition-shadow flex justify-between items-center">
            
            {/* Info */}
            <div>
              <h3 className="font-bold text-lg">{interview.candidateName}</h3>
              <p className="text-sm text-muted-foreground">{new Date(interview.date).toLocaleDateString()}</p>
              <div className="mt-2 flex gap-2">
                {interview.feedback.verdict === "Hire" && <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-bold">HIRE</span>}
                {interview.feedback.verdict === "No Hire" && <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full font-bold">REJECT</span>}
              </div>
            </div>

            {/* Scores */}
            <div className="flex gap-8 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">{interview.feedback.technicalScore}</div>
                <div className="text-xs text-muted-foreground">Tech Score</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">{interview.feedback.communicationScore}</div>
                <div className="text-xs text-muted-foreground">Comm Score</div>
              </div>
            </div>

            {/* Actions */}
            <button className="text-sm text-primary hover:underline">View Transcript</button>
          </div>
        ))}
      </div>
    </div>
  );
}