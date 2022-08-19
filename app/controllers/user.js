import db from "../models/index.js";
import fs from "fs";
import { dynamicDB } from "../utils/dynamicDB.js";
import { uploadFileToAzure } from "../utils/uploadFileToAzure.js";
import path from 'path'

const User = db.user;
const Site = db.site;
const ImUsers = db.im_users;


export const allAccess = (req, res) => {
  res.status(200).send("Public Content.");
};

export const userBoard = (req, res) => {
  res.status(200).send("User Content.");
};

export const adminBoard = (req, res) => {
  res.status(200).send("Admin Content.");
};

export const moderatorBoard = (req, res) => {
  res.status(200).send("Moderator Content.");
};

export const verifyToken = (req, res) => {
  const {
    sub,
    given_name,
    family_name,
    email,
    roles,
  } = req.kauth.grant.access_token.content;
  User.findOne({ sub: sub }).exec((err, user) => {
    if (err) {
      console.log(err);
    } else {
      if (!user) {
        User.create({ sub, given_name, family_name, email, roles })
          .then((u) =>
            console.log(`User ${u.given_name} ${u.family_name} created`)
          )
          .catch((e) => console.log(e));
      }
    }
  });
  res.status(200).send("Token valid.");
};

export const getUserInfo = (req, res) => {
  const {
    sub,
    given_name,
    family_name,
    email,
    roles
  } = req.kauth.grant.access_token.content;
  User.findOne({ sub: sub })
    .populate({ path: "infrastructures" })
    .exec((err, user) => {
      if (err) {
        console.log(err);
      } else {
        // console.log("----------------user--------------------",user);
        if (!user) {
          User.create({
            sub,
            given_name,
            family_name,
            email,
            roles,
            solutions: [],
            infrastructures: [],
          })
            .then((u) => {
              console.log("-----------------u-------------------",u);
              console.log(`User ${u.given_name} ${u.family_name} created`);
              dynamicDB(u.sub,u.given_name)
              res.status(200).send(u);
            })
            .catch((e) => {
              console.log(e);
              res.status(400).send("User not found");
            });
        } else {
          res.status(200).send(user);
        }
      }
    });
};

export const getSites = async (req, res) => {
  const roles = req.kauth.grant.access_token.content.roles;
  if (roles.includes("admin")) {
    Site.find().exec((err, sites) => {
      if (err) {
        console.log(err);
        res.status(400).send(err);
      }
      res.status(200).send(sites);
    });
  } else {
    const names = req.kauth.grant.access_token.content.sites.split(",");
    Site.find({ name: { $in: names } }).exec((err, sites) => {
      if (err) {
        console.log(err);
        res.status(400).send(err);
      }
      res.status(200).send(sites);
    });
  }
};

export const getSite = async (req, res) => {
  const { siteId } = req.params;
  Site.findById(siteId).exec((err, site) => {
    if (err) {
      console.log(err);
      res.status(400).send(err);
    }
    if (!site) res.status(400).send({ message: "Site not found" });
    site
      .populate("purchases")
      .populate("work_orders")
      .populate("energy_consumptions")
      .execPopulate()
      .then((resolve, reject) => {
        if (reject) {
          console.log(reject);
          res.status(400).send(reject);
        }
        res.status(200).send(resolve);
      });
  });
};

export const addSolution = async (req, res) => {
  const { sub } = req.kauth.grant.access_token.content;
  const { solution } = req.body;
  const user = await User.findOne({ sub: sub }).exec();
  if (!user) {
    res.status(400).send("User not found");
    return;
  }
  const solutions = user.solutions;
  if (!solutions.includes(solution)) {
    solutions.push(solution);
    solutions.sort();
  }
  const newUser = await User.findByIdAndUpdate(user._id, {
    solutions: solutions,
  })
    .populate({ path: "infrastructures" })
    .exec();
  if (newUser) {
    res.status(200).send({ ...newUser._doc, solutions });
  } else {
    res.status(500).send("Failed to add solutions");
  }
};

export const removeSolution = async (req, res) => {
  const { sub } = req.kauth.grant.access_token.content;
  const { solution } = req.body;
  const user = await User.findOne({ sub: sub }).exec();
  if (!user) {
    res.status(400).send("User not found");
    return;
  }
  const solutions = user.solutions.filter((s) => s !== solution);
  const newUser = await User.findByIdAndUpdate(user._id, {
    solutions: solutions,
  })
    .populate({ path: "infrastructures" })
    .exec();
  if (newUser) {
    res.status(200).send({ ...newUser._doc, solutions });
  } else {
    res.status(500).send("Failed to add solutions");
  }
};

