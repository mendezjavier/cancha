const express = require('express');
const app = express();
const moment = require('moment');
const mongoose = require('mongoose');

const Place = require('../models/place');
const Field = require('../models/field');
const Reservation = require('../models/reservation');

const { verificaToken, verificaAdminRol, verificaTokenUrl } = require('../middlewares/autenticacion');

// OBTIENE LOS LUGAR QUE SE ENCUENTRAN DENTRO DE LOS BOUNDS DE LA PANTALLA DEL MAPA
//app.get('/places', verificaToken, (req, res) => {
app.get('/places', (req, res) => {
    // POLYGON TECO
    let ne_lat = Number(req.query.ne_lat) || -34.39477899263736;
    let ne_lng = Number(req.query.ne_lng) || -57.54012823632809;
    let sw_lat = Number(req.query.sw_lat) || -34.73404500431646;
    let sw_lng = Number(req.query.sw_lng) || -59.41604376367184;
    console.log('get places');
    Place.find({
        loc: {
            $geoWithin: {
                $box: [
                    [sw_lng, sw_lat],
                    [ne_lng, ne_lat]
                ]
            }
        }
    }).exec(function(err, places) {
        if (err) {
            return res.status(500).send({
                ok: false,
                message: 'NO_PLACES_ERR'
            });
        }

        if (!places || places.length === 0) {
            return res.status(404).send({
                ok: false,
                message: 'NO_PLACES_NEAR',
                query: req.query
            });
        }
        return res.json({
            ok: true,
            total: places.length,
            places
        });



    });
});

// OBTIENE LOS LUGARES PERO CON FILTROS
app.get('/places-filters', verificaToken, (req, res) => {
    let placesIds = [];
    let reservationState = ['CONFIRMED', 'RESERVED'];
    let filters = req.query;

    if (!filters.to || !filters.from) {
        return res.status(400).send({
            ok: false,
            message: 'MANDATORY_FILTERS'
        });
    }
    // POLYGON TECO
    let ne_lat = Number(filters.ne_lat) || -34.39477899263736;
    let ne_lng = Number(filters.ne_lng) || -57.54012823632809;
    let sw_lat = Number(filters.sw_lat) || -34.73404500431646;
    let sw_lng = Number(filters.sw_lng) || -59.41604376367184;
    Place.find({
        loc: {
            $geoWithin: {
                $box: [
                    [sw_lng, sw_lat],
                    [ne_lng, ne_lat]
                ]
            }
        }
    }).exec(function(err, places) {
        if (err) {
            return res.status(500).send({
                ok: false,
                message: 'NO_PLACES_ERR'
            });
        }

        if (!places || places.length === 0) {
            return res.status(404).send({
                ok: false,
                message: 'NO_PLACES_NEAR'
            });
        }
        places.forEach((place) => {
            placesIds.push(place._id);
        });

        let query = {
            place_id: { $in: placesIds },
            state: { $in: reservationState },
            from: { $lt: filters.to },
            to: { $gt: filters.from }
        }



        Reservation.find(query, (err, reservations) => {
            if (err) {
                return res.status(500).send({
                    ok: false,
                    message: 'NO_PLACES_ERR'
                });
            }
            let arrayIds = [];
            reservations.forEach((field) => {
                arrayIds.push(field.field_id);
            });

            let query2 = {
                place_id: { $in: placesIds },
                _id: { $nin: arrayIds },
                available: true
            };

            if (filters.players) {
                query2.players = filters.players;
            }
            if (filters.price) {
                query2.price = { $lte: filters.price }
            }
            Field.distinct('place_id', query2, (err, placesIds) => {
                if (err) {
                    return res.status(500).send({
                        ok: false,
                        message: 'NO_PLACES_ERR'
                    });
                }
                if (!placesIds || placesIds.length === 0) {
                    return res.status(404).send({
                        ok: false,
                        message: 'NO_PLACES_NEAR'
                    });
                }
                Place.find({ _id: { $in: placesIds } }, (err, places) => {
                    if (err) {
                        return res.status(500).send({
                            ok: false,
                            message: 'NO_PLACES_ERR'
                        });
                    }
                    if (!places || places.length === 0) {
                        return res.status(404).send({
                            ok: false,
                            message: 'NO_PLACES_NEAR'
                        });
                    }
                    return res.json({
                        ok: true,
                        message: 'Canchas cerca y campos disponibles para reservar',
                        total_canchas: places.length,
                        canchas: places
                    });
                })

            });
            /*
            Field.find(query2).exec((err, fields) => {
                if (err) {
                    return res.status(500).send({
                        ok: false,
                        message: 'NO_PLACES_ERR'
                    });
                }
                if (!fields || fields.length === 0) {
                    return res.status(404).send({
                        ok: false,
                        message: 'NO_PLACES_NEAR'
                    });
                }
                return res.json({
                    ok: true,
                    message: 'Canchas cerca y campos disponibles para reservar',
                    total_reservas: reservations.length,
                    reservas: reservations,
                    total_canchas: places.length,
                    total_campos: fields.length,
                    campos: fields,
                    canchas: places
                });
            });
            */


        });

    });
});
// AGREGAR NUEVA CANCHA
app.post('/new-place', [verificaToken, verificaAdminRol], (req, res) => {
    let body = req.body;
    // let lat = body.lat
    let userId = req.user_data._id;
    let types = body.types.split(',');
    let sports = body.sports.split(',');
    let place = new Place({
        loc: {
            type: 'Point',
            coordinates: [body.lng, body.lat]
        },
        name: body.name,
        description: body.description,
        street: body.street,
        city: body.city,
        state: body.state,
        telephone: body.telephone,
        postCode: body.postCode,
        country: body.country,
        types: types,
        sports,
        opening: {
            mon: {
                hours: []
            },
            tue: {
                hours: []
            },
            wed: {
                hours: []
            },
            thu: {
                hours: []
            },
            fri: {
                hours: []
            },
            sat: {
                hours: []
            },
            sun: {
                hours: []
            },
        },
        created_at: moment().unix(),
        created_by: userId
    });
    for (var prop in place.opening) {
        // console.log(prop)
        if (body[prop] && prop) {
            // console.log(body[prop]);
            let hours = body[prop].split(',');
            hours.forEach(hour => {
                let start = hour.split('-')[0];
                let end = hour.split('-')[1];
                place.opening[prop].open = true;
                place.opening[prop].hours.push({ start, end });
            });
        }
    }
    // if (body.mon) {
    //     console.log(body.mon);
    //     let hours = body.mon.split(',');
    //     hours.forEach(hour => {
    //         let start = hour.split('-')[0];
    //         let end = hour.split('-')[1];
    //         place.opening.mon.open = true;
    //         place.opening.mon.hours.push({ start, end });
    //     });
    // }
    // if (body.tue) {
    //     console.log(body.tue);
    //     let hours = body.tue.split(',');
    //     hours.forEach(hour => {
    //         let start = hour.split('-')[0];
    //         let end = hour.split('-')[1];
    //         place.opening.tue.open = true;
    //         place.opening.tue.hours.push({ start, end });
    //     });
    // }
    //console.log(place);

    place.save((err, placeDB) => {
        if (err) {
            return res.status(500).send({
                ok: false,
                err,
                message: 'SAVE_PLACE_ERR',
                place
            });
        }

        return res.json({
            ok: true,
            message: 'SAVE_PLACE_OK',
            place: placeDB
        });
    });
});


