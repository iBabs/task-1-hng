import express from 'express';
import bodyParser from 'body-parser';
import axios from 'axios';
import cors from 'cors';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors())

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


const PORT = 6000;

const getClientIp = (req) => {
    const ip =
        req.headers['cf-connecting-ip'] ||
        req.headers['x-real-ip'] ||
        req.headers['x-forwarded-for']
        || req.socket.remoteAddress;


    return ip;
};

const getLocationFromIp = async (ip) => {
    try {
        const response = await axios.get(`https://get.geojs.io/v1/ip/geo/${ip}.json`);
        return response.data;
    } catch (error) {
        console.error('Error getting location data:', error);
        return null;
    }
};
const getWeatherFromCoords = async (latitude, longitude) => {
    try {
        const response = await axios.get(`https://api.open-meteo.com/v1/forecast`, {
            params: {
                latitude,
                longitude,
                current_weather: true
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error getting weather data:', error);
        return null;
    }
};
// example.com>/api/hello?visitor_name="Mark"


app.get('/api/hello', async (req, res) => {
    const visitor_name = req.query.visitor_name || 'User';
    const ip = getClientIp(req);
    const locationData = await getLocationFromIp(ip);
    if (!locationData) {
        return res.status(500).json({ error: 'Unable to determine location' });
    }

    const { city, latitude, longitude } = locationData;
    const weatherData = await getWeatherFromCoords(latitude, longitude);
    if (!weatherData) {
        return res.status(500).json({ error: 'Unable to get weather data' });
    }

    const temperature = weatherData.current_weather.temperature;
    const greeting = `Hello, ${visitor_name}!, The temperature is ${temperature} degrees Celsius in ${city}`;

    res.json({
        client_ip: ip,
        location: city,
        greeting,
    });
});



app.get('/', (req, res) => {
    const  ip  = getClientIp(req);

    res.json({
        client_ip: ip
    });
})
app.listen(PORT, (err) => {
    err ? console.log(err) : console.log(`Server is running on port ${PORT}`);
})