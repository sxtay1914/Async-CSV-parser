import mongoose from "mongoose";

// Customer schema
const customerSchema = new mongoose.Schema(
  {
    full_name: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^\S+@\S+\.\S+$/,
        "Please provide a valid email address",
      ],
    },

    date_of_birth: {
      type: Date,
      required: [true, "Date of birth is required"],
    },

    timezone: {
      type: String,
      required: [true, "Timezone is required"],
    },
  },
  {
    timestamps: true,
  }
);

export const Customer = mongoose.model("Customer", customerSchema);
