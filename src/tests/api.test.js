import request from "supertest";
import app from "../app.js";
import mongoose from "mongoose";
import { redisConnection } from "../config/redis.js";

// Helper function to wait for a job to complete
async function waitForJobCompletion(jobId, app, timeout = 3000) {
  const start = Date.now();

  while (Date.now() - start < timeout) {
    const res = await request(app).get(`/api/import/${jobId}`);

    if (res.body.status === "completed") {
      return res.body;
    }

    await new Promise((r) => setTimeout(r, 200));
  }

  throw new Error("Job did not complete in time");
}

beforeAll(async () => {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
        throw new Error("MONGO_URI must be set for integration tests");
    }
    await mongoose.connect(mongoUri);
    // Clear Redis before tests
    await redisConnection.flushall(); 
    // clear Database before tests
    await mongoose.connection.db.dropDatabase();
});

afterAll(async () => {
    await mongoose.disconnect();
    await redisConnection.quit();
});

// Test the file upload endpoint
describe("CSV Upload API", () => {
    it("should upload a CSV file and create an import job", async () => {
        const csv = "full_name,email,date_of_birth,timezone\n" +
          "Alice Smith,alice@example.com,1990-01-01,UTC\n" +
          "Bad User,bademail,2025-12-12,Invalid/Zone\n";

        // Upload the CSV file
        const res = await request(app)
        .post("/api/import")
        .attach("file", Buffer.from(csv), "test.csv");

        // Check for successful response and jobID
        expect(res.statusCode).toBe(202);
        expect(res.body).toHaveProperty("jobId");

        
        // Fetch the import job details
        const jobRes = await waitForJobCompletion(res.body.jobId, app);
        expect(jobRes).toHaveProperty("status", "completed");
        expect(jobRes).toHaveProperty("totalRecords", 2);
        expect(jobRes).toHaveProperty("failedCount", 1);
        expect(jobRes.rejectedRecords.length).toBe(1);

        // Check that the valid customer was added to the database
        const customersRes = await request(app).get("/api/customers");
        expect(customersRes.statusCode).toBe(200);
        expect(customersRes.body.data.length).toBe(1);
        expect(customersRes.body.data[0]).toHaveProperty("full_name", "Alice Smith");
        expect(customersRes.body.data[0]).toHaveProperty("email", "alice@example.com");
        expect(customersRes.body.data[0]).toHaveProperty("date_of_birth", "1990-01-01T00:00:00.000Z");
        expect(customersRes.body.data[0]).toHaveProperty("timezone", "UTC");
    }
)});

// Customer CRUD Tests
describe("Customer API", () => {
    beforeEach(async () => {
        await redisConnection.flushall();
        await mongoose.connection.db.dropDatabase();
    });

    // test GET /api/customers with pagination
    it("should get customers with pagination", async () => {
        // create some customers for testing
        const importRes = await request(app).post("/api/import").attach("file", Buffer.from(
            "full_name,email,date_of_birth,timezone\n" +
            "Customer One,customer1@example.com,1990-01-01,UTC\n" +
            "Customer Two,customer2@example.com,1992-02-02,EST\n" +
            "Customer Three,customer3@example.com,1993-03-03,PST\n"
        ), "test.csv");

        await waitForJobCompletion(importRes.body.jobId, app);

        // with pagination
        const res = await request(app).get("/api/customers?page=1&limit=2");
        expect(res.statusCode).toBe(200);
        expect(res.body.data.length).toBe(2);
        expect(res.body).toHaveProperty("total", 3);
        expect(res.body).toHaveProperty("page", 1);
        expect(res.body).toHaveProperty("limit", 2);
    });

    it("should get a customer by ID", async () => {
        // create a customer for testing
        const importRes = await request(app).post("/api/import").attach("file", Buffer.from(
            "full_name,email,date_of_birth,timezone\n" +
            "Customer One,customer1@example.com,1990-01-01,UTC\n"
        ), "test.csv");

        // wait for worker to complete the job
        await waitForJobCompletion(importRes.body.jobId, app);

        // get the customer ID from the import response
        const customersRes = await request(app).get("/api/customers");
        expect(customersRes.statusCode).toBe(200);
        expect(customersRes.body.data.length).toBe(1);
        const customerId = customersRes.body.data[0]._id;

        // get customer by ID
        const res = await request(app).get(`/api/customers/${customerId}`);
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty("full_name", "Customer One");
        expect(res.body).toHaveProperty("email", "customer1@example.com");
        expect(res.body).toHaveProperty("date_of_birth", "1990-01-01T00:00:00.000Z");
        expect(res.body).toHaveProperty("timezone", "UTC");
    });

    // test PATCH /api/customers/:id
    it("should update a customer with PATCH", async () => {
        // create a customer for testing
        const importRes = await request(app).post("/api/import").attach("file", Buffer.from(
            "full_name,email,date_of_birth,timezone\n" +
            "Customer One,customer1@example.com,1990-01-01,UTC\n"
        ), "test.csv");
        
        await waitForJobCompletion(importRes.body.jobId, app);

        // get the customer ID from the import response
        const customersRes = await request(app).get("/api/customers");
        expect(customersRes.statusCode).toBe(200);
        expect(customersRes.body.data.length).toBe(1);
        const customerId = customersRes.body.data[0]._id;

        // update customer with PATCH
        const res = await request(app)
            .patch(`/api/customers/${customerId}`)
            .send({
                full_name: "Updated Customer One",
                email: "updatedcustomer1@example.com"
            });
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty("full_name", "Updated Customer One");
        expect(res.body).toHaveProperty("email", "updatedcustomer1@example.com");
    });

    // test PATCH with invalid data
    it("should return errors for invalid PATCH data", async () => {
        // create a customer for testing
        const importRes = await request(app).post("/api/import").attach("file", Buffer.from(
            "full_name,email,date_of_birth,timezone\n" +
            "Customer One,customer1@example.com,1990-01-01,UTC\n"
        ), "test.csv");
        
        await waitForJobCompletion(importRes.body.jobId, app);

        // get the customer ID from the import response
        const customersRes = await request(app).get("/api/customers");
        expect(customersRes.statusCode).toBe(200);
        expect(customersRes.body.data.length).toBe(1);
        const customerId = customersRes.body.data[0]._id;

        // update customer with PATCH and invalid data
        const res = await request(app)
            .patch(`/api/customers/${customerId}`)
            .send({
                full_name: "",
                email: "invalid-email"
            });
        expect(res.statusCode).toBe(400);
    });


    // test delete customer
    it("should delete a customer", async () => {
        // create a customer for testing
        const importRes = await request(app).post("/api/import").attach("file", Buffer.from(
            "full_name,email,date_of_birth,timezone\n" +
            "Customer One,customer1@example.com,1990-01-01,UTC\n"
        ), "test.csv");

        // wait for worker to complete the job
        await waitForJobCompletion(importRes.body.jobId, app);

        // get the customer ID from the import response
        const customersRes = await request(app).get("/api/customers");
        expect(customersRes.statusCode).toBe(200);
        expect(customersRes.body.data.length).toBe(1);
        const customerId = customersRes.body.data[0]._id;

        // delete customer
        const res = await request(app).delete(`/api/customers/${customerId}`);
        expect(res.statusCode).toBe(200);
        
        // check that customer is deleted
        const checkDeletedRes = await request(app).get(`/api/customers/${customerId}`);
        expect(checkDeletedRes.statusCode).toBe(404);
        
    });
});