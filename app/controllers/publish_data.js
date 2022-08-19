import db from "../models/index.js";
const PublishData = db.publish_data

export const isExitPublish = async  (req,res)=>{
    try {
        let isExits = await PublishData.exists({host:req.query.host,topic:req.query.topicname,port:req.query.port})
        res.status(200).send(isExits)
        
    } catch (error) {
        
    }

}

export const getPublishDataById = async (req,res) =>{
    try {
        let deviceId = req.params.deviceId;
        let data = await PublishData.find({device_id:deviceId})
        res.status(200).send(data);
        
    } catch (error) {
        console.log("---error--",error);
        
    }
}