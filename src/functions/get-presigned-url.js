const ulid = require('ulid')
const AWS = require('aws-sdk')
const s3 = new AWS.S3()
const { BUCKET_NAME } = process.env

module.exports.handler = async (event) => {
    console.log ('EVENT : ', event)
    // metadata must be key value pairs of strings
    const imageId = ulid.ulid()
    let payload = event.arguments
    payload.patientId = event.identity.username
    payload.imageId = imageId

    const params = {
      Bucket: BUCKET_NAME,
      Key: imageId,
      Expires: 600,
      ContentType: event.arguments.contentType,
      ACL: 'public-read',
      Metadata: payload
    }
    const presignedURL = s3.getSignedUrl('putObject', params)
    return presignedURL
}