export const uploadLogo = async (req, res) => {
  const { sub } = req.kauth.grant.access_token.content;
  const file = req.file;
  console.log("--------file------",file);
  if (!file) {
    res.status(404).send("Please upload an image");
  }
  const user = await User.findOne({ sub: sub }).exec();
  if (!user) {
    res.status(400).send("User not found");
    return;
  }

  let filesInfo ={}

   filesInfo.path = path.join( process.cwd() ,process.env.UPLOAD_DIR, `${sub}`,`${file.originalname}`)

   filesInfo.filename=`${file.originalname}`

  console.log("-----path-----",filesInfo);

  
  let logoUrl =  await uploadFileToAzure('logo',filesInfo)
  // console.log("----uel---",url);
  // const logoUrl = `/user/${sub}/logo/${file.originalname}`;
  const newUser = await User.findByIdAndUpdate(user._id, {
    logo: logoUrl.url,
  })
    .populate({ path: "infrastructures" })
    .exec();
  if (newUser) {
    res.status(200).send({ ...newUser, logo: logoUrl.url });
  } else {
    res.status(500).send("Failed to add solutions");
  }
};

export const getLogo = async (req, res) => {
  const { subId, fileName } = req.params;
  const file = `${process.env.UPLOAD_DIR}/${subId}/${fileName}`;
  if (fs.existsSync(file)) {
    console.log("--------exyyr-----------------");
    res.sendFile(file); // Set disposition and send it.
  } else {
    res.send("File not found!", 404);
  }
};

export const getCustomerLogo = async (req,res) =>{
  const { subId} = req.params
  const type =  req.query.type;
  console.log("------sub----------", subId);
  let cust_info =  await User.findOne({sub:subId})
  console.log("------cust_info----",cust_info);
  if(type=== "profile"){
    res.status(200).send(cust_info.profile_logo)
  }else{
    res.status(200).send(cust_info.logo)
  }
}

export const profileLogo = async (req,res) => {
  const { sub } = req.kauth.grant.access_token.content;

  const file = req.file;
  console.log("--------file------",file);
  if (!file) {
    res.status(404).send("Please upload an image");

    
  }
  else {
    let filesInfo ={}

    filesInfo.path = path.join( process.cwd() ,process.env.UPLOAD_DIR, `${sub}`,`${file.originalname}`)
 
    filesInfo.filename=`${file.originalname}`
    console.log("----file.originalname----",file.originalname);
 
   console.log("-----path-----",filesInfo);
 
   
   let logoUrl =  await uploadFileToAzure('logo',filesInfo)
   console.log("-------------logo url-------", logoUrl);
   const user = await User.findOne({ sub: sub }).exec();
   console.log("--user-",user);
   const updateProfileLogo = await User.findByIdAndUpdate({_id:user._id}, {
     profile_logo: logoUrl?.url
   })
   console.log("------updateProfileLogor---",updateProfileLogo);
   res.status(200).send("Profile logo upload successfully");
  }



  


  
}

export const getUserInfoBySub= async (req, res) => {
  const { subId } = req.params;

  const  userInfo = await User.findOne({sub:subId})
  res.status(200).send(userInfo);
  
};

export const subUserInfo  = async (req,res) =>{
  const { sub } = req.kauth.grant.access_token.content;
  let subId =sub
  let Im_user = await ImUsers.findOne({subId:subId})
  subId=Im_user.parentUser
  User.findOne({ sub: subId})
    .populate({ path: "infrastructures" })
    .exec((err, user) => {
      if (err) {
        console.log(err);
      } else {
        // console.log("----------------user--------------------",user);
        if (!user) {
          // User.create({
          //   sub,
          //   given_name,
          //   family_name,
          //   email,
          //   roles,
          //   solutions: [],
          //   infrastructures: [],
          // })
          //   .then((u) => {
          //     console.log("-----------------u-------------------",u);
          //     console.log(`User ${u.given_name} ${u.family_name} created`);
          //     dynamicDB(u.sub,u.given_name)
          //     res.status(200).send(u);
          //   })
          //   .catch((e) => {
          //     console.log(e);
          //     res.status(400).send("User not found");
          //   });
        } else {
          res.status(200).send(user);
        }
      }
    });



}
