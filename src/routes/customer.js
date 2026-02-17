import express from "express";
import mongoose from "mongoose";
import { Customer } from "../models/customerModel.js";
import { validateCustomerPatch } from "../utils/validationPatch.js";

const router = express.Router();

// Endpoint to get all customers with pagination
router.get("/", async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    try {
        const customers = await Customer.find().skip(skip).limit(limit);
        const total = await Customer.countDocuments();  
        res.status(200).json({
            data: customers,
            total,
            page,
            limit
        });
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch customers" });
    }
});

// get customer by ID
router.get("/:id", async (req, res) => {
    const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      error: "Invalid customer ID",
      details: "Expected a 24-character hex string.",
    });
  }
    try {
        const customer = await Customer.findById(id);
        if (!customer) {
        return res.status(404).json({ error: "Customer not found" });
        }
        res.status(200).json(customer);
    } catch (error) {
        res.status(500).json({
          error: "Failed to fetch customer",
          details: error.message,
        });
    }
});

router.patch("/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        error: "Invalid customer ID",
        details: "Expected a 24-character hex string.",
      });
    }
    // validate the incoming data for the PATCH request
    const { isValid, errors, parsedData } =
      validateCustomerPatch(req.body);

    if (!isValid) {
      return res.status(400).json({
        error: "Validation failed",
        details: errors,
      });
    }

    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      parsedData,
      { new: true, runValidators: true }
    );

    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }

    res.json(customer);

  } catch (err) {
    res.status(500).json({
      error: "Failed to update customer",
      details: err.message,
    });
  }
});

// Endpoint to delete a customer by ID
router.delete("/:id", async (req, res) => {
    try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        error: "Invalid customer ID",
        details: "Expected a 24-character hex string.",
      });
    }
        const customer = await Customer.findByIdAndDelete(req.params.id);
        if (!customer) return res.status(404).json({ error: "Customer not found" });

        res.json({ message: "Deleted successfully" });
    } catch (err) {
        res.status(500).json({
          error: "Failed to delete customer",
          details: err.message,
        });
    }
}); 


export default router;