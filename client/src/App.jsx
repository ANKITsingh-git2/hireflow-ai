
import './App.css'

function App() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="p-10 border rounded-xl shadow-xl bg-card text-card-foreground">
        <h1 className="text-4xl font-bold text-primary mb-4">HireFlow.ai</h1>
        <p className="text-muted-foreground mb-6">
          System Status: <span className="text-green-500 font-bold">Online</span>
        </p>
        <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90">
          Start Interview
        </button>
      </div>
    </div>
  )
}

export default App