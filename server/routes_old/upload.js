const express = require('express');
const fileUpload = require('express-fileupload');
const app = express();
const fs = require('fs');
const path = require('path');

const Usuario = require('../models/usuario');
const Producto = require('../models/producto');

// default options
app.use(fileUpload());

app.put('/upload/:tipo/:id', function(req, res) {
    let tipo = req.params.tipo;
    let id = req.params.id;
    if (!req.files)
        return res.status(400).json({
            ok: false,
            err: {
                message: 'No hay archivos'
            }
        });

    // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
    let archivo = req.files.archivo;
    // Validar tipo
    let tiposValidos = ['usuarios', 'productos'];
    if (tiposValidos.indexOf(tipo) < 0) {
        return res.status(400).json({
            ok: false,
            err: {
                message: 'Tipo no valido.'
            }
        });
    }
    // VAlidar extensiones
    let nombreArchivo = archivo.name.split('.');
    let ext = nombreArchivo[nombreArchivo.length - 1].toLowerCase();

    let extensionesValidas = ['jpg', 'png', 'gif', 'jpeg'];

    if (extensionesValidas.indexOf(ext) < 0) {
        return res.status(400).json({
            ok: false,
            err: {
                message: 'Extension de archivo no permitida.'
            }
        });
    }
    // Cambiar nombre al archivo
    let nombre = `${id}-${new Date().getMilliseconds()}.${ext}`

    // Use the mv() method to place the file somewhere on your server
    archivo.mv(`uploads/${tipo}/${nombre}`, (err) => {
        if (err)
            return res.status(500).json({
                ok: false,
                err
            });
        if (tipo === 'usuarios') {
            imagenUsuario(id, nombre, res);
        } else {
            imagenProducto(id, nombre, res);
        }
    });
});

function imagenUsuario(id, nombreArchivo, res) {
    Usuario.findById(id, (err, usuarioDB) => {
        if (err) {
            borraArchivos(nombreArchivo, 'usuarios');
            return res.status(500).json({
                ok: false,
                err
            });
        }
        if (!usuarioDB) {
            borraArchivos(nombreArchivo, 'usuarios');
            return res.status(404).json({
                ok: false,
                err: {
                    message: 'El usuario no existe'
                }
            });
        }
        borraArchivos(usuarioDB.img, 'usuarios');
        usuarioDB.img = nombreArchivo;
        usuarioDB.save((err, usuarioDB) => {
            if (err)
                return res.status(500).json({
                    ok: false,
                    err
                });

            res.json({
                ok: true,
                usuario: usuarioDB
            });
        });

    });

}

function imagenProducto(id, nombreArchivo, res) {
    Producto.findById(id, (err, productoDB) => {
        if (err) {
            borraArchivos(nombreArchivo, 'productos');
            return res.status(500).json({
                ok: false,
                err
            });
        }
        if (!productoDB) {
            borraArchivos(nombreArchivo, 'productos');
            return res.status(404).json({
                ok: false,
                err: {
                    message: 'El producto no existe'
                }
            });
        }
        borraArchivos(productoDB.img, 'productos');
        productoDB.img = nombreArchivo;
        productoDB.save((err, productoDB) => {
            if (err)
                return res.status(500).json({
                    ok: false,
                    err
                });

            return res.json({
                ok: true,
                producto: productoDB
            });
        });
    })
}

function borraArchivos(nombre, tipo) {
    let pathImagen = path.resolve(__dirname, `../../uploads/${tipo}/${nombre}`);
    if (fs.existsSync(pathImagen)) {
        fs.unlinkSync(pathImagen);
    }
}
module.exports = app;