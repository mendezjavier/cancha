const express = require('express');
const app = express();
const moment = require('moment');
const mongoose = require('mongoose');

const Place = require('../models/place');
const Field = require('../models/field');

const { verificaToken, verificaAdminRol, verificaTokenUrl } = require('../middlewares/autenticacion');


app.post('/new-field', [verificaToken, verificaAdminRol], (req, res) => {
    let body = req.body;
    // let lat = body.lat
    let place_id = body.place_id;
    let user_id = req.user_data._id;
    let sports = body.sports.split(',');
    let field = new Field({
        reserved: [],
        type: body.type,
        price: body.price,
        sports,
        players: body.players,
        created_at: moment().unix(),
        place_id: body.place_id
    });
    //console.log(place);
    Place.findOne({ _id: place_id, created_by: user_id }, '_id', (err, place) => {
        if (err) {
            return res.status(500).send({
                ok: false,
                message: 'SAVE_FIELD_ERR1',
                err
            });
        }
        if (!place) {
            return res.status(400).send({
                ok: false,
                message: 'SAVE_FIELD_UNAUTHORIZED',
                field
            });
        }
        field.save((err, fieldDB) => {
            if (err) {
                return res.status(500).send({
                    ok: false,
                    message: 'SAVE_FIELD_ERR2',
                    err,
                    place,
                    field
                });
            }

            return res.json({
                ok: true,
                message: 'SAVE_FIELD_OK',
                field: fieldDB
            });
        });
    });
});

// ACTUALIZAR EL TIPO - PRECIO - DEPORTES de un campo
app.put('/update-field/:id', [verificaToken, verificaAdminRol], (req, res) => {
    let id = req.params.id;
    let place_id = req.body.place_id;
    let user_id = req.user_data._id;

    let body = _.pick(req.body, ['type', 'price', 'sports']);

    if (!body.sports) {
        body.sports = body.sports.split(',');
    }
    let sports = body.sports.split(',');

    //console.log(place);
    Place.findOne({ _id: place_id, created_by: user_id }, (err, place) => {
        if (err) {
            return res.status(500).send({
                ok: false,
                message: 'SAVE_FIELD_ERR',
                field
            });
        }
        if (!place) {
            return res.status(400).send({
                ok: false,
                message: 'SAVE_FIELD_UNAUTHORIZED',
                field
            });
        }
        Field.findByIdAndUpdate(id, body, { new: true, runValidators: true }, (err, updated) => {
            if (err) {
                return res.status(500).send({
                    ok: false,
                    message: 'UDPATE_FIELD_ERR'
                });
            }
            if (!updated) {
                return res.status(400).send({
                    ok: false,
                    message: 'UDPATE_FIELD_ERR'
                });
            }
            return res.json({
                ok: true,
                message: 'UDPATE_FIELD_OK',
                field: updated
            });

        });
    });


});



// SETEA UN CAMPO A NO DISPONIBLE - EL USUARIO TIENE QUE SER EL MISMO QUE CREO LA CANCHA
app.put('/place-delete/:id', [verificaToken, verificaAdminRol], (req, res) => {
    let user_id = req.user_data._id;
    let id = req.params.id;
    let place_id = req.body.place_id;

    // TENDRIA QUE HACER UN CHEQUEO DE QUE NO TENGA RESERVAR ACTIVAS
    Place.findOne({ _id: place_id, created_by: user_id }, (err, place) => {
        if (err) {
            return res.status(500).send({
                ok: false,
                message: 'DELETE_FIELD_ERR'
            });
        }
        if (!place) {
            return res.status(400).send({
                ok: false,
                message: 'DELETE_FIELD_UNAUTHORIZED'
            });
        }
        Field.findByIdAndUpdate(id, { available: false }, { new: true, runValidators: true }, (err, updated) => {
            if (err) {
                return res.status(500).send({
                    ok: false,
                    message: 'DELETE_FIELD_ERR'
                });
            }

            if (!updated) {
                return res.status(400).send({
                    ok: false,
                    message: 'DELETE_FIELD_ERR'
                });
            }

            return res.json({
                ok: true,
                message: 'DELETE_FIELD_OK',
                place: updated
            });
        });
    });
});




module.exports = app;