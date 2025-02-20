const mongoose = require("mongoose");

const logSchema = new mongoose.Schema({
    action: { type: String, required: true },
    endpoint: { type: String, required: true },
    method: { type: String, required: true },
    user: { type: String },
    requestData: { type: mongoose.Schema.Types.Mixed },
    responseData: { type: mongoose.Schema.Types.Mixed },
    statusCode: { type: Number, required: true },
    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.models.Log || mongoose.model("Log", logSchema);
