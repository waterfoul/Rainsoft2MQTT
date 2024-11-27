import packageJson from "./package.json" assert { type: 'json' };

export class MqttDevice {
    #config;
    #client;
    #humanName;
    #name;
    #model;
    #id;

    constructor(config, client, humanName, name, model, id) {
        this.#config = config;
        this.#client = client;
        this.#humanName = humanName;
        this.#name = name;
        this.#model = model;
        this.#id = id;
    }

    /**
     * Publish a topic
     * @param {string} topic - The topic to publish to
     * @param {object} payload - The payload
     * @return Promise<Packet>
     */
    _publish(topic, payload) {
        return new Promise((resolve, reject) => {
            this.#client.publish(
                topic,
                payload ? JSON.stringify(payload) : "",
                {qos: 0, retain: true},
                (err, result) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(result)
                    }
                }
            );
        });
    }

    /**
     * Publish discovery (internal)
     * @param {object} components - The components list
     * @return Promise<Packet>
     */
    _publishDiscovery(components) {
        return this._publish(
            `homeassistant/device/${this.#name}/${this.#id}/config`, {
                "device": {
                    "identifiers": [
                        this.#id.toUpperCase(),
                    ],
                    "name": this.#humanName,
                    "mf": "Rainsoft",
                    "mdl": this.#model
                },
                "o": {
                    "name": "rainsoft2mqtt",
                    "sw_version": packageJson.version,
                    "support_url": "https://github.com/waterfoul/Rainsoft2MQTT"
                },
                "cmps": components
            },
        )
    }

    /**
     * Publish discovery
     * @return Promise<Packet>
     */
    publishDiscovery() {
        throw new Error("NOT IMPLEMENTED");
    }
}