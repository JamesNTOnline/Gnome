const mongoose = require('mongoose');



async function connectDatabase(){
    try{
        await mongoose.connect('mongodb://localhost:27017/dankbot', {
            //options
        });
        console.log('connected to database');
    } catch (error){
        console.error('error connecting database:', error);
    }
}

module.exports = {connectDatabase};