// SETEA UNA CANCHA A NO DISPONIBLE - EL USUARIO TIENE QUE SER EL MISMO QUE LO CREO
app.put('/place-delete', [verificaToken, verificaAdminRol], (req, res) => {
    let userId = req.user_data._id;
    let id = req.body.id;
    Place.findOneAndUpdate({ created_by: userId, _id: id }, { $set: { available: false } }, { new: true }, (err, place) => { // ESTO ES PARA BUSCAR QUE HAYA SIDO CREADO POR EL USUARIO Y ACTUALIZA EL ESTADO
        if (err) {
            return res.status(500).send({
                ok: false,
                message: 'DELETE_PLACE_ERR'
            });
        }

        if (!place) {
            return res.status(400).send({
                ok: false,
                message: 'DELETE_PLACE_ERR'
            });
        }

        return res.json({
            ok: true,
            message: 'DELETE_PLACE_OK',
            place
        });
    });
});

app.get('/place/:id', (req, res) => {
    let id = req.params.id;
    Place.findById(id, (err, place) => {
        if (err) {
            return res.status(500).send({
                ok: false,
                message: 'GET_PLACE_ERR'
            });
        }
        if (!place) {
            return res.status(400).send({
                ok: false,
                message: 'GET_PLACE_ERR'
            });
        }
        // Field.count({ place_id: id }, (err, count) => {
        //     place.fields = count;
        //     return res.json({
        //             ok: true,
        //             message: 'GET_PLACE_BY_ID_OK',
        //             place,
        //             count
        //         })

        // });
        Field.find({ place_id: id }, (err, fields) => {
            if (err) {
                return res.status(500).send({
                    ok: false,
                    message: 'GET_FIELDS_ERR'
                });
            }
            place.fields = fields;
            return res.json({
                ok: true,
                message: 'GET_PLACE_BY_ID_OK',
                place,
                fields
            })
        });
    })
})








// UNICAMENTE PARA HACER PRUEBAS - NO PRODUCTIVO (USAR EL PUT Y ACTUALIZAR EL ESTADO)
app.delete('/places-all', [verificaToken, verificaAdminRol], (req, res) => {

    Place.find({}).remove().exec((err, data) => { // ESTO ES PARA BORRAR TODOS
        if (err) {
            return res.status(500).send({
                ok: false,
                message: 'DELETE_PLACE_ERR'
            });
        }

        return res.json({
            ok: true,
            message: 'DELETE_PLACE_OK'
        });
    });
});


//  SOLO PARA DESA
app.get('/places-all', (req, res) => {
    Place.find({}).exec((err, fields) => {
        if (err) {
            return res.status(500).send({
                ok: false,
                message: 'NO_PLACES_ERR'
            });
        }
        if (!fields || fields.length === 0) {
            return res.status(404).send({
                ok: false,
                message: 'NO_PLACES_NEAR'
            });
        }
        return res.json({
            ok: true,
            // message: 'Canchas cerca y campos disponibles para reservar',
            // total_reservas: reservations.length,

            places: fields

        });
    });

});









module.exports = app;