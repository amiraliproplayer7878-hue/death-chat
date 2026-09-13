const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    sender: String,
    message: String,
    replyTo: {
        sender: String,
        message: String,
        _id: mongoose.Schema.Types.ObjectId
    },
    isEdited: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Message', messageSchema);
