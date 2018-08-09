require('dotenv').config();

process.on('uncaughtException', error => console.error(`Uncaught exception: ${error.message}`, error));
process.on('unhandledRejection', error =>
  console.error(`Uncaught rejection "${error.constructor.name}": ${error.message}`, error)
);

import {Bot} from '@wireapp/bot-api';
import {WeatherHandler} from './WeatherHandler';
import {OwmApiClient as WeatherAPI} from 'openweathermap-api-client';

(async () => {
  const bot = new Bot({
    email: String(process.env.WIRE_EMAIL),
    password: String(process.env.WIRE_PASSWORD),
  });
  const weatherAPI = new WeatherAPI({
    apiKey: String(process.env.API_KEY),
    lang: 'en',
    units: 'metric',
  });

  bot.addHandler(new WeatherHandler(weatherAPI));

  await bot.start();
})();
