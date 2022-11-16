const crypto = require('crypto')
const axios = require('axios')
import { getModeParams } from './modes'
import {
    HeaderConfig,
    Device,
    Mode
} from './tempco.d'

const srv_addr = 'https://e3.lvi.eu'


const authenticationFailed = ({ data }: {
    data: {
        code: {
            code: string
            key: string
            value: string
        },
        data: any,
        parameters: any
    }
}) => (
    /**
     * Server returns this if the authentication has been failed.
     * For instance, token has expired
    {
        code: { code: '6', key: 'ERR_AUTH', value: 'Authentication failed' },
        data: {},
        parameters: {
        q: 'smarthome',
        func: 'read',
        source: 'human',
        api_version: 'v0.1'
        }
    }
    */
    data.code.key === 'ERR_AUTH'
)

const hashPassword = (password: string): string => crypto.createHash('md5').update(password).digest('hex')


const headers_config: HeaderConfig = {
    headers: {
        "User-Agent": "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:89.0) Gecko/20100101 Firefox/89.0",
        "Accept": "application/json",
        "Accept-Language": "en-US,en;q=0.5",
        "Content-Type": "application/x-www-form-urlencoded",
        "Origin": "https://e3.lvi.eu",
        "Connection": "keep-alive"
    }
}



const login = (username: string, password: string): Promise<string>  => {
    return new Promise((res, rej) => {

        const params = new URLSearchParams()
        params.append('email', username)
        params.append('password', hashPassword(password))
        params.append('remember_me', 'true')
        params.append('lang', 'fi_FI')
        


        axios.post(srv_addr + '/api/v0.1/human/user/auth/', params, headers_config)
            .then((response: any) => {
                try {
                    const token = response.data.data.token
                    res(token)
                } catch (error) {
                    rej(error.message)
                }
            })
    })
}

// Returns smarthome_id
const getHomes = (email: string, token: string): Promise<string> => {
    return new Promise((res, rej) => {

        const params = new URLSearchParams()
        params.append('token', token)
        params.append('email', email)
        params.append('lang', 'fi_FI')

        axios.post(srv_addr + '/api/v0.1/human/user/read/', params, headers_config)
            .then((response: any) => {
                if (authenticationFailed(response)) {
                    rej({
                        authenticationFail: true
                    })
                }
                try {
                    const smarthome_id = response.data.data.smarthomes[0].smarthome_id
                    res(smarthome_id)
                } catch (error) {
                    rej(error.message)
                }
            })

    })
}

const getDevices = async (token: string, smarthome_id: string): Promise<Array<Device>> => {
    return new Promise((res, rej) => {

        const params = new URLSearchParams()
        params.append('token', token)
        params.append('smarthome_id', smarthome_id)
        params.append('lang', 'fi_FI')

        axios.post(srv_addr + '/api/v0.1/human/smarthome/read/', params, headers_config)
            .then((response: any) => {
                if (authenticationFailed(response)) {
                    rej({
                        authenticationFail: true
                    })
                }
                try {
                    // Server does not give array of devices in a response,
                    // it gives object that contains objects with string keys.
                    // Convert it to object that consists array of objects
                    const devices = <Array<Device>>Object.values(response.data.data.devices)
                    res(devices)
                } catch (error) {
                    rej(error.message)
                }
            })
            .catch((err: any) => {})
    })
}

const changeTemperature = async (token: string, smarthome_id: string, id_device: string, mode: Mode, celsius: number) => {
    return new Promise((res, rej) => {

        // Create packet for specific mode
        const params = getModeParams('comfort', {
            token,
            smarthome_id,
            id_device,
            celsius
        })
        
        axios.post(srv_addr + '/api/v0.1/human/query/push/', params, headers_config)
            .then((response: any) => {
                if (authenticationFailed(response)) {
                    rej({
                        authenticationFail: true
                    })
                }
                return response.data
            })
            .then((response: any) => {
                /*
                @Success:
                { 
                    code:
                        { code: '8', key: 'OK_SET', value: 'Insert / update success' },
                    data:
                        { 
                            token: '<token>',
                            idquery: 'query:<smarthome_id>:<epoch_seconds>.<four_numbers_after_decimal_point>' 
                        },
                    parameters:
                        {
                            q: 'query',
                            func: 'push',
                            source: 'human',
                            api_version: 'v0.1' 
                        }
                }
                 */
                try {
                    response.code ? res(response) : rej('Could not fetch server\'s status code')
                } catch (error) {
                    rej(error.message)
                }
            })
    })
}


export {
    login,
    getHomes,
    getDevices,
    changeTemperature,
}