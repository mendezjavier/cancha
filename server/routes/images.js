const express = require('express');

const fs = require('fs');
const path = require('path');
const { verificaTokenUrl } = require('../middlewares/autenticacion');

const app = express();

app.get('/images/:tipo/:img', (req, res) => {
    let tipo = req.params.tipo;
    let img = req.params.img;

    let pathImagen = path.resolve(__dirname, `../uploads/${tipo}/${img}`);

    if (fs.existsSync(pathImagen)) {
        res.sendFile(pathImagen);
    } else {
        let pathNoImg = path.resolve(__dirname, `../assets/futbol.jpg`);
        res.sendFile(pathNoImg);
    }


});

module.exports = app;