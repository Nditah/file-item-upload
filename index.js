const express = require("express");
const fileupload = require("express-fileupload");
require("dotenv").config();

const {
  list,
  listBuckets,
  createBucket,
  uploadToBucket,
  listFilesInBucket,
  deleteBucket,
  uploadService,
} = require("./s3-service");

const app = express();

// Views in public directory
app.use(express.static("public"));

// Main, error and success views
app.get("/", function (req, res) {
  res.sendFile(__dirname + "/public/index.html");
});

app.get("/success", function (req, res) {
  res.sendFile(__dirname + "/public/success.html");
});

app.get("/error", function (req, res) {
  res.sendFile(__dirname + "/public/error.html");
});

app.post("/file-upload", fileupload(), function (req, res, next) {
  try {
    const data = {
      type: 'PHOTO',
      ...req.body,
      file: req?.files?.file1,
    };
    console.log(req.files)
    uploadService(data)
    .then(result => console.log(result))
    .catch((err) => {
      throw new Error(err.message);
    });
    console.log("File uploaded successfully.");
    res.redirect("/success");
  } catch (error) {
    console.log(error);
    return res.redirect("/error");
  }
});

app.listen(3001, function () {
  console.log("Server listening on port 3001.");
  // list().then()
});
