import {MqttDevice} from "./mqttDevice.js";
import packageJson from "./package.json" assert {type: 'json'};

export class Device extends MqttDevice {
    #deviceInfo;
    /** @type Rainsoft */
    #rainsoft;
    constructor(config, client, rainsoft, deviceInfo, locationName) {
        super(
            config,
            client,
            `${locationName} ${deviceInfo.name}`,
            `${locationName}${deviceInfo.name}`,
            deviceInfo.model,
            deviceInfo.id.toString(),
        );
        this.#deviceInfo = deviceInfo;
        this.#rainsoft = rainsoft;
    }

    publishDiscovery() {
        return this._publishDiscovery([
            {prop: "systemStatusName", name: "Status"},
            {prop: "regenTime", name: "Regen Time", device_class: "timestamp"},
            {prop: "installDate", name: "Install Date", device_class: "timestamp"},
            {prop: "registeredAt", name: "Registered At", device_class: "timestamp"},
            {prop: "serialNumber", name: "Serial Number"},
            {prop: "saltLbs", name: "Salt", device_class: "weight", unit_of_measurement: "lbs"},
            {prop: "maxSalt", name: "Max Salt", device_class: "weight", unit_of_measurement: "lbs"},
            {prop: "capacityRemaining", name: "Capacity Remaining", unit_of_measurement: "%"},
            {prop: "isVacationMode", name: "Vacation Mode", binary: true},
            {prop: "resinTypeName", name: "Resin Type"},
            {prop: "unitSizeName", name: "Unit Size"},
            {prop: "isSaltBuzzer", name: "Salt Alarm", binary: true},
            {prop: "firmwareVersion", name: "Firmware Version"},
            {prop: "pressure", name: "Pressure"},
            {prop: "ironLevel", name: "Iron Level", unit_of_measurement: "ppm"},
            {prop: "drainFlow", name: "Drain Flow"},
            {prop: "averageMonthlySalt", name: "Average Monthly Salt", device_class: "weight", unit_of_measurement: "lbs"},
            {prop: "water28Day", name: "Water used in the last 28 days", device_class: "volume", unit_of_measurement: "gal"},
            {prop: "flowSinceLastRegen", name: "Water used since last regen", device_class: "volume", unit_of_measurement: "gal"},
            {prop: "dailyWaterUse", name: "Daily water use", device_class: "volume", unit_of_measurement: "gal"},
            {prop: "lifeTimeFlow", name: "Lifetime water used", device_class: "volume", unit_of_measurement: "gal"},
            {prop: "regens28Day", name: "Regens in the last 28 days"},
            {prop: "hardness", name: "Water Hardness", device_class: "volatile_organic_compounds_parts", unit_of_measurement: "ppm"},
        ].reduce((acc, v) => ({
            ...acc,
            [v.prop]: {
                p: v.binary ? "binary_sensor" : "sensor",
                state_topic: `rainsoft/device/${this.#deviceInfo.id}/info`,
                unique_id: `rainsoft_device_${this.#deviceInfo.id}_${v.prop}`,
                value_template: v.binary ? `{% if value_json.${v.prop} %}ON{% else %}OFF{% endif %}` : `{{ value_json.${v.prop} }}`,
                name: v.name,
                device_class: v.device_class,
                unit_of_measurement: v.unit_of_measurement
            }
        }), {}))
    }

    #publishDeviceInfo(info) {
        return this._publish(`rainsoft/device/${this.#deviceInfo.id}/info`, {...this.#deviceInfo, ...info});
    }

    async updateDeviceInfo() {
        await this.#publishDeviceInfo(await this.#rainsoft.device(this.#deviceInfo.id));
    }
}