import bullmq from "bullmq";
import { redisConnection } from "../config/redis.js";
import fs from "fs";
import csvParser from "csv-parser";
import { ImportJob } from "../models/importJobModel.js";
import { Customer } from "../models/customerModel.js";
import { validateCustomerRow } from "../utils/validation.js";


const { Worker } = bullmq;

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

        return new Promise((resolve, reject) => {
            // create stream object to read csv file
            const stream = fs.createReadStream(job.data.filePath).pipe(csvParser())
            

            stream.on("data", async (row) => {
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

    
                if (!isValid) {
                    importJob.failedCount++;
                    importJob.rejectedRecords.push({
                        row: rowNumber,
                        data: row,
                        errors,
                    });
                } else {
                    try{
                        // if no errors, save the customer data
                        const customer = new Customer(
                            parsedRow
                        );
                        await customer.save();
                        importJob.successCount++;
                    }catch(dberr){
                        // catch db error and store in error
                        importJob.failedCount++;
                        importJob.rejectedRecords.push({
                            row: rowNumber,
                            data: row,
                            errors: [dberr.message],
                        });
                    }
                }
                rowNumber++;
            });

            stream.on("end", async () => {
                // update import job status and counts
                importJob.status = "completed";
                await importJob.save();
                resolve(importJob);
            });

            stream.on("error", async (err) => {
                // update import job status to failed
                importJob.status = "failed";
                importJob.failedCount++;
                importJob.rejectedRecords.push({
                    row: rowNumber,
                    data: {},
                    errors: [err.message],
                });
                importJob.save();
                reject(err);
            });
        });
    }, { connection: redisConnection }
);

worker.on("completed", (job) => {
  console.log("Worker completed job:", job.id);
});

worker.on("failed", (job, error) => {
  console.error("Worker failed:", error);
});

