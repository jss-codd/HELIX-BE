
import db from "../models/index.js";
import mongoose from "mongoose";
const Wellness = db.wellness;
const Washroom = db.washroom;
const Solution = db.solution;
const Gateway = db.gateway;
const Floor = db.floor;
// const Infrastructure = db.infrastructure;
// const Floor = db.floor



export const mongo_add_solutuions = async () => {
    console.log("running this file");

    // Washroom.find().forEach(function(obj){ 
    //     console.log(obj,"this is the obj of wellness");
    //  });
    Wellness.find().then(async (wellness) => {
        wellness.forEach((wellness) => {
            let obj = wellness;
            let sensors = wellness?.sensors?.map(s => mongoose.Types.ObjectId(s));
            Solution.create(
                {
                    ...obj,
                    _id:mongoose.Types.ObjectId(obj._id),
                    sensors: sensors,
                    type:obj.type,
                    solution: 'wellness'
                }
            );
        });
    });
    Washroom.find().then(async (washroom) => {
        washroom.forEach(async (washroom) => {
            let obj = washroom;
            let sensors = washroom?.sensors?.map(s => mongoose.Types.ObjectId(s));
           await  Solution.create(
                {
                    ...obj,
                    sensors: sensors,
                    solution: 'washroom'
                }
            );
        });
    });

    Floor.find().then(async (floor) => {
        floor.forEach(async (floor) => {
            let obj = floor;
            console.log(floor, "floor" ,"---obj----",obj?.wellnesses);
            let wellness =  obj?.wellnesses?.map(s => mongoose.Types.ObjectId(s));
            let washroom = obj?.washrooms?.map(s => mongoose.Types.ObjectId(s));
            console.log("---------ggg---------", wellness ,'----------',washroom);
            let solutions = wellness.concat(washroom);
            console.log(solutions, "solutions")
            const res = await Floor.updateOne({ '_id': floor._id },
                { '$set': { 'solutions': solutions } })

            console.log(res, "res>>>>>>>>>>>>>")
        });
    });

    Gateway.find().then(async (gateway) => {
        gateway.forEach(async (gateway) => {
            let obj = gateway;
            let sol
            if (obj.solution === 'washroom') {
                sol = mongoose.Types.ObjectId(obj.washroom)
            }
            else {
                sol = mongoose.Types.ObjectId(obj.wellness)

            }

            let solutionType = obj.solution
            console.log("-----------sfsf-----------",solutionType);
            const res = await Gateway.updateOne({ '_id': gateway._id },
                { '$set': { 'solution': sol, solutionType: solutionType } })
            console.log(res, "res>>>>>>>>>>>>>>>>>>")
        });
    });

}



// // db.mongoose
// //     .connect(process.env.DATABASE_URI, {
// //         useNewUrlParser: true,
// //         useUnifiedTopology: true,
// //         useFindAndModify: false
// //     })
// //     .then(async () => {
// //         console.log("Successfully connect to MongoDB in new file.");
// //         initial();
// //     });

