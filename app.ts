import * as dotenv from 'dotenv'
import {
    login,
    getHomes,
    getDevices,
    changeTemperature
} from './tempcoApi.js'



dotenv.config({
    path: process.env.PRODUCTION === "1" ? '.env' : '.env.local'
})


const app = async () => {

    const user_email = process.env.USER_EMAIL
    const user_password = process.env.USER_PASSWORD

    const token = await login(user_email, user_password)
    
    console.log("YOUR TOKEN IS ", token)

    const smarthome_id = await getHomes(user_email, token)

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
        21   // New temperature in celsius
    )

    console.log(status)

}



app()