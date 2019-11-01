const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

let Schema = mongoose.Schema;

let validState = {
    values: ['CONFIRMED', 'RESERVED', 'CANCELED'],
    message: '{VALUE} no es un rol valido'
}

let reservationSchema = new Schema({
    place_id: { type: Schema.Types.ObjectId, ref: 'Place' },
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    field_id: { type: Schema.Types.ObjectId, ref: 'Field' },
    state: {
        type: String,
        enum: validState,
        default: 'RESERVED'
    },
    from: { type: Date },
    to: { type: Date },
    update: { type: Date }
});

// fieldsSchema.plugin(uniqueValidator, { message: 'El {PATH} ya se encuentra en uso' });
module.exports = mongoose.model('Reservation', reservationSchema);