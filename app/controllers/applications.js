import db from "../models/index.js";
import axios from "axios";
const Applications = db.Applications;
// const User = db.user;
import path from 'path'
import { uploadFileToAzure } from "../utils/uploadFileToAzure.js";
import fs from 'fs'


export const getApplications = async (req, res) => {
  try {
    let data = await Applications.find({});
    console.log(data, "applications")
    res.status(200).send(data);
  } catch (error) {
    res.status(403).send(error);
  }
};

export const createApplication = async (req, res) => {
  const file = req.file;
  const {
    sub,
    given_name,
    family_name,
    email,
    roles,
    group
  } = req.kauth.grant.access_token.content;
  console.log(group, "group");
  console.log(req.body, "group");
  const authHeader = req.headers.authorization;
  const token = authHeader.split(" ")[1];

  let apiData = req.body.applicationData;

  apiData = JSON.parse(apiData)
  console.log(apiData, "apiData");
  try {

    let filesInfo = {}
    let logoUrl = ''
    if (group?.length && group[0] === "/Admin") {
      let isExist = await Applications.exists({ name: apiData.name })
       if(isExist){
        res.status(409).send("Application already exist")
      }

      if (file !== undefined) {
        filesInfo.path = path.join(process.cwd(), process.env.UPLOAD_DIR, `/icons`, `${file.originalname}`)

        if (fs.existsSync(filesInfo.path)) {

          filesInfo.filename = `${file.originalname}`

          console.log("-----path-----", filesInfo);


          logoUrl = await uploadFileToAzure('logo', filesInfo)


          console.log("-=-----------------", logoUrl);

        }
      }
      Applications.create({
        name: apiData.name,
        description: apiData.description,
        active: apiData.active,
        logo: logoUrl.url,
        createBy: apiData.createBy,
      })
        .then((u) => {
          console.log("-----------------u-------------------", u);

          res.status(201).send("Exist")
        }).catch((e) => {
          // console.log(e,"e._message0")
          res.status(422).send(e._message);
        })

    } else {
      return res.status(401).send("user is not Admin")
    }

    // res.status(201).send("Application created sucessfully");
  }
  catch (error) {
    console.log("----errrr0--", error);

    res.status(error.response.status).send(error.response.statusText);
  }
};

export const updateApplicationById = async (req, res) => {

  const file = req?.file;
  const {
    sub,
    given_name,
    family_name,
    email,
    roles,
    group
  } = req.kauth.grant.access_token.content;
  let payload = req.params;

  let apiData = req.body.applicationData;

  apiData = JSON.parse(apiData)
  try {
    let filesInfo = {}
    let logoUrl = ''
    if (group?.length && group[0] === "/Admin") {

      if (file !== undefined) {
        filesInfo.path = path.join(process.cwd(), process.env.UPLOAD_DIR, `/icons`, `${file.originalname}`)

        if (fs.existsSync(filesInfo.path)) {

          filesInfo.filename = `${file.originalname}`

          console.log("-----path-----", filesInfo);


          logoUrl = await uploadFileToAzure('logo', filesInfo)


          console.log("-=-----------------", logoUrl);

        }
      }

      let obj = {
        name: apiData.name,
        description: apiData.description,
        active: apiData.active,
      }
      if (logoUrl?.url) {
        obj.logo = logoUrl?.url
      }

      const dta = await Applications.findByIdAndUpdate({ _id: payload.id }, obj)
      res.status(201).send("Applicaion updated successfully");
    } else {
      return res.status(401).send("user is not Admin")
    }
    // let response = await dta.save();

  } catch (error) {
    res.status(403).send(error);
  }
};

export const deleteApplicationById = async (req, res) => {

  const {
    sub,
    given_name,
    family_name,
    email,
    roles,
    group
  } = req.kauth.grant.access_token.content;

  try {
    let payload = req.params;
    if (group?.length && group[0] === "/Admin") {

      const dta = await Applications.findOneAndDelete({ _id: payload.id });

      // let response = await dta.save();
      res.status(201).send("Application Deleted Successfully");
    } else {
      return res.status(401).send("user is not Admin")
    }
  } catch (error) {
    res.status(403).send(error);
  }
};

export const isApplicationExist = async (req, res) => {

  try {
    let ApplicationName = req.params.ApplicationName;

    let isExist = await Sensor.exists({ name: ApplicationName })
    res.status(200).send(isExist)

  } catch (error) {
    res.status(403).send(error)
  }

}