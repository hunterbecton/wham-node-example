const { Storage } = require('@google-cloud/storage');
const path = require('path');

const GOOGLE_CLOUD_PROJECT_ID = 'wham-283204';
const GOOGLE_CLOUD_KEYFILE = path.join(
  __dirname,
  '../wham-283204-0052d1029e60.json'
);

exports.storage = new Storage({
  projectId: GOOGLE_CLOUD_PROJECT_ID,
  keyFilename: GOOGLE_CLOUD_KEYFILE,
});

exports.getPublicUrl = (bucketName, fileName) =>
  `https://storage.googleapis.com/${bucketName}/${fileName}`;
