import { useEffect, useState } from "react";
import api from "../lib/api";
import { Loader2, TrendingUp, AlertTriangle, CheckCircle, XCircle, UserCheck } from "lucide-react";
import StatsChart from "./StatsChart";
import { supabase } from "../lib/supabase";

export default function Dashboard() {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get current session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          console.error("No active session");
          setLoading(false);
          return;
        }

        // Use Supabase JWT token for API authentication
        const token = session.access_token;
        
        const res = await api.get("/api/interviews", {
          headers: {
            Authorization: `Bearer ${token}`,
          }
        });
        setInterviews(res.data);
      } catch (err) {
        console.error("Access denied error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-10">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading Analytics...</p>
        </div>
      </div>
    );
  }

  // Calculate Stats
  const totalCandidates = interviews.length;
  const hiredCandidates = interviews.filter(i => i.feedback?.verdict === 'Hire').length;
  const rejectionRate = totalCandidates > 0 
    ? Math.round((interviews.filter(i => i.feedback?.verdict === 'No Hire').length / totalCandidates) * 100) 
    : 0;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      {/* 1. Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">HR Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Real-time insights and candidate performance metrics.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-muted/50 px-4 py-2 rounded-lg border border-border">
          <TrendingUp className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">{totalCandidates} Total Screenings</span>
        </div>
      </div>

      {/* 2. Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Chart (Takes up 2 columns) */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl shadow-sm p-1">
          <StatsChart data={interviews} />
        </div>

        {/* Quick Stats Cards (Takes up 1 column) */}
        <div className="space-y-4">
          
          {/* Hired Card */}
          <div className="p-6 bg-green-50/50 dark:bg-green-900/10 border border-green-100 dark:border-green-900 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-green-600 dark:text-green-400 text-sm font-bold uppercase tracking-wider">Total Hired</p>
              <p className="text-4xl font-extrabold text-green-700 dark:text-green-300 mt-2">{hiredCandidates}</p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
              <UserCheck className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>

          {/* Rejection Rate Card */}
          <div className="p-6 bg-red-50/50 dark:bg-red-900/10 border border-red-100 dark:border-red-900 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-red-600 dark:text-red-400 text-sm font-bold uppercase tracking-wider">Rejection Rate</p>
              <p className="text-4xl font-extrabold text-red-700 dark:text-red-300 mt-2">{rejectionRate}%</p>
            </div>
            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
              <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
          </div>

        </div>
      </div>

      {/* 3. Recent Candidates List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          Recent Interviews
        </h2>
        
        <div className="grid gap-4">
          {interviews.length === 0 ? (
            <div className="text-center p-10 border border-dashed border-border rounded-xl text-muted-foreground">
              No interviews conducted yet.
            </div>
          ) : (
            interviews.map((interview) => (
              <div 
                key={interview._id} 
                className="group p-5 border border-border bg-card rounded-xl shadow-sm hover:shadow-md transition-all hover:border-primary/20 flex flex-col md:flex-row justify-between md:items-center gap-4"
              >
                
                {/* Candidate Info */}
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold
                    ${interview.feedback?.verdict === "Hire" ? "bg-green-100 text-green-700" : 
                      interview.feedback?.verdict === "No Hire" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}
                  `}>
                    {interview.candidateName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-foreground">{interview.candidateName}</h3>
                    <p className="text-xs text-muted-foreground flex items-center gap-2">
                      {new Date(interview.date).toLocaleDateString()} • {new Date(interview.date).toLocaleTimeString()}
                    </p>
                    
                    {/* Verdict Badge Mobile */}
                    <div className="md:hidden mt-2">
                         {interview.feedback?.verdict === "Hire" && <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"><CheckCircle className="w-3 h-3"/> HIRE</span>}
                         {interview.feedback?.verdict === "No Hire" && <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"><XCircle className="w-3 h-3"/> REJECT</span>}
                    </div>
                  </div>
                </div>

                {/* Scores */}
                <div className="flex items-center gap-8 border-t md:border-t-0 pt-4 md:pt-0 border-border">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{interview.feedback?.technicalScore || 0}</div>
                    <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Tech</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{interview.feedback?.communicationScore || 0}</div>
                    <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Comm</div>
                  </div>
                  
                  {/* Verdict Badge Desktop */}
                  <div className="hidden md:block min-w-[100px] text-right">
                    {interview.feedback?.verdict === "Hire" && 
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 text-sm font-bold rounded-full border border-green-200">
                        <CheckCircle className="w-4 h-4" /> HIRE
                      </span>
                    }
                    {interview.feedback?.verdict === "No Hire" && 
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-700 text-sm font-bold rounded-full border border-red-200">
                        <XCircle className="w-4 h-4" /> REJECT
                      </span>
                    }
                     {(!interview.feedback?.verdict || interview.feedback?.verdict === "Review") && 
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-yellow-50 text-yellow-700 text-sm font-bold rounded-full border border-yellow-200">
                        <AlertTriangle className="w-4 h-4" /> REVIEW
                      </span>
                    }
                  </div>
                </div>

              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}