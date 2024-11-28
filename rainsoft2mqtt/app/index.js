import axios from "axios";
import dotenv from "dotenv";
import mqtt from "mqtt";
import {Application} from "./application.js";
import {Rainsoft} from "./rainsoft.js";
import {Device} from "./device.js";
import {DateTime} from "luxon";

dotenv.config()

const config = await (async () => {
    const config = {
        "username": process.env.RAINSOFT_USERNAME ?? "",
        "password": process.env.RAINSOFT_PASSWORD ?? "",
        "mqttUri": process.env.MQTT_URI ?? "",
        "mqttUsername": process.env.MQTT_USERNAME ?? "",
        "mqttPassword": process.env.MQTT_PASSWORD ?? "",
        "refreshRate": process.env.REFRESH_RATE ? parseInt(process.env.REFRESH_RATE) : 5,
    }
    if (process.env.SUPERVISOR_TOKEN) {
        const supervisorApi = process.env.SUPERVISOR_API ?? "http://supervisor"

        const addonConfig = await axios.get(`${supervisorApi}/addons/self/options/config`, {
            headers: {
                Authorization: `Bearer ${process.env.SUPERVISOR_TOKEN}`
            }
        });

        config.username = addonConfig.data.username ?? "";
        config.password = addonConfig.data.password ?? "";
        config.mqttUri = addonConfig.data.mqttUri ?? "";
        config.mqttUsername = addonConfig.data.mqttUsername ?? "";
        config.mqttPassword = addonConfig.data.mqttPassword ?? "";
        config.refreshRate = addonConfig.data.refreshRate ?? "";

        if (!config.mqttUri || !config.mqttUsername || !config.mqttPassword) {
            const mqttResult = await axios.get(`${supervisorApi}/services/mqtt`, {
                headers: {
                    Authorization: `Bearer ${process.env.SUPERVISOR_TOKEN}`
                }
            });
            console.log(mqttResult.data);
            config.mqttUri = config.mqttUri || `mqtt${mqttResult.data.ssl ? "s" : ""}://${mqttResult.data.host}:${mqttResult.data.port}`
            config.mqttUsername = config.mqttUsername || mqttResult.data.username;
            config.mqttPassword = config.mqttPassword || mqttResult.data.password;
        }
    }
    return config;
})();

const client = mqtt.connect(config.mqttUri, {
    clientId: "mqtt_rainsoft2mqtt",
    clean: true,
    connectTimeout: 4000,
    username: config.mqttUsername,
    password: config.mqttPassword,
    reconnectPeriod: 1000,
})
const application = new Application(config, client);
const rainsoft = new Rainsoft(config);
let intervals = []

async function loadData() {
    for(const interval of intervals) {
        clearInterval(interval);
    }

    const customer = await rainsoft.customer()
    await application.publishCustomerInformation(customer);
    const locations = await rainsoft.locations(customer.id);

    for (const location of locations.locationListData) {
        for(const device of location.devices) {
            const deviceObj = new Device(config, client, rainsoft, device, location.name);
            await deviceObj.publishDiscovery();
            await deviceObj.updateDeviceInfo();
            intervals.push(setInterval(() => deviceObj.updateDeviceInfo(), config.refreshRate * 60 * 60 * 1000))
        }
    }
}

client.on('connect', async () => {

    client.subscribe(["rainsoft/application/refresh"], () => {
        console.log("Subscribed to rainsoft/application/refresh");
    })

    await application.publishDiscovery();
    await application.publishVersion();
    await loadData();
});

client.on('error', (e) => {
    if (e.code === 5) { // Connection refused: Not authorized
        throw e;
    } else {
        console.error('ERROR', e);
    }
});

client.on("message", async (topic, message) => {
    if(topic === "rainsoft/application/refresh") {
        console.log("Refreshing Data");
        rainsoft.clearData();
        await loadData();
        console.log("Done");
    } else {
        console.log("message", topic, message.toString());
    }
});
