import mongoose from "mongoose";
import user from "./user.js";
import site from "./site.js"
import purchase from "./purchase.js"
import energy_consumption from "./energy_consumption.js"
import work_order from "./work_order.js"
import washroom from "./washroom.js"
import wellness from "./wellness.js";
import sensor from "./sensor.js"
import sensor_type from "./sensor_type.js"
import infrastructure from "./infrastructure.js"
import floor from "./floor.js"
import component from "./component.js"
import gateway from "./gateway.js"
import room from "./room.js"
import ImUsers from "./im_users.js";
import sensor_data from './sensor_data.js'
import sensor_config from './sensor_configuration.js'
import publish_data from './publish_data.js'
import device_configuration from './device_configuration.js'
import GatewayTopicInfo from "./gateway_topic_info.js";
import PlotlyDashboard from './ploty_dash.js'
import solution from './solution.js'
import Applications from './applications.js'


mongoose.Promise = global.Promise;

const db = {};

db.mongoose = mongoose;

db.user = user;
db.site = site;
db.purchase = purchase;
db.energy_consumption = energy_consumption;
db.work_order = work_order;
db.washroom = washroom;
db.wellness = wellness;
db.room = room;
db.sensor = sensor;
db.sensor_type = sensor_type;
db.infrastructure = infrastructure;
db.floor = floor;
db.component = component;
db.gateway = gateway;
db.im_users = ImUsers;
db.sensor_data = sensor_data,
    db.sensor_config = sensor_config
db.publish_data = publish_data
db.device_configuration = device_configuration
db.gateway_topic_info = GatewayTopicInfo
db.ploty_dash = PlotlyDashboard
db.solution = solution

db.Applications = Applications
export default db;
