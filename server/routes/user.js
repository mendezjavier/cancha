const express = require('express');
const app = express();
const bcrypt = require('bcrypt');
const _ = require('underscore');
const moment = require('moment');

const Reservation = require('../models/reservation');
const User = require('../models/user');
const { verificaToken, verificaAdminRol } = require('../middlewares/autenticacion');

app.post('/signup', (req, res) => {
    let body = req.body;
    // let password = 
    if (!body.name || !body.email || !body.password || !body.nick) {
        return res.status(500).send({
            ok: false,
            message: 'SAVE_USER_ERR_REQUIRED'
        });
    }
    let user = new User({
        name: body.name,
        surname: body.surname,
        nick: body.nick,
        email: body.email,
        created_at: moment().unix(),
        password: bcrypt.hashSync(body.password, 10)
    });

    user.save((err, userDB) => {
        if (err) {
            return res.status(500).send({
                ok: false,
                message: 'SAVE_USER_ERR',
                err
            });
        }
        // userDB.password = null;
        return res.json({
            ok: true,
            message: 'SAVE_USER_OK',
            user: userDB
        });
    });
});

//app.post('/user-admin', [verificaToken, verificaAdminRol], (req, res) => {
app.post('/user-admin', (req, res) => {
    let body = req.body;
    // let password = 
    let user = new User({
        name: body.name,
        surname: body.surname,
        nick: body.nick,
        email: body.email,
        created_at: moment().unix(),
        password: bcrypt.hashSync(body.password, 10),
        role: 'ADMIN_ROLE'
    });

    user.save((err, userDB) => {
        if (err) {
            return res.status(500).send({
                ok: false,
                message: 'SAVE_ADMIN_USER_ERR'
            });
        }
        // userDB.password = null;
        return res.json({
            ok: true,
            message: 'SAVE_ADMIN_USER_OK',
            user: userDB
        });
    });
});

app.put('/user/:id', [verificaToken, verificaAdminRol], (req, res) => {
    let id = req.params.id;
    let body = _.pick(req.body, ['name', 'surname', 'email', 'img', 'role', 'nick', 'active']);

    User.findByIdAndUpdate(id, body, { new: true, runValidators: true }, (err, userDB) => {
        if (err) {
            return res.status(500).send({
                ok: false,
                err
            });
        }
        if (!userDB) {
            return res.status(400).send({
                ok: false,
                err: {
                    message: 'No existe el usuario'
                }
            });
        }
        return res.json({
            ok: true,
            user: userDB
        });

    });
});

app.get('/user', verificaToken, (req, res) => {
    let desde = Number(req.query.desde) || 0;
    desde = Number(desde);
    let limite = Number(req.query.limite) || 5;
    limite = Number(limite);

    User.find({ active: true }, 'name surname email google img')
        .skip(desde)
        .limit(limite)
        .exec((err, users) => {
            if (err) {
                return res.status(500).send({
                    ok: false,
                    message: 'GET_USER_ERR',
                    err
                });
            }
            User.count({ active: true }, (err, count) => {
                return res.json({
                    ok: true,
                    message: 'GET_USER_OK',
                    total: count,
                    users
                });
            });

        });
});




app.delete('/user/:id', [verificaToken, verificaAdminRol], (req, res) => {
    let id = req.params.id;

    User.findByIdAndUpdate(id, { active: false }, { new: true, runValidators: true }, (err, userDB) => {
        if (err) {
            return res.status(500).send({
                ok: false,
                err
            });
        }
        if (!userDB) {
            return res.status(400).send({
                ok: false,
                message: 'DELETE_USER_ERR'
            });
        }
        return res.json({
            ok: true,
            message: 'DELETE_USER_OK',
            user: userDB
        });

    });
});

module.exports = app;