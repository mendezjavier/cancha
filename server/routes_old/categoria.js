const express = require('express');
const app = express();
const _ = require('underscore');
const { verificaToken, verificaAdminRol } = require('../middlewares/autenticacion');

let Categoria = require('../models/categoria');

app.get('/categoria', verificaToken, (req, res) => {
    let desde = Number(req.query.desde) || 0;
    desde = Number(desde);
    let limite = Number(req.query.limite) || 15;
    limite = Number(limite);

    Categoria.find({})
        .sort('descripcion')
        .skip(desde)
        .limit(limite)
        .populate('usuario', 'nombre email')
        .exec((err, categorias) => {
            if (err) {
                return res.status(500).send({
                    ok: false,
                    err
                });
            }
            Categoria.count({ estado: true }, (err, count) => {
                return res.json({
                    ok: true,
                    total: count,
                    categorias
                });
            });

        });
});


app.get('/categoria/:id', verificaToken, (req, res) => {
    let id = req.params.id;
    Categoria.findById(id).populate('usuario').exec((err, categoriaDB) => {
        if (err) {
            return res.status(500).send({
                ok: false,
                err
            });
        }
        if (!categoriaDB) {

            return res.status(404).send({
                ok: false,
                err: {
                    message: 'La categoria no existe'
                }
            });

        }
        return res.json({
            ok: true,
            categoria: categoriaDB
        });
    });
});

app.post('/categoria', [verificaToken], (req, res) => {
    let userId = req.usuario._id;
    let body = req.body;
    // let password = 
    let categoria = new Categoria({
        descripcion: body.descripcion,
        usuario: userId
    });

    categoria.save((err, categoriaDB) => {
        if (err) {
            return res.status(500).send({
                ok: false,
                err
            });
        }
        // usuarioDB.password = null;
        return res.json({
            ok: true,
            categoria: categoriaDB
        });
    });
});

app.put('/categoria/:id', [verificaToken], (req, res) => {
    let id = req.params.id;
    // let body = _pick(req.body, ['descripcion']);

    let body = req.body
    Categoria.findByIdAndUpdate(id, body, { new: true, runValidators: true }, (err, categoriaDB) => {
        if (err) {
            return res.status(500).send({
                ok: false,
                err
            });
        }
        if (!categoriaDB) {
            return res.status(400).send({
                ok: false,
                err: {
                    message: 'No existe la categoria'
                }
            });
        }
        return res.json({
            ok: true,
            categoria: categoriaDB
        });

    });
});

app.delete('/categoria/:id', [verificaToken, verificaAdminRol], (req, res) => {
    let id = req.params.id;
    Categoria.findByIdAndRemove(id, (err, categoriaDB) => {
        if (err) {
            return res.status(400).send({
                ok: false,
                err
            });
        }
        if (!categoriaDB) {
            return res.status(400).send({
                ok: false,
                err: {
                    message: 'No existe la categoria'
                }
            });
        }
        return res.json({
            ok: true,
            categoria: categoriaDB
        });
    });
});

module.exports = app;