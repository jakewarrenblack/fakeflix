const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
    fileFilter: (req, file, cb) => {
        if (!file) {
            return cb(new Error("No image found"), false);
        } else if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
            return cb(new Error("Only image files are allowed"), false);
        }
        cb(null, true);
    },
    destination: (req, file, cb) => {
        cb(null, "public" + process.env.STATIC_FILES_URL);
    },
    filename: (req, file, cb) => {
        console.log(file.pathname);
        console.log(file.originalname);

        cb(null, Date.now() + path.extname(file.originalname));
    },
});

module.exports = multer({
    storage: storage,
});
