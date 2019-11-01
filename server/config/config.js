process.env.PORT = process.env.PORT || 3000;
process.env.NODE_ENV = process.env.NODE_ENV || 'dev';

// VENCIMIENTO DEL TOKEN
process.env.CADUCIDAD_TOKEN = '48h';

// CONTRASENA DEL TOKEN
process.env.SEED = process.env.SEED || 'P@rk1ng-@PP-TOKEN';

// ID PARA AUTH CON GOOGLE
process.env.CLIENT_ID = process.env.CLIENT_ID || '762295368431-gb104gc5h1n6g6g012qfpangb13dvcg5.apps.googleusercontent.com';
// BASE DE DATOS
let urlDB;
if (process.env.NODE_ENV == 'dev') {
    urlDB = 'mongodb://10.245.107.135:27017/canchas-app';
    urlDB = 'mongodb://localhost:27017/canchas-app';
} else {
    urlDB = process.env.MONGO_URI;
}

process.env.URLDB = urlDB;