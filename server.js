var storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, '/views/uploads')
    },
    filename: function (req, file, cb) {
      cb(null, file.fieldname + '-' + Date.now())
    }
  })
   
  var upload = multer({ storage: storage })