const express = require("express");
const router = express.Router();
const {loginRequired} = require("../controllers/auth_controller");
const {createData, viewAll, updateAvatar, deleteAvatar} = require("../controllers/avatar_controller");
// Object with methods inside it
const imageUpload = require('../utils/image_upload')

// Importing AWSPresigner
const {
    generateGetUrl,
    generatePutUrl,
    listAllKeys
} = require('../utils/image_upload');



// LoginRequired on all of these paths, applied at the route level rather than individual paths
router
    .get("/all", viewAll)
    .post("/",loginRequired, createData)
    // A user might optionally pass an image to upload when editing
    //.put("/:id", imageUpload.single("file"), loginRequired,updateAvatar)
    .delete("/:id", loginRequired, loginRequired,deleteAvatar);
    // Necessary to get a count of all objects in the bucket, in order to name the upload appropriately
    router.get('/list-objects', (req, res) => {
        // Both Key and ContentType are defined in the client side.
        // Key refers to the remote name of the file.
        listAllKeys()
            .then(data => {
                res.send(data);
            })
            .catch(err => {
                res.send(err);
            });
    });
    // GET URL
    router.get('/generate-get-url', (req, res) => {
        // Both Key and ContentType are defined in the client side.
        // Key refers to the remote name of the file.
        const { Key } = req.query;
        generateGetUrl(Key)
            .then(getURL => {
                res.send(getURL);
            })
            .catch(err => {
                res.send(err);
            });
    });

    // PUT URL
    router.get('/generate-put-url', (req,res)=>{
        // Both Key and ContentType are defined in the client side.
        // Key refers to the remote name of the file.
        // ContentType refers to the MIME content type, in this case image/jpeg
        const { Key, ContentType } =  req.query;
        generatePutUrl(Key, ContentType).then(putURL => {
            res.send({putURL});
        })
            .catch(err => {
                res.send(err);
            });
    });

module.exports = router;
