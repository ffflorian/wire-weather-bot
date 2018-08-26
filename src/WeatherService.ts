import * as logdown from 'logdown';
import {OwmApiClient as WeatherAPI} from 'openweathermap-api-client';
import * as Utils from './Utils';

class WeatherService {
  private readonly logger: logdown.Logger;

  constructor(private readonly weatherAPI: WeatherAPI) {
    this.logger = logdown('wire-weather-bot/WeatherService', {
      logger: console,
      markdown: false,
    });
  }

  async getForecast(location: string): Promise<string> {
    let response;

    try {
      response = await this.weatherAPI.forecast(location);
    } catch (error) {
      return `Oops. Something went wrong with the weather API: "${error}"`;
    }

    const {
      city: {name: cityName, country: countryName},
      list: forecastList,
    } = response;

    this.logger.info(`Received "${cityName}, ${countryName}" for query "${location}".`);

    const daysList = forecastList.filter(({dt_txt}) => dt_txt.includes('12:00')).reduce((result, forecast) => {
      const {
        dt_txt,
        main: {temp: temp_avg, temp_max, temp_min},
        weather: [{id: weatherId, description}],
      } = forecast;
      const weekday = new Date(dt_txt).toLocaleTimeString('en-US', {weekday: 'long'}).split(' ')[0];
      const minTemp = temp_min.toFixed(0);
      const maxTemp = temp_max.toFixed(0);
      const temperature = minTemp === maxTemp ? temp_avg.toFixed(0) : `between ${minTemp} °C and ${maxTemp}`;

      const emoji = Utils.mapIconToEmoji(weatherId);

      return result + `- **${weekday}:** ${description}, ${temperature} °C. ${emoji}\n`;
    }, '');

    return `5-day forecast for **${cityName}, ${countryName}** (each at 12:00 local time):\n\n${daysList}`;
  }

  async getWeather(location: string): Promise<string> {
    let response;

    try {
      response = await this.weatherAPI.current(location);
    } catch (error) {
      return `Oops. Something went wrong with the weather API: "${error}"`;
    }

    const {
      name: cityName,
      weather: [{id: weatherId, description}],
      main: {temp: temperature},
      sys: {country: countryName},
    } = response;

    this.logger.info(`Received "${cityName}, ${countryName}" for query "${location}".`);

    const emoji = Utils.mapIconToEmoji(weatherId);

    return `Current weather in **${cityName}, ${countryName}**: ${description}, ${temperature.toFixed(0)} °C. ${emoji}`;
  }
}

export {WeatherService};
