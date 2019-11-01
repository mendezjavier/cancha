const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

let Schema = mongoose.Schema;

let placesSchema = new Schema({
    available: {
        type: Boolean,
        default: true
    },
    loc: {
        type: { type: String },
        coordinates: [Number]
    },
    created_at: { type: Date },
    user: { type: Schema.Types.ObjectId, ref: 'User' }
});


//placesSchema.index({ "loc": "2dsphere" });

module.exports = mongoose.model('Place', placesSchema);


// MONGO SHELL - COMANDOS PARA CREAR UN INDEX 2dsphere para usar el aggregate
// use parking-app
// switched to db parking-app
// > show collections
// estacionamientos
// places
// system.indexes
// usuarios
// > db.places.createIndex( { loc : "2dsphere" } )