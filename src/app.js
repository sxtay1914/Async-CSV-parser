import express from "express";
import importRouter from "./routes/uploadHandler.js";
import customerRouter from "./routes/customer.js";

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Server is running!");
});

app.use("/api/import", importRouter);
app.use("/api/customers", customerRouter);

export default app;
