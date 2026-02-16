import express from "express";
import dotenv from "dotenv";
import { connectDB } from "./config/database.js";
import importRouter from "./routes/uploadHandler.js";

dotenv.config();
// initialise app
const app = express();

// connect to database
connectDB();

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Server is running!");
});

app.use("/api/import", importRouter);


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
