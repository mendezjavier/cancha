const mongoose = require('mongoose');

let Schema = mongoose.Schema;

// "token": String,
//  "subscribed_on": Date,
//  "user_id": Integer,
//  "fingerprint": String,
//  "details": [
//    "browser" : String,
//    "os" : String,
//    "osVersion" : String,
//    "device" : String,
//    "deviceType" : String,
//    "deviceVendor" : String,
//    "cpu" : String
//  ]
let tokenSchema = new Schema({
    token: {
        type: String,
        unique: true,
        required: [true, 'TOKEN_MANDATORY']
    }
});

// tokenSchema.createIndex({ "token": 1 }, { unique: true });
// db.push_notifications.createIndex( { "subscribed_on": 1 }, { expireAfterSeconds: 604800 } )  
// db.push_notifications.createIndex({ user_id: 1 })  
// db.push_notifications.createIndex({ user_id: 1 } , { partialFilterExpression: { user_id: { $exists: true } } })  

module.exports = mongoose.model('Token', tokenSchema);