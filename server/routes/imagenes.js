const express = require('express');

const fs = require('fs');
const path = require('path');
const { verificaTokenUrl } = require('../middlewares/autenticacion');

const app = express();

app.get('/imagen/:tipo/:img', verificaTokenUrl, (req, res) => {
    let tipo = req.params.tipo;
    let img = req.params.img;

    let pathImg = path.resolve(__dirname, `../../uploads/${tipo}/${img}`);
    if (!fs.existsSync(pathImg)) {
        pathImg = path.resolve(__dirname, '../assets/no-image.jpg');
    }

    res.sendFile(pathImg);
});

module.exports = app;