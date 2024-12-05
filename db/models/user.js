const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    discordId: { type: String, required: true, unique: true },
    roles: [String],
    score: { type: Number, default: 0 },
}, { _id: false });  //don't need mongo's default id, using the user's actual ID

userSchema.index({discordId:1}); //always searching for a unique id so keep it indexed for faster query
const User = mongoose.model('User', userSchema);

module.exports = User;