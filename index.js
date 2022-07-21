const express = require('express');
const fileupload = require("express-fileupload");
require('dotenv').config()

const {
  s3Client,
  list,
  upload,
  listBuckets,
  createBucket,
  uploadToBucket,
  listFilesInBucket,
  deleteBucket,
  binaryHandler,
  base64Handler,
  uploadService,
} = require('./s3-service');

const app = express();


// Views in public directory
app.use(express.static('public'));

// Main, error and success views
app.get('/', function (req, res) {
  res.sendFile(__dirname + '/public/index.html');
});

app.get("/success", function (req, res) {
  res.sendFile(__dirname + '/public/success.html');
});

app.get("/error", function (req, res) {
  res.sendFile(__dirname + '/public/error.html');
});

app.post('/file-upload', fileupload(),  function (req, res, next) {
  console.log(req.files);
  // upload(req, res, function (error) {
  //   if (error) {
  //     console.log(error);
  //     return res.redirect("/error");
  //   }
  //   console.log('File uploaded successfully.');
  //   res.redirect("/success");
  // });
  res.redirect("/success");
});

app.listen(3001, function () {
  console.log('Server listening on port 3001.');
  // list().then()
});
