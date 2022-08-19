import mongoose from "mongoose";

const Applications = mongoose.model(
    "Applications",
    new mongoose.Schema(
        {
            name: {
                type: String,
                required: true
            },
            description: String,
            active: Boolean,
            logo: {
                type: String,
                required: true
            },
            createdBy: String,
        },
        { timestamps: true }
    )
);

export default Applications;