const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true }, // هش شده ذخیره میشه
    role: { type: String, enum: ['owner', 'staff', 'user'], default: 'user' }
});

module.exports = mongoose.model('User', userSchema);
