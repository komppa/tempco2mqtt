import * as dotenv from 'dotenv'


export const loadConfiguration = () => {
    dotenv.config({
        path: process.env.PRODUCTION === "1" ? '.env' : '.env.local'
    })
}
