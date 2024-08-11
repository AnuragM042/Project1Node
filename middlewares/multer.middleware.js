import multer from 'multer'

const storage = multer.diskStorage({
    destination: function(req, file, cb){ // req handels json but not file so import file too 
        cb(null, './public/temp') // directory inside my Projecr1
    },
    filename: function (req,file, cb){
    //     const uniqueSuffix = Date.now() = '-' + Math.round
    // (Math.random() * 1E9)              // not really needed for now 
    cb(null, file.originalname) // will upload file with original name (can cause error as same name will overwrite )
     // will only save file for some time 
    }
})

export const upload = multer({
    storage,
})