const express = require('express');
const app = express();
const moment = require('moment');
const mongoose = require('mongoose');

const Place = require('../models/place');
const Field = require('../models/field');
const Reservation = require('../models/reservation');
// const ObjectId = require('mongoose').Types.ObjectId;

const { verificaToken, verificaAdminRol, verificaTokenUrl } = require('../middlewares/autenticacion');
app.get('/api/field/reservations', (req, res) => {
    Field.find({}).populate('reserved').exec((err, fields) => {
        return res.send({
            ok: true,
            message: 'CHECK_FIELD_OK',
            total: fields.length,
            fields
        });
    });

})

app.post('/api/place-availability', verificaToken, function(req, res) {
    let reservationState = ['CONFIRMED', 'RESERVED'];
    let body = req.body;
    let user_id = req.user_data._id;
    // console.log('date: ', moment().format('MM/DD/YYYY h:mm:ss'));
    // moment(new Date("2017/09/20 17:42:09")).format();
    //     "2017-09-20T17:42:09-03:00"
    let now = moment(new Date()).format();

    let from = moment(new Date(body.from)).format();
    let to = moment(new Date(body.to)).format();
    if (now > from || (!from || !to)) {
        return res.status(500).send({
            ok: false,
            message: 'CHECK_FIELD_OUT_DATE'
        });
    }
    let hours = moment.duration(moment(new Date(to)).diff(moment(new Date(from)))).asHours();
    // console.log(hours);
    if (hours < 1) {
        return res.status(400).send({
            ok: false,
            message: 'CHECK_FIELD_LOW_DATE'
        });
    }
    let query = {
        place_id: body.place_id,
        state: { $in: reservationState },
        from: { $lt: to },
        to: { $gt: from }
    }

    if (body.field_id) {
        query.field_id = body.field_id;
    }
    Reservation.find(query, 'field_id', (err, results) => {
        if (err) {
            return res.status(500).send({
                ok: false,
                // query: query,
                message: 'CHECK_FIELD_ERR',
                err
            });
        }
        let arrayIds = [];
        results.forEach((field) => {
            arrayIds.push(field.field_id);
        });


        let query2 = {
            place_id: body.place_id,
            _id: { $nin: arrayIds },
            available: true
        };
        if (body.field_id) {
            query2._id = body.field_id;
        }
        if (body.players) {
            query2.players = body.players;
        }
        Field.find(query2).populate('reserved').exec((err, fields) => {


            if (err) {
                return res.status(500).send({
                    ok: false,
                    message: 'CHECK_FIELD_ERR',
                    err
                });
            }
            if (!fields || fields.length === 0) {
                return res.status(500).send({
                    ok: false,
                    // query2,
                    message: 'CHECK_FIELD_UNAVAILABILITY'
                });
            }
            return res.send({
                ok: true,
                message: 'CHECK_FIELD_OK',
                total: fields.length,
                fields
            });

        });

    });
});

