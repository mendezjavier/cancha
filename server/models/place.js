const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

let Schema = mongoose.Schema;
var hoursSchema = mongoose.Schema({
    start: { type: Number },
    end: { type: Number }
}, { _id: false });

let placesSchema = new Schema({
    available: {
        type: Boolean,
        default: true
    },
    name: {
        type: String,
        required: [true, 'El nombre es necesario']
    },
    description: {
        type: String
    },
    email: {
        type: String
    },
    rating: {
        type: Number,
        default: 0
    },
    street: {
        type: String
    },
    city: {
        type: String
    },
    state: {
        type: String
    },
    telephone: {
        type: String
    },
    postCode: {
        type: String
    },
    country: {
        type: String
    },
    types: [String],
    sports: [String],
    images: [String],
    opening: {
        mon: { open: { type: Boolean, default: false }, hours: [hoursSchema] },
        tue: { open: { type: Boolean, default: false }, hours: [hoursSchema] },
        wed: { open: { type: Boolean, default: false }, hours: [hoursSchema] },
        thu: { open: { type: Boolean, default: false }, hours: [hoursSchema] },
        fri: { open: { type: Boolean, default: false }, hours: [hoursSchema] },
        sat: { open: { type: Boolean, default: false }, hours: [hoursSchema] },
        sun: { open: { type: Boolean, default: false }, hours: [hoursSchema] }
    },
    loc: {
        type: { type: String },
        coordinates: [Number]
    },
    created_by: { type: Schema.Types.ObjectId, ref: 'User' },
    created_at: { type: Date }
});


module.exports = mongoose.model('Place', placesSchema);


// MONGO SHELL - COMANDOS PARA CREAR UN INDEX 2dsphere para usar el aggregate
// > use canchas-app
// switched to db canchas-app

// > show collections

// > db.places.createIndex( { loc : "2dsphere" } )