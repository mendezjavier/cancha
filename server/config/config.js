process.env.PORT = process.env.PORT || 3000;
process.env.NODE_ENV = process.env.NODE_ENV || 'dev';

// VENCIMIENTO DEL TOKEN
process.env.CADUCIDAD_TOKEN = '48h';

// CONTRASENA DEL TOKEN
process.env.SEED = process.env.SEED || 'otro';

// ID PARA AUTH CON GOOGLE
process.env.CLIENT_ID = process.env.CLIENT_ID || 'id';
// BASE DE DATOS
let urlDB;
if (process.env.NODE_ENV == 'dev') {
    urlDB = 'mongodb://localhost:27017/canchas-app';
} else {
    urlDB = process.env.MONGO_URI;
}

process.env.URLDB = urlDB;
