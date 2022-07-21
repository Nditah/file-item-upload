const { S3, Endpoint } = require('aws-sdk');
const { PutObjectCommand } = require("@aws-sdk/client-s3");
const { extname } = require("path");

// https://gifti.fra1.digitaloceanspaces.com 

// Set S3 endpoint to DigitalOcean Spaces
const spacesEndpoint = new Endpoint('fra1.digitaloceanspaces.com');

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

function listBuckets(){
    s3Client.listBuckets(function(err, data) {
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
  
function createBucket(name){
     const bucketParams = {
        Bucket: name,
      };
    s3Client.createBucket(bucketParams, function(err, data) {
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
  
function uploadToBucket(bucketName, fileName){
    const uploadParams = {Bucket: bucketName, Key: '', Body: ''};
    const file = fileName;
    
    // Configure the file stream and obtain the upload parameters
    const fileStream = fs.createReadStream(file);
    fileStream.on('error', function(err) {
      console.log('File Error', err);
    });
    uploadParams.Body = fileStream;
    uploadParams.Key = path.basename(file);
    
    // call S3 to retrieve upload file to specified bucket
    s3Client.upload (uploadParams, function (err, data) {
      if (err) {
        console.log("Error", err);
      } if (data) {
        console.log("Upload Success", data.Location);
      }
    });
  }
  
  
  
  /**
  * Listing Objects in an Amazon S3 Bucket
  */
  
function listFilesInBucket(bucketName){
    const bucketParams = {
        Bucket : bucketName,
      };
      // Call S3 to obtain a list of the objects in the bucket
      s3Client.listObjects(bucketParams, function(err, data) {
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
  
function deleteBucket(bucketName){
    const bucketParams = {
        Bucket : bucketName,
      };
    // Call S3 to delete the bucket
    s3Client.deleteBucket(bucketParams, function(err, data) {
        if (err) {
        console.log("Error", err);
        } else {
        console.log("Success", data);
        }
    });
  }
  


async function binaryHandler(req, res) {
    try {
      const { folder, createdBy } = req.body;
      const name = slugit(req.body.name);
        const file = req.files.image;
        const ext = extname(file.name);
        const fileName = `${folder}/${new Date()
          .getTime()
          .toString()}-${createdBy}.${ext}`;
        const binaryData = new Buffer.from(file.data, "binary");
        const fileContent = {
          Bucket: folder,
          Key: fileName, //* Need to maintain unique images 
          Body: binaryData,
          ACL: 'public-read',
          ContentEncoding: 'base64', // required
          ContentType: `image/${ext}` // required. Notice the back ticks
        };
        const url = `https://${folder}.s3.${REGION}.amazonaws.com/${fileName}`;
        delete req.body.binaryString;
        const record = { ...req.body, url, fileContent };
        const result = await uploadService(record);
        return success(res, 201, record);
      } catch (error) {
        loging(module, req, error);
        return fail(res, 400, `${error.message}`);
      }
    }
  
  async function base64Handler(req, res) {
      try {
        const { base64String, folder, createdBy } = req.body;
        const name = slugit(req.body.name); // -${new Date().getTime().toString()}
        const ext = base64String.split(';')[0].split('/')[1]; // Extension
        const fileName = `${folder}/${name}-${createdBy}.${ext}`;
        const base64Data = new Buffer.from(base64String.replace(/^data:image\/\w+;base64,/, ""), 'base64');
        const fileContent = {
          Bucket: folder,
          Key: fileName, //* Need to maintain unique images 
          Body: base64Data,
          ACL: 'public-read',
          ContentEncoding: 'base64', // required
          ContentType: `image/${ext}` // required. Notice the back ticks
        };
        const url = `https://${folder}.s3.${REGION}.amazonaws.com/${fileName}`;
        delete req.body.base64String;
        const record = { ...req.body, url, fileContent };
        const result = await uploadService(record);
        return success(res, 201, result);
      } catch (error) {
        loging(module, req, error);
        return fail(res, 400, `${error.message}`);
      }
    }
  
  async function uploadService(data) {
      try {
        const { error } = validateCreate.validate(data);
        if (error) throw new Error(`Error validating ${module} data. ${error.message}`);
        const command = new PutObjectCommand(data.fileContent);
        const response = await s3Client.send(command);
        if (response && response['$metadata'] && response['$metadata'].httpStatusCode === 200) {
          const newRecord = new Media(data);
          const result = await newRecord.save();
          return result;
        }
        throw new Error("unable to upload file");
      } catch (err) {
        throw new Error(`Error creating file record. ${err.message}`);
      }
    }
   

async function list() {
    const params = {
      Bucket: 'gifti',
      // Delimiter: '/PHOTO',
    };
    const result = await s3Client.listObjects(params).promise();
    console.dir(result);
    return result;
  }
  
  
  async function upload(data) {
    const time = new Date().toISOString().slice(0, 22);
    const fileData = {
      Bucket: this.amazonConfig.awsBucket,
      Key: `${data.type}/photo-${time}`,
      ACL: 'public-read',
    };
    if (data.base64String) {
      fileData.ContentEncoding = 'base64'; // required
      fileData.Body = Buffer.from(
        data.base64String.replace(/^data:image\/\w+;base64,/, ''),
        'base64'
      );
      const ext = data.base64String.split(';')[0].split('/')[1]; // Extension
      fileData.Key = `${fileData.Key}.${ext}`;
      fileData.ContentType = `image/${ext}`;
    } else if (data.dataBuffer) {
      fileData.Body = data.dataBuffer;
    } else {
      throw new Error(
        'Invalid request data: base64String and dataBuffer can not be null'
      );
    }
    // console.log({ fileData });
    const uploadResult = await s3Client.upload(fileData).promise();
    // console.log({ uploadResult });
    return uploadResult;
  }
  
  module.exports = {
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
  };
