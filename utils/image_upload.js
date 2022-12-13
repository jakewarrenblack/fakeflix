require('dotenv').config();
const AWS = require('aws-sdk');
AWS.config = new AWS.Config({
    accessKeyId: process.env.MY_AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.MY_AWS_SECRET_ACCESS_KEY,
    region: process.env.MY_AWS_REGION,
});

const s3 = new AWS.S3();
const Bucket = process.env.MY_AWS_BUCKET;

// My name scheme follows a '1.png', '2.png' format, so need to find out how many objects there are in the S3 bucket first, and send this to the frontend.
function listAllKeys() {
    return new Promise((resolve, reject) => {
        const params = {
            Bucket,
        };
        s3.listObjectsV2(params, function (err, data) {
            if (err) {
                reject(err)
            } else {
                let contents = data.Contents;
                resolve(contents)
            }
        });
    })
}

// SOURCE: https://github.com/DiegoRodriguez2018/aws-s3-direct-upload
// Generating a URL for performing a putObject operation.
function generatePutUrl(Key, ContentType) {
    return new Promise((resolve, reject) => {
        // Key here is the file name
        // Content type will be 'image/png'
        const params = { Bucket, Key, ContentType };
        s3.getSignedUrl('putObject', params, function(err, url) {
            if (err) {
                reject(err);
            }
            // If there are no errors we can send back the pre-signed PUT URL
            resolve(url);
        });
    });
}

module.exports = { generatePutUrl, listAllKeys };