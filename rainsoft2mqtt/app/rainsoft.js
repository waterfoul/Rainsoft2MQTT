import {FlatCache} from 'flat-cache';
import axios from "axios";
import queryString from 'querystring';

export class Rainsoft {
    #cache = new FlatCache();
    #config;

    constructor(config) {
        this.#config = config;
        this.#cache.load();

        if (this.#cache.get('username') !== config.username || this.#cache.get('password') !== config.password) {
            this.#cache.clear();
            this.#cache.set('username', config.username);
            this.#cache.set('password', config.password);
            this.#cache.save();
        }
    }

    clearData() {
        const authentication_token = this.#cache.get('authentication_token');
        this.#cache.clear();
        this.#cache.set('username', this.#config.username);
        this.#cache.set('password', this.#config.password);
        this.#cache.set('authentication_token', authentication_token);
    }

    async #getHeaders(authenticated = true) {

        const headers = {
            "Accept": "application/json",
            "Accept-Encoding": "gzip, deflate",
            "Accept-Language": "en-US,en;q=0.9",
            "Connection": "keep-alive",
            "Host": "remind.rainsoft.com",
            "Origin": "http://localhost",
            "Referer": "http://localhost/",
            "Sec-Fetch-Dest": "empty",
            "Sec-Fetch-Mode": "cors",
            "Sec-Fetch-Site": "cross-site",
            "User-Agent": "Mozilla/5.0 (Linux; Android 12; sdk_gphone64_x86_64 Build/SE1A.211212.001.B1; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/91.0.4472.114 Safari/537.36",
            "X-Requested-With": "com.rainsoft.customer"
        }
        if (authenticated) {
            headers["X-Remind-Auth-Token"] = await this.#getAuthenticationToken();
        }
        return headers;
    }

    async #get(path) {
        try {
            const headers = await this.#getHeaders();
            await axios.options(`https://remind.rainsoft.com/api/remindapp/v2/${path}`, {headers: {
                ...headers,
                "Access-Control-Request-Headers": "x-remind-auth-token",
                "Access-Control-Request-Method": "GET"
            }});
            return await axios.get(`https://remind.rainsoft.com/api/remindapp/v2/${path}`, {
                headers
            })
        } catch (e) {
            if(e.response.data) {
                if(e.response.data.errors === "Customer Not Found") {
                    console.log("Token no longer valid, refreshing all data");
                    this.#cache.clear();
                    return this.#get(path);
                } else {
                    throw new Error(JSON.stringify({data: e.response.data, message: e.message}));
                }
            } else {
                throw e;
            }
        }
    }

    async #post(path, payload, authenticated = true) {
        try {
            return await axios.post(`https://remind.rainsoft.com/api/remindapp/v2/${path}`, queryString.stringify(payload).replace("%40", "@"), {
                headers: {
                    ...(await this.#getHeaders(authenticated)),
                    "Content-Type": "application/x-www-form-urlencoded",
                }
            })
        } catch (e) {
            if(e.response.data) {
                if(e.response.data.errors === "Customer Not Found") {
                    console.log("Token no longer valid, refreshing all data");
                    this.#cache.clear();
                    return this.#post(path, payload, authenticated);
                } else {
                    throw new Error(JSON.stringify(e.response.data));
                }
            } else {
                throw e;
            }
        }
    }

    async #getAuthenticationToken() {
        const cached = this.#cache.get('authentication_token')
        if (cached) {
            return cached;
        }
        const response = await this.#post('login', {
            email: this.#config.username,
            password: this.#config.password
        }, false);
        this.#cache.set('authentication_token', response.data.authentication_token);
        this.#cache.save();
        return response.data.authentication_token;
    }

    async customer() {
        const cached = this.#cache.get('customer')
        if (cached) {
            return cached;
        }
        const response = await this.#get("customer");
        this.#cache.set('customer', response.data);
        this.#cache.save();
        return response.data;
    }

    async locations(customerId) {
        const cached = this.#cache.get(`locations/${customerId}`);
        if (cached) {
            return cached;
        }
        const response = await this.#get(`locations/${customerId}`);
        this.#cache.set(`locations/${customerId}`, response.data, (this.#config.refreshRate - 1) * 60 * 60 * 1000);
        this.#cache.save();
        return response.data;
    }

    async device(deviceId) {
        const cached = this.#cache.get(`device/${deviceId}`);
        if (cached) {
            return cached;
        }
        const response = await this.#get(`device/${deviceId}`);
        this.#cache.set(`device/${deviceId}`, response.data, (this.#config.refreshRate - 1) * 60 * 60 * 1000);
        this.#cache.save();
        return response.data;
    }
}