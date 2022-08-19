import db from "../models/index.js";
import axios from "axios";
const ImUsers = db.im_users;
const User = db.user;
import path from 'path'
import { uploadFileToAzure } from "../utils/uploadFileToAzure.js";
import fs from 'fs'


export const createImUsers = async (req, res) => {

  const file = req.file;
  console.log("---------logo save-------",file);

  const { sub } = req.kauth.grant.access_token.content;
  const authHeader = req.headers.authorization;
  const token = authHeader.split(" ")[1];

  let apiData = req.body.userData;
  apiData = JSON.parse(apiData)

  console.log("---------api data--------", apiData);

  let sendObj = {};
  sendObj.username = apiData.username;
  sendObj.email = apiData.email;
  sendObj.credentials = apiData.credentials;
  sendObj.groups = apiData.groups;
  sendObj.enabled = apiData.enabled;
  sendObj.firstName = apiData.firstName,
  sendObj.lastName = apiData.lastName;
  console.log("-------send obj---",sendObj);

  // console.log("---send--- object---",im_userObj);

  try {
    const keycloack_res = await axios.post(
      `${process.env.KEYCLOAK_AUTH_URL}admin/realms/washroom/users`,
      sendObj,
      {
        headers: {
          authorization: authHeader,
        },
      }
    );

    // console.log("-----keycloack_res----",keycloack_res);
    if (keycloack_res?.status === 201) {
      const userSubId = await axios.get(
        `${process.env.KEYCLOAK_AUTH_URL}admin/realms/washroom/users/?username=${apiData.username}`,
        {
          headers: {
            authorization: authHeader,
          },
        }
      );

      console.log("-----------userSubId-----", userSubId.data);

      




      // ------------------------------------

      let filesInfo ={}
      let logoUrl=''
   
      if(file!==undefined){
        filesInfo.path = path.join( process.cwd() ,process.env.UPLOAD_DIR, `/icons`,`${file.originalname}`)

        if (fs.existsSync(filesInfo.path)) {
     
         filesInfo.filename=`${file.originalname}`
     
       console.log("-----path-----",filesInfo);
     
       
        logoUrl =  await uploadFileToAzure('logo',filesInfo)
     
     
       console.log("-=-----------------",logoUrl);
        
       }
     

      }

  
   


      // -----------------------------------











      const userGropupId = await axios.get(
        `${process.env.KEYCLOAK_AUTH_URL}admin/realms/washroom/users/${userSubId.data[0].id}/groups`,
        {
          headers: {
            authorization: authHeader,
          },
        }
      );
      console.log("--------userGropupId-----", userGropupId.data);

      const roleList = await axios.get(
        `${process.env.KEYCLOAK_AUTH_URL}admin/realms/washroom/groups/${userGropupId.data[0].id}/role-mappings/realm`,
        {
          headers: {
            authorization: authHeader,
          },
        }
      );
      console.log("-------roleList--", roleList.data);

      const im_userObj = new ImUsers({
        subId:userSubId.data[0].id,
        username: apiData.username,
        email: apiData.email,
        role: apiData.groups[0],
        parentUser: apiData.parentUserId,
        parentRole: apiData.parentRole,
        logoId: apiData.logoId,
        profileLogoId:apiData.profileLogoId,
      });

      const save_res = await im_userObj.save();

      if(req.file!==undefined && logoUrl?.url!==undefined ){
        if(apiData.parentRole=== "Admin"){
          apiData.logoId= logoUrl.url
        }else{
          apiData.profileLogoId = logoUrl.url
        }
        
      }

    

      console.log("--------api data----",apiData);

      User.create({
        sub:userSubId.data[0].id,
        given_name:apiData.firstName,
        family_name:apiData.lastName,
        email:apiData.email,
        roles:roleList.data.map(d=>d.name),
        solutions: [],
        infrastructures: [],
        logo:apiData.logoId ,
        profile_logo: apiData.profileLogoId
      })
        .then((u) => {
          console.log("-----------------u-------------------",u);
         
          res.status(201).send("user created sucessfully")
        })

      // res.status(201).send("user created sucessfully");
    }
  } catch (error) {
    console.log("----errrr0--", error);

    res.status(error.response.status).send(error.response.statusText);
  }
};

export const getImUsers = async (req, res) => {
  try {
    const userId = req.query.id;

    const all_im_users = await ImUsers.find({ parentUser: userId });

    let arrayTwo = all_im_users;

    const authHeader = req.headers.authorization;
    const keycloack_res = await axios.get(
      `${process.env.KEYCLOAK_AUTH_URL}admin/realms/washroom/users`,
      {
        headers: {
          authorization: authHeader,
        },
      }
    );
    let arrayOne = keycloack_res?.data;

    if (keycloack_res?.status === 200) {
      const results = arrayOne.filter(({ email: id1 }) =>
        arrayTwo.some(({ email: id2 }) => id2 === id1)
      );

      res.status(200).send(results);
    }
  } catch (error) {
    console.log("---error---", error);
    res.status(error.response.status).send(error.response.statusText);
  }
};

export const getImUsersByUserName = async (req, res) => {
  const username = req.query.username;

  console.log("-----------username----", username);
  let dta = await ImUsers.find({ username: username });
  console.log("-------dta----------", dta);
  res.send(dta);
};

export const getImUsersByParentId = async (req, res) => {
  const parentId = req.query.parentId;

  console.log("-----------parentId---", parentId);
  let dta = await ImUsers.find({ parentUser: parentId });
  console.log("-------dta----------", dta);
  res.send(dta);
};

export const getCustomerLogo = async (req, res) => {
  const username = req.query.username;

  console.log("-----------username----", username);
  let dta = await ImUsers.findOne({ username: username });

  let custInfo = await User.findOne({ sub: dta.logoId });
  console.log("'----------------cust info--------", custInfo);
  dta.logoId = custInfo?.logo;
  console.log("-------dta-- customer--------", dta);
  res.send(dta);
};



