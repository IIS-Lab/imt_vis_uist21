var path = require('path');
var express = require('express');
var shell = require("shelljs")
var fs = require('fs');
var https = require("https");
var http = require("http");
// const fileupload = require('express-fileupload');
var base64 = require('urlsafe-base64');
// var bodyParser = require('body-parser');
// var privateKey  = fs.readFileSync('sslcert/server.key', 'utf8');
// var certificate = fs.readFileSync('sslcert/server.crt', 'utf8');
// var credentials = {key: privateKey, cert: certificate};
var app = express();
var multer  = require('multer');

// const credentials = {
//     key: fs.readFileSync('key.pem'),
//     cert: fs.readFileSync('cert.pem')
//   };

// var dir = path.join(__dirname, 'public');
var dir = __dirname;
var mime = {
    html: 'text/html',
    txt: 'text/plain',
    css: 'text/css',
    gif: 'image/gif',
    jpg: 'image/jpeg',
    png: 'image/png',
    svg: 'image/svg+xml',
    js: 'application/javascript'
};

app.use(express.static('public'));
// app.use(fileupload());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.raw({
    inflate: true,
    limit: '100kb',
    type: 'application/octet-stream'
}))

app.get('*', function (req, res) {
    var file = path.join(dir, req.path.replace(/\/$/, '/index.html'));
    if (file.indexOf(dir + path.sep) !== 0) {
        return res.status(403).end('Forbidden');
    }
    var type = mime[path.extname(file).slice(1)] || 'text/plain';
    var s = fs.createReadStream(file);
    s.on('open', function () {
        res.set('Content-Type', type);
        s.pipe(res);
    });
    s.on('error', function () {
        res.set('Content-Type', 'text/plain');
        res.status(404).end('Not found');
    });
});

var upload = multer({ dest: 'uploads/' })

var upload_dir = "uploads/"
app.post('/post_image/', upload.any(), (req, res, next) => {
    console.log('POST /post_image/');
    console.log(req.body)
    
    var data = req.body.image.split(",")
    var b64img = data[1];
    var img = base64.decode(b64img);
    if (req.body.moreinfo) {
        var savedir = path.join(upload_dir, req.body.dir, req.body.classid)
        if (!fs.existsSync(savedir)){
            shell.mkdir("-p", savedir);
        }
        var imgname = req.body.imgid + ".png"
    }
    else {
        var savedir = ""
        var imgname = "sample.png"
    }

    fs.writeFile(path.join(savedir, imgname), img, function (err) {
        console.log(err);
    });
    console.log("sucessfully saved at ", path.join(savedir, imgname))
});



var storage = multer.diskStorage({
    destination: function (req, file, callback) {
      callback(null, '/tmp/my-uploads')
    },
    filename: function (req, file, callback) {
      callback(null, file.fieldname + '-' + Date.now())
    }
});
  
var upload = multer({ storage: storage }).single('image'); // just make sure field name should be same as client form data field name



app.post('/uploads', function (req, res) {
    // console.log(req)
    upload(req, res, function (err) {
    if (err instanceof multer.MulterError) {
        // A Multer error occurred when uploading.
    } else if (err) {
        // An unknown error occurred when uploading.
    }

    // Everything went fine.
    })
})



var httpServer = http.createServer(app);
// var httpsServer = https.createServer(credentials, app);

httpServer.listen(8080);
console.log('Listening on http://localhost:8080/');
// httpsServer.listen(8443);
// console.log('Listening on https://localhost:8443/');