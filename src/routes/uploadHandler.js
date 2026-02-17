import express from "express";
import multer from "multer";
import mongoose from "mongoose";
import path from "path";
import { addImportJob } from "../queues/importQueue.js";
import { ImportJob } from "../models/importJobModel.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post("/", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      error: "No file uploaded",
      details: "Provide multipart form field 'file' with a CSV file.",
    });
  }
  // create import job before queue so we have the job ID to pass to worker
  const importJob = await ImportJob.create({status: "pending"});
  // Add job to queue using a container-friendly path
  const filename = path.basename(req.file.path);
  const normalizedPath = path.posix.join("uploads", filename);
  await addImportJob(normalizedPath, importJob._id.toString());

  res.status(202).json({ 
    message: "File uploaded and job added to queue", jobId: importJob._id 
    });
});

// Endpoint to get import job status and details
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      error: "Invalid job ID",
      details: "Expected a 24-character hex string.",
    });
  }

  try {
    const importJob = await ImportJob.findById(id);
    if (!importJob) {
      return res.status(404).json({ error: "Import job not found" });
    }

    return res.status(200).json(importJob);
  } catch (error) {
    return res.status(500).json({
      error: "Failed to fetch import job",
      details: error.message,
    });
  }
});


export default router;