app.post('/api/place/reserve', verificaToken, (req, res) => {
    let reservationState = ['CONFIRMED', 'RESERVED'];
    let body = req.body;
    let user_id = req.user_data._id;
    // console.log('date: ', moment().format('MM/DD/YYYY h:mm:ss'));
    // moment(new Date("2017/09/20 17:42:09")).format();
    //     "2017-09-20T17:42:09-03:00"
    let now = moment(new Date()).format();

    let from = moment(new Date(body.from)).format();
    let to = moment(new Date(body.to)).format();
    if (now > from || (!from || !to)) {
        return res.status(400).send({
            ok: false,
            message: 'CHECK_FIELD_OUT_DATE'
        });
    }
    let hours = moment.duration(moment(new Date(to)).diff(moment(new Date(from)))).asHours();
    // console.log(hours);
    if (hours < 1) {
        return res.status(400).send({
            ok: false,
            message: 'CHECK_FIELD_LOW_DATE'
        });
    }
    let query = {
        place_id: body.place_id,
        state: { $in: reservationState },
        from: { $lt: to },
        to: { $gt: from }
    }

    if (body.field_id) {
        query.field_id = body.field_id;
    }


    Reservation.find(query, 'field_id', (err, results) => {
        if (err) {
            return res.status(500).send({
                ok: false,
                query: query,
                message: 'CHECK_FIELD_ERR',
                err
            });
        }
        let arrayIds = [];
        results.forEach((field) => {
            arrayIds.push(field.field_id);
        });


        let query2 = {
            place_id: body.place_id,
            _id: { $nin: arrayIds },
            available: true
        };
        if (body.field_id) {
            query2._id = body.field_id;
        }
        if (body.players) {
            query2.players = body.players;
        }
        Field.findOne(query2, function(err, field) {
            if (err) {
                return res.status(500).send({
                    ok: false,
                    message: 'RESERVE_FIELD_ERR',
                    err
                });
            }
            if (!field) {
                return res.status(400).send({
                    ok: false,
                    message: 'RESERVE_FIELD_UNAVAILABILITY'
                });
            }

            let reservation = new Reservation({
                from: from,
                to: to,
                user: user_id,
                update: moment().format(),
                place_id: field.place_id,
                field_id: field._id
            });
            reservation.save((err, reserved) => {


                Field.findByIdAndUpdate(field._id, {
                    $push: { "reserved": reserved._id }
                }, {
                    safe: true,
                    new: true
                }, function(err, field) {
                    if (err) {
                        return res.status(500).send({
                            ok: false,
                            message: 'RESERVE_FIELD_ERR',
                            err
                        });
                    }
                    return res.json({
                        ok: true,
                        message: 'RESERVE_FIELD_OK',
                        field
                    });
                });
            });


        });

    });

});

app.put('/api/cancel-reservation', verificaToken, (req, res) => {
    let body = req.body;
    let user_id = req.user_data._id;
    let reservation_id = body.reservation;
    let state = 'CANCELED';
    let now = moment(new Date()).format();
    if (body.state) {
        state = body.state;
    }
    Reservation.findByIdAndUpdate(reservation_id, { state: state, update: now }, { new: true, runValidators: true }, (err, reservation) => {
        if (err) {
            return res.status(500).send({
                ok: false,
                message: 'CANCEL_RESERVATION_ERR',
                err
            });
        }
        if (!reservation) {
            return res.status(400).send({
                ok: false,
                message: 'CANCEL_RESERVATION_ERR'
            });
        }
        return res.json({
            ok: true,
            message: 'CANCEL_RESERVATION_OK',
            reservation
        });
    })



});


app.get('/user-reservation', verificaToken, (req, res) => {
    let from = Number(req.query.from) || 0;
    from = Number(from);
    let limit = Number(req.query.limit) || 5;
    limit = Number(limit);

    let user_id = req.user_data._id;
    let query = {
        user: user_id
    };

    if (req.query.state) {
        query.state = req.query.state
    }
    Reservation.find(query).populate('place_id field_id')
        .skip(from)
        .limit(limit)
        .exec((err, users) => {
            if (err) {
                return res.status(500).send({
                    ok: false,
                    message: 'GET_USER_RESERVATION_ERR',
                    err
                });
            }
            Reservation.count(query, (err, count) => {
                return res.json({
                    ok: true,
                    message: 'GET_USER_RESERVATION_OK',
                    total: count,
                    users
                });
            });

        });
});

app.delete('/api/delete_all', verificaToken, (req, res) => {
    let user_id = req.user_data._id;
    Reservation.find({}).remove().exec((err, data) => {
        if (err) {
            return res.status(500).send({
                ok: false,
                err
            });
        }

        Field.update({ "available": true }, { $pullAll: { reserved: [{ user: new mongoose.Types.ObjectId(user_id) }] } }, (err, updated) => {
            if (err) {
                return res.status(500).send({
                    ok: false,
                    err
                });
            }
            return res.json({
                ok: true,
                message: 'RESERVACIONES BORRADAS',
                updated
            });
        })

    });
});


module.exports = app;