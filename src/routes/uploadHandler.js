import express from "express";
import multer from "multer";
import { addImportJob, importQueue} from "../queues/importQueue.js";
import { ImportJob } from "../models/importJobModel.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post("/", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }
  // create import job before queue so we have the job ID to pass to worker
  const importJob = await ImportJob.create({status: "pending"});
  // Add job to queue
  await addImportJob(req.file.path, importJob._id.toString());

  res.status(202).json({ 
    message: "File uploaded and job added to queue", jobId: importJob._id 
    });
});

export default router;