const express = require('express');
const app = express();
const moment = require('moment');
const mongoose = require('mongoose');
// const bcrypt = require('bcrypt');
// const _ = require('underscore');

const Parking = require('../models/parking');
const { verificaToken, verificaAdminRol, verificaTokenUrl } = require('../middlewares/autenticacion');

app.post('/new-parking', [verificaToken], (req, res) => {
    let body = req.body;
    // let lat = body.lat
    let userId = req.user_data._id;
    let parking = new Parking({
        loc: {
            type: 'Point',
            coordinates: [body.lng, body.lat]
        },
        created_at: moment().unix(),
        user: userId
    });
    console.log(parking);

    parking.save((err, parkingDB) => {
        if (err) {
            return res.status(500).send({
                ok: false,
                err
            });
        }

        return res.json({
            ok: true,
            message: 'Lugar disponible',
            place: parkingDB
        });
    });
});

app.get('/parking', [verificaToken], (req, res) => {
    let lat = Number(req.query.lat) || -34.5627901;
    let lng = Number(req.query.lng) || -58.4783475;
    let distance = Number(req.query.distance) || 500;
    Parking.aggregate([{
            $geoNear: {
                near: { type: "Point", coordinates: [lng, lat] },
                key: "loc",
                maxDistance: distance,
                spherical: true,
                query: { available: true },
                distanceField: "distance"
            }
        }])
        // Parking.find({
        //         loc: {
        //             $near: {
        //                 $geometry: {
        //                     type: "Point",
        //                     coordinates: [lng, lat]
        //                 },
        //                 $maxDistance: distance
        //             }
        //         }
        //     }).populate('user')
        .exec(function(err, parkingPlaces) {
            if (err) {
                return res.status(500).send({
                    ok: false,
                    err
                });
            }

            if (!parkingPlaces || parkingPlaces.length === 0) {
                return res.status(404).send({
                    ok: false,
                    err: {
                        message: 'No hay lugares disponibles'
                    }
                });
            }
            Parking.populate(parkingPlaces, { path: "user" }, (err, parks) => {
                return res.json({
                    ok: true,
                    places: parks
                });
            });


        });

});

app.get('/user-parking', verificaToken, (req, res) => {
    let userId = req.user_data._id;
    let from = Number(req.query.from) || 0;
    let to = Number(req.query.to) || 10;
    Parking.find({ user: userId })
        .skip(from)
        .limit(to)
        .exec((err, places) => {
            if (err) {
                return res.status(500).send({
                    ok: false,
                    err
                });
            }
            Parking.count({ user: userId }, (err, count) => {
                return res.json({
                    ok: true,
                    total: count,
                    places
                });
            });

        });
});

app.get('/parking-bounds', verificaTokenUrl, (req, res) => {
    // POLYGON TECO
    let ne_lat = Number(req.query.ne_lat) || -34.39477899263736;
    let ne_lng = Number(req.query.ne_lng) || -57.54012823632809;
    let sw_lat = Number(req.query.sw_lat) || -34.73404500431646;
    let sw_lng = Number(req.query.sw_lng) || -59.41604376367184;
    Parking.find({
        loc: {
            $geoWithin: {
                $box: [
                    [sw_lng, sw_lat],
                    [ne_lng, ne_lat]
                ]
            }
        }
    }).exec(function(err, parkingPlaces) {
        if (err) {
            return res.status(500).send({
                ok: false,
                err
            });
        }

        if (!parkingPlaces || parkingPlaces.length === 0) {
            return res.status(404).send({
                ok: false,
                err: {
                    message: 'No hay lugares disponibles'
                }
            });
        }
        return res.json({
            ok: true,
            total: parkingPlaces.length,
            places: parkingPlaces
        });



    });
})


app.put('/parking/:id', verificaToken, (req, res) => {
    let id = req.params.id;
    let body = req.body;
    let lng = Number(body.lng) || 0;
    let lat = Number(body.lat) || 0;
    let distance = 200;
    // Primero chequea que estes lo suficientemente cerca para poder actualizarlo, y actualiza el estado del lugar
    // Al usar aggregate hay que castear el id para que lo tome

    Parking.aggregate([{
        $geoNear: {
            near: { type: "Point", coordinates: [lng, lat] },
            key: "loc",
            maxDistance: distance,
            distanceField: "distance",
            spherical: true,
            query: { _id: new mongoose.Types.ObjectId(id) }
        }
    }]).exec(function(err, parkingPlaces) {
        if (err) {
            return res.status(500).send({
                ok: false,
                err
            });
        }

        if (!parkingPlaces || parkingPlaces.length === 0) {
            return res.status(404).send({
                ok: false,
                err: {
                    message: 'Estas demasiado lejos del lugar para actualizarlo o no existe'
                }
            });
        }

        Parking.findByIdAndUpdate(id, { available: false }, { new: true, runValidators: true }, (err, placeDB) => {
            if (err) {
                return res.status(500).send({
                    ok: false,
                    err
                });
            }
            if (!placeDB) {
                return res.status(400).send({
                    ok: false,
                    err: {
                        message: 'No existe el lugar | Esto no deberia pasar, ya paso la validacion'
                    }
                });
            }
            return res.json({
                ok: true,
                message: 'Lugar actualizado'
            });

        });

    });


})

// UNICAMENTE PARA HACER PRUEBAS - NO PRODUCTIVO (USAR EL PUT Y ACTUALIZAR EL ESTADO)
app.delete('/parking', verificaToken, (req, res) => {
    // Parking.find({ user: req.user_data._id }).remove().exec((err, data) => {
    Parking.find({}).remove().exec((err, data) => {
        if (err) {
            return res.status(500).send({
                ok: false,
                err
            });
        }
        return res.json({
            ok: true,
            message: 'Lugar borrado'
        });
    });
})

module.exports = app;