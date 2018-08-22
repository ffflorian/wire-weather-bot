import * as logdown from 'logdown';
import {OwmApiClient as WeatherAPI} from 'openweathermap-api-client';
import * as Utils from './Utils';

class WeatherService {
  private readonly logger: logdown.Logger;

  constructor(private readonly weatherAPI: WeatherAPI) {
    this.logger = logdown('wire-weaether-bot/MainHandler', {
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
      city: {name: cityName},
      list: forecastList,
    } = response;
    const daysList = forecastList.filter(forecast => forecast.dt_txt.includes('09:00')).reduce((result, forecast) => {
      const {
        dt_txt,
        main: {temp_max, temp_min},
        weather: [{id: weatherId, description}],
      } = forecast;
      const weekday = new Date(dt_txt).toLocaleTimeString('en-US', {weekday: 'long'}).split(' ')[0];
      const minTemp = temp_min.toFixed(0);
      const maxTemp = temp_max.toFixed(0);
      const temperature = minTemp === maxTemp ? `around ${minTemp} °C` : `between ${minTemp} °C and ${maxTemp} °C`;

      const emoji = Utils.mapIconToEmoji(weatherId);

      return result + `**${weekday}:** ${description}, ${temperature}. ${emoji}\n`;
    }, '');

    return `5-day forecast for **${cityName}**:\n\n${daysList}`;
  }

  async getWeather(content: string): Promise<string> {
    let response;

    try {
      response = await this.weatherAPI.current(content);
    } catch (error) {
      return `Oops. Something went wrong with the weather API: "${error}"`;
    }

    const {
      name: cityName,
      weather: [{id: weatherId, description}],
      main: {temp: temperature},
    } = response;

    const emoji = Utils.mapIconToEmoji(weatherId);

    return `Current weather in **${cityName}**: ${description}, ${temperature.toFixed(0)} °C. ${emoji}`;
  }
}

export {WeatherService};
