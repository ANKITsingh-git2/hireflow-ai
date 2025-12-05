import mongoose from "mongoose";

const InterviewSchema = new mongoose.Schema({
    candidateId: { type: String, required: true },
    candidateName: { type: String, default: "Anonymous" },
    date: { type: Date, default: Date.now },
    message: [{
        role: { type: String, enum: ['user', 'ai', 'system'] },
        content: String,
        timeStamp: {type:Date, default: Date.now}
    }],

    // ai generated report
    feedback: {
        technicalScore: Number, // 0-100
        communicationScore: Number, // 0-100
        summary: String,
        strengths: [String],
        weakness: [String],
        verdict: {type:String, enum:['Hire', 'No Hire', 'Review']}
    }
})

export const Interview = mongoose.model("Interview", InterviewSchema)