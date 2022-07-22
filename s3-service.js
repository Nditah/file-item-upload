const { S3, Endpoint } = require("aws-sdk");
const { extname } = require("path");

// https://gifti.fra1.digitaloceanspaces.com
const AWS_BUCKET = "gifti";

// const url = `https://${folder}.s3.${REGION}.amazonaws.com/${fileName}`;

// Set S3 endpoint to DigitalOcean Spaces
const spacesEndpoint = new Endpoint("fra1.digitaloceanspaces.com");

const s3Client = new S3({
  endpoint: spacesEndpoint,
  region: "fra1",
  credentials: {
    accessKeyId: process.env.SPACES_KEY,
    secretAccessKey: process.env.SPACES_SECRET,
  },
});

/**
 * Call S3 to list the buckets
 */

function listBuckets() {
  s3Client.listBuckets(function (err, data) {
    if (err) {
      console.log("Error", err);
    } else {
      console.log("Success", data.Buckets);
    }
  });
}

/**
 * call S3 to create the bucket
 */

function createBucket(name) {
  const bucketParams = {
    Bucket: name,
  };
  s3Client.createBucket(bucketParams, function (err, data) {
    if (err) {
      console.log("Error", err);
    } else {
      console.log("Success", data.Location);
    }
  });
}

/**
 * Uploading a File to an Amazon S3 Bucket
 */

function uploadToBucket(bucketName, fileName) {
  const uploadParams = { Bucket: bucketName, Key: "", Body: "" };
  const file = fileName;

  // Configure the file stream and obtain the upload parameters
  const fileStream = fs.createReadStream(file);
  fileStream.on("error", function (err) {
    console.log("File Error", err);
  });
  uploadParams.Body = fileStream;
  uploadParams.Key = path.basename(file);

  // call S3 to retrieve upload file to specified bucket
  s3Client.upload(uploadParams, function (err, data) {
    if (err) {
      console.log("Error", err);
    }
    if (data) {
      console.log("Upload Success", data.Location);
    }
  });
}

/**
 * Listing Objects in an Amazon S3 Bucket
 */

function listFilesInBucket(bucketName) {
  const bucketParams = {
    Bucket: bucketName,
  };
  // Call S3 to obtain a list of the objects in the bucket
  s3Client.listObjects(bucketParams, function (err, data) {
    if (err) {
      console.log("Error", err);
    } else {
      console.log("Success", data);
    }
  });
}

/**
 * Deleting an Amazon S3 Bucket
 */

function deleteBucket(bucketName) {
  const bucketParams = {
    Bucket: bucketName,
  };
  // Call S3 to delete the bucket
  s3Client.deleteBucket(bucketParams, function (err, data) {
    if (err) {
      console.log("Error", err);
    } else {
      console.log("Success", data);
    }
  });
}

async function list() {
  const params = {
    Bucket: AWS_BUCKET,
    // Delimiter: '/PHOTO',
  };
  const result = await s3Client.listObjects(params).promise();
  console.dir(result);
  return result;
}

async function uploadService(data) {
  const { type, file, base64String, folder } = data;
  const time = `${new Date().getTime().toString()}`;
  const fileData = {
    Bucket: AWS_BUCKET,
    Key: `${type}/${folder}/${time}`,
    ACL: "public-read",
  };
  let ext = '';
  if (base64String) {
    fileData.ContentEncoding = "base64"; // required
    fileData.Body = Buffer.from(base64String.replace(/^data:image\/\w+;base64,/, ""),
      "base64"
    );
    ext = base64String.split(";")[0].split("/")[1]; // Extension
    fileData.ContentType = `image/${ext}`;
    fileData.Key = `${fileData.Key}.${ext}`;
  } else if (file) {
    ext = extname(file.name);
    fileData.Key = `${fileData.Key}${ext}`;
    fileData.ContentType = file.mimetype;
    fileData.Body = file.data;
  } else {
    throw new Error(
      "Invalid request data: base64String and dataBuffer can not be null"
    );
  }
  console.log(fileData);
  const result = await s3Client.upload(fileData).promise();
  return result;
}

module.exports = {
  list,
  listBuckets,
  createBucket,
  uploadToBucket,
  listFilesInBucket,
  deleteBucket,
  uploadService,
};
