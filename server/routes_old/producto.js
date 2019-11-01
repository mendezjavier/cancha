const express = require('express');
const app = express();
const _ = require('underscore');
const { verificaToken, verificaAdminRol } = require('../middlewares/autenticacion');

let Producto = require('../models/producto');

app.get('/productos', verificaToken, (req, res) => {
    let desde = Number(req.query.desde) || 0;
    desde = Number(desde);
    let limite = Number(req.query.limite) || 15;
    limite = Number(limite);
    let order = req.query.order || 'nombre';
    Producto.find({ disponible: true })
        .sort(order)
        .skip(desde)
        .limit(limite)
        .populate('usuario', 'nombre email')
        .populate('categoria', 'descripcion')
        .exec((err, productos) => {
            if (err) {
                return res.status(500).send({
                    ok: false,
                    err
                });
            }
            Producto.count({ estado: true }, (err, count) => {
                return res.json({
                    ok: true,
                    total: count,
                    productos
                });
            });

        });
});


app.get('/productos/:id', verificaToken, (req, res) => {
    let id = req.params.id;
    Producto.findById(id)
        .populate('usuario', 'nombre email')
        .populate('categoria')
        .exec((err, productoDB) => {
            if (err) {
                return res.status(500).send({
                    ok: false,
                    err
                });
            }
            if (!productoDB) {

                return res.status(404).send({
                    ok: false,
                    err: {
                        message: 'El producto buscado no existe'
                    }
                });

            }
            return res.json({
                ok: true,
                producto: productoDB
            });
        });
});

app.get('/productos/buscar/:termino', verificaToken, (req, res) => {
    let termino = req.params.termino;

    let regex = new RegExp(termino, 'i');

    Producto.find({ nombre: regex })
        .populate('categoria', 'nombre')
        .exec((err, productoDB) => {
            if (err) {
                return res.status(500).send({
                    ok: false,
                    err
                });
            }
            if (!productoDB) {

                return res.status(404).send({
                    ok: false,
                    err: {
                        message: 'El producto buscado no existe'
                    }
                });

            }
            return res.json({
                ok: true,
                producto: productoDB
            });
        });
});

app.post('/productos', [verificaToken], (req, res) => {
    let userId = req.usuario._id;
    let body = req.body;
    // let password = 
    let producto = new Producto({
        nombre: body.nombre,
        precioUni: body.precioUni,
        descripcion: body.descripcion,
        categoria: body.categoria,
        usuario: userId
    });

    producto.save((err, productoDB) => {
        if (err) {
            return res.status(500).send({
                ok: false,
                err
            });
        }
        // usuarioDB.password = null;
        return res.json({
            ok: true,
            producto: productoDB
        });
    });
});

app.put('/productos/:id', [verificaToken], (req, res) => {
    let id = req.params.id;

    let body = _.pick(req.body, ['descripcion', 'nombre', 'precioUni', 'disponible']);

    Producto.findByIdAndUpdate(id, body, { new: true, runValidators: true }, (err, productoDB) => {
        if (err) {
            return res.status(500).send({
                ok: false,
                err
            });
        }
        if (!productoDB) {
            return res.status(400).send({
                ok: false,
                err: {
                    message: 'No existe la categoria'
                }
            });
        }
        return res.json({
            ok: true,
            producto: productoDB
        });

    });
});

app.delete('/productos/:id', [verificaToken, verificaAdminRol], (req, res) => {
    let id = req.params.id;
    Producto.findByIdAndUpdate(id, { disponible: false }, { new: true, runValidators: true }, (err, productoDB) => {
        if (err) {
            return res.status(500).send({
                ok: false,
                err
            });
        }
        if (!productoDB) {
            return res.status(400).send({
                ok: false,
                err: {
                    message: 'No existe el usuario'
                }
            });
        }
        return res.json({
            ok: true,
            message: 'Producto eliminado correctamente'
        });

    });
});




module.exports = app;