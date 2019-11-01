const express = require('express');
const app = express();
const moment = require('moment');
const mongoose = require('mongoose');

const Token = require('../models/token');
var FCM = require('fcm-node');
let serverKey = 'AAAAaQjo8AY:APA91bFLdPIAvdcMJ434OHN78MqgvcW8f4YIftqao41Baj5mLizRXam3iblhPWKumOEp-JDjjbd0r9Yx9lbt3NbLvGoY8CRpYhLUd7y08mvapqNRBDP-l4uoya596gmR6UWj_x8aqP1J';
var fcm = new FCM(serverKey);

app.post('/store-token', (req, res) => {

    console.log(req.body);
    let token = new Token({
        token: req.body.token
    });
    token.save((err, tokenDB) => {
        if (err) {
            return res.status(500).send({
                ok: false,
                err,
                message: 'SAVE_TOKEN_DEVICES_ERR'
            });
        }

        return res.json({
            ok: true,
            message: 'SAVE_TOKEN_DEVICES_OK',
            token: tokenDB
        });
    });
    // Token.insertOne(req.body, (err, body) => {
    //     if (err) throw err;
    //     res.status(200).send('');
    // });



});

app.get('/send', function(req, res) {

    var token_array = [];


    let db = client.db(dbName);
    Token.find().toArray((err, docs) => {
        if (err) throw err;
        for (let i = 0; i < docs.length; i++) {
            token_array.push(docs[i]);
        }
    });


    for (let i = 0; i < token_array.length; i++) {
        var message = {
            // this may vary according to the message type (single
            // recipient, multicast, topic, et cetera)

            to: token_array[i].token,
            collapse_key: 'your_collapse_key',

            notification: {
                title: 'Title of your push notification',
                body: 'Body of your push notification'
            },

            data: {
                // you can send only notification or only 
                // data(or include both)
                my_key: 'my value',
                my_another_key: 'my another value'
            }
        };

        fcm.send(message, function(err, response) {
            if (err) {
                console.log("Something has gone wrong!");
            } else {
                console.log("Successfully sent with response: ", response);
            }
        });
    }
    res.send('send msg');
});

module.exports = app;