import dotenv from "dotenv";
import { connectDB } from "./config/database.js";
import app from "./app.js";

dotenv.config();

// connect to database
connectDB();

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});

export default app; // Export the app for testing purposes
