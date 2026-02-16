import mongoose from "mongoose";

// rejected schema
const rejectedSchema = new mongoose.Schema({
    row: Number,
    data: Object,
    errors: [String],
})

// import job schema
const importJobSchema = new mongoose.Schema({
    jobId: String,
    status: { 
        type: String, 
        enum: ["pending", "processing", "completed", "failed"], default: "pending" },
    totalRecords: { type: Number, default: 0 },
    successCount: { type: Number, default: 0 },
    failedCount: { type: Number, default: 0 },
    rejectedRecords: [rejectedSchema],
    }, 
    { timestamps: true }
);

export const ImportJob = mongoose.model("ImportJob", importJobSchema);