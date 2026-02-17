import bullmq from "bullmq";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import csvParser from "csv-parser";
import { redisConnection } from "../config/redis.js";
import { connectDB } from "../config/database.js";
import { ImportJob } from "../models/importJobModel.js";
import { Customer } from "../models/customerModel.js";
import { validateCustomerRow } from "../utils/validation.js";


dotenv.config();
await connectDB();

const { Worker } = bullmq;
const DEFAULT_BATCH_SIZE = 1000;
const BATCH_SIZE = Number.parseInt(process.env.IMPORT_BATCH_SIZE || "", 10) || DEFAULT_BATCH_SIZE;

// set up worker to process jobs from the importQueue
const worker = new Worker(
    "importQueue",
    async (job) => {
        // extract file path and jobID from job data
        const { importJobId, filePath } = job.data;


        // save to ImportJob schema
        const importJob = await ImportJob.findById(importJobId);
        if (!importJob) {
            throw new Error("Import job not found for ID: " + importJobId);
        }
        importJob.status = "processing";
        await importJob.save();

        // keep track of row number
        let rowNumber = 1;
        let batch = [];

        const normalizedPath = path.posix.normalize(
            filePath.replace(/\\/g, "/")
        );

        try {
            // Use csv parser to create stream to prevent race conditions
            const stream = fs.createReadStream(normalizedPath).pipe(csvParser());

            const flushBatch = async () => {
                if (batch.length === 0) return;

                const validDocs = [];
                const validMeta = [];

                // for each batch, perform validation on every rows
                for (const item of batch) {
                    if (item.errors.length > 0) {
                        importJob.failedCount++;
                        importJob.rejectedRecords.push({
                            row: item.rowNumber,
                            data: item.rawRow,
                            errors: item.errors,
                        });
                    } else {
                        validDocs.push(item.parsedRow);
                        validMeta.push(item);
                    }
                }
                
                // insert valid documents into the database in batch
                if (validDocs.length > 0) {
                    try {
                        await Customer.insertMany(validDocs, { ordered: false });
                        importJob.successCount += validDocs.length;
                    } catch (dbErr) {
                        // Handle database insertion errors, including duplicate key errors
                        if (Array.isArray(dbErr.writeErrors)) {
                            // collect indexes of failed inserts
                            const failedIndexes = new Set(
                                dbErr.writeErrors.map((writeErr) => writeErr.index)
                            );
                            const insertedCount = validDocs.length - failedIndexes.size;
                            importJob.successCount += insertedCount;

                            for (const writeErr of dbErr.writeErrors) {
                                const meta = validMeta[writeErr.index];
                                if (!meta) continue;
                                importJob.failedCount++;
                                importJob.rejectedRecords.push({
                                    row: meta.rowNumber,
                                    data: meta.rawRow,
                                    errors: [writeErr.errmsg || writeErr.message || dbErr.message],
                                });
                            }
                        }
                        // All rows in batch failed 
                        else {
                            for (const meta of validMeta) {
                                importJob.failedCount++;
                                importJob.rejectedRecords.push({
                                    row: meta.rowNumber,
                                    data: meta.rawRow,
                                    errors: [dbErr.message],
                                });
                            }
                        }
                    }
                }

                batch = [];
            };

            for await (const row of stream) {
                importJob.totalRecords++;

                /*
                validation rules:
                - name is required
                - email is required and must be valid email format
                - dateOfBirth is required and must be valid ISO 8601 date format
                - timezone is required and must be valid IANA time zone format
                */

                // validate the row data and collect any errors
                const { isValid, errors, parsedRow } = validateCustomerRow(row);

                batch.push({
                    rowNumber,
                    rawRow: row,
                    errors: isValid ? [] : errors,
                    parsedRow: isValid ? parsedRow : null,
                });

                if (batch.length >= BATCH_SIZE) {
                    await flushBatch();
                }

                rowNumber++;
            }

            await flushBatch();

            // update import job status and counts
            importJob.status = "completed";
            await importJob.save();
            return importJob;
        } catch (err) {
            // update import job status to failed
            importJob.status = "failed";
            importJob.failedCount++;
            importJob.rejectedRecords.push({
                row: rowNumber,
                data: {},
                errors: [err.message],
            });
            await importJob.save();
            throw err;
        }
    }, { connection: redisConnection }
);

worker.on("completed", (job) => {
  console.log("Worker completed job:", job.id);
});

worker.on("failed", (job, error) => {
  console.error("Worker failed:", error);
});

 