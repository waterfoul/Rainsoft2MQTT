import {MqttDevice} from "./mqttDevice.js";
import packageJson from "./package.json" assert {type: 'json'};
import {DateTime} from "luxon";

export class Application extends MqttDevice {
    constructor(config, client) {
        super(
            config,
            client,
            "Rainsoft 2 MQTT",
            "rainsoft2mqtt",
            "rainsoft2mqtt",
            "app"
        );
    }

    publishDiscovery() {
        return this._publishDiscovery({
            "refresh": {
                "p": "button",
                "command_topic": "rainsoft/application/refresh",
                "unique_id": "rainsoft_refresh",
                "name": "Refresh Data"
            },
            "version": {
                "p": "sensor",
                "state_topic": "rainsoft/application/version",
                "unique_id": "rainsoft_version",
                "value_template": "{{ value_json.version }}",
                "name": "Version"
            },
            "customer_id": {
                "p": "sensor",
                "state_topic": "rainsoft/application/customer",
                "unique_id": "rainsoft_customer_id",
                "value_template": "{{ value_json.id }}",
                "name": "Customer Id"
            },
            "email": {
                "p": "sensor",
                "state_topic": "rainsoft/application/customer",
                "unique_id": "rainsoft_customer_email",
                "value_template": "{{ value_json.email }}",
                "name": "Customer Email"
            },
            "name": {
                "p": "sensor",
                "state_topic": "rainsoft/application/customer",
                "unique_id": "rainsoft_customer_name",
                "value_template": "{{ value_json.firstName }} {{ value_json.lastName }}",
                "name": "Customer Name"
            },
            "address": {
                "p": "sensor",
                "state_topic": "rainsoft/application/customer",
                "unique_id": "rainsoft_customer_address",
                "value_template": "{{ value_json.line1 }}\n{{ value_json.line2 }}\n{{ value_json.city }}, {{ value_json.stateCode }} {{ value_json.zip }}",
                "name": "Customer Address"
            },
            "lastUpdate": {
                "p": "sensor",
                "state_topic": "rainsoft/application/customer",
                "unique_id": "rainsoft_customer_lastUpdate",
                "value_template": "{{ value_json.lastUpdate }}",
                "name": "LastUpdate",
                "device_class": "timestamp"
            }
        });
    }

    publishVersion() {
        return this._publish("rainsoft/application/version", {version: packageJson.version});
    }

    publishCustomerInformation(information) {
        return this._publish("rainsoft/application/customer", {...information, lastUpdate: DateTime.now().toISO()});
    }
}