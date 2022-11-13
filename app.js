const crypto = require('crypto')
const axios = require('axios')
const { getModeParams } = require('./modes')

const srv_addr = 'https://e3.lvi.eu'

const hashPassword = (password) => crypto.createHash('md5').update(password).digest('hex')


const headers_config = {
    headers: {
        "User-Agent": "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:89.0) Gecko/20100101 Firefox/89.0",
        "Accept": "application/json",
        "Accept-Language": "en-US,en;q=0.5",
        "Content-Type": "application/x-www-form-urlencoded",
        "Origin": "https://e3.lvi.eu",
        "Connection": "keep-alive"
    }
}



const login = (username, password) => {
    return new Promise((res, rej) => {

        const params = new URLSearchParams()
        params.append('email', username)
        params.append('password', hashPassword(password))
        params.append('remember_me', 'true')
        params.append('lang', 'fi_FI')
        


        axios.post(srv_addr + '/api/v0.1/human/user/auth/', params, headers_config)
            .then(response => {
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
const getHomes = (email, token) => {
    return new Promise((res, rej) => {

        const params = new URLSearchParams()
        params.append('token', token)
        params.append('email', email)
        params.append('lang', 'fi_FI')

        axios.post(srv_addr + '/api/v0.1/human/user/read/', params, headers_config)
            .then(response => {
                try {
                    const smarthome_id = response.data.data.smarthomes[0].smarthome_id
                    res(smarthome_id)
                } catch (error) {
                    rej(error.message)
                }
            })

    })
}

const getDevices = async (token, smarthome_id) => {
    return new Promise((res, rej) => {

        const params = new URLSearchParams()
        params.append('token', token)
        params.append('smarthome_id', smarthome_id)
        params.append('lang', 'fi_FI')

        axios.post(srv_addr + '/api/v0.1/human/smarthome/read/', params, headers_config)
            .then(response => {
                try {
                    // Server does not give array of devices in a response,
                    // it gives object that contains objects with string keys.
                    // Convert it to object that consists array of objects
                    const devices = Object.values(response.data.data.devices)
                    
                    res(devices)
                } catch (error) {
                    rej(error.message)
                }
            })
    })
}

const changeTemperature = async (token, smarthome_id, id_device, mode, celsius) => {
    return new Promise((res, rej) => {

        // Create packet for specific mode
        const params = getModeParams('comfort', {
            token,
            smarthome_id,
            id_device,
            celsius
        })
        
        axios.post(srv_addr + '/api/v0.1/human/query/push/', params, headers_config)
            .then(response => response.data)
            .then(response => {
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


const app = async () => {

    const username = 'my_email@example.com'
    const password = 'my_password'

    const token = await login(username, password)
    
    console.log("YOUR TOKEN IS ", token)

    const smarthome_id = await getHomes(username, token)

    console.log("YOUR SMARTHOME ID IS ", smarthome_id)

    const devices = await getDevices(token, smarthome_id)

    console.log("YOUR DEVICES ARE", devices)
    
    const first_device_id = devices[0].id_device

    console.log("FIRST DEVICE ID IS ", first_device_id)

    const status = await changeTemperature(
        token,
        smarthome_id,
        first_device_id,
        'comfort',
        19   // New temperature in celsius
    )

    console.log(status)
}



app()