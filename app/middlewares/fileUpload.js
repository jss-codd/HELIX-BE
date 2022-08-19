import multer from "multer";
import fs from "fs";
import path from "path";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    console.log("------------------------",file);
    console.log(path.join( process.cwd() ,process.env.UPLOAD_DIR));
    if (file) {
      let dir = "";
      if (req.url.includes("logo")) {
        const { sub } = req.kauth.grant.access_token.content;
        dir = path.join( process.cwd() ,process.env.UPLOAD_DIR, `${sub}`);
      } else {
        dir = path.join(process.cwd(),process.env.UPLOAD_DIR, "icons");
      }
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      cb(null, dir);
    } else {
      cb(null, null);
    }
  },
  filename: function (req, file, cb) {
    console.log(file);
    if (file) {
      cb(null, file.originalname);
    } else {
      cb(null, null);
    }
  },
});

const upload = multer({ storage });

export default upload;
