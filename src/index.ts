import * as dotenv from 'dotenv';
dotenv.config();

import {Bot} from '@wireapp/bot-api';
import {WeatherHandler} from './WeatherHandler';
import {OwmApiClient as WeatherAPI} from 'openweathermap-api-client';


['WIRE_EMAIL', 'WIRE_PASSWORD', 'OPEN_WEATHER_API_KEY'].forEach(envVar => {
  if (!process.env[envVar]) {
    throw new Error(`Environment variable "${envVar}" is not set. Please define it or create a .env file.`)
  }
})

const bot = new Bot({
  email: process.env.WIRE_EMAIL!,
  password: process.env.WIRE_PASSWORD!,
});

const weatherAPI = new WeatherAPI({
  apiKey: process.env.OPEN_WEATHER_API_KEY!,
  lang: 'en',
  units: 'metric',
});

bot.addHandler(new WeatherHandler(weatherAPI));
bot.start();
