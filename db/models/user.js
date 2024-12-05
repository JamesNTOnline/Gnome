const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    discordId: { type: String, required: true, unique: true },
    roles: [String],
    score: { type: Number, default: 0 },
}, { _id: false });  //don't need the default id, using the user's actual ID


const User = mongoose.model('User', userSchema);

module.exports = User;