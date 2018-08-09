import {MessageHandler} from '@wireapp/bot-api';
import {OwmApiClient as WeatherAPI} from 'openweathermap-api-client';
import {PayloadBundleIncoming, PayloadBundleType, ReactionType} from '@wireapp/core/dist/conversation/root';
import {Connection} from '@wireapp/api-client/dist/commonjs/connection';
import {TextContent} from '@wireapp/core/dist/conversation/content/';

const {version}: {version: string} = require('../package.json');

enum MessageType {
  FORECAST = 'forecast',
  HELP = 'help',
  WEATHER = 'weather',
  NO_COMMAND = 'no_command',
  UPTIME = 'uptime',
  UNKNOWN_COMMAND = 'unknown_command',
}

const toHHMMSS = (input: string): string => {
  const pad = (t: number) => (t < 10 ? '0' + t : t);

  const uptime = parseInt(input, 10);
  const hours = Math.floor(uptime / 3600);
  const minutes = Math.floor((uptime - hours * 3600) / 60);
  const seconds = uptime - hours * 3600 - minutes * 60;

  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
};

class WeatherHandler extends MessageHandler {
  private readonly helpText = `**Hello!** 😎 This is weather bot v${version} speaking.\n\nAvailable commands:\n- **/help**: Display this message.\n- **/weather <city>**: Get the current weather for a city.\n- **/forecast <city>**: Get the current forecast for a city.\n- **/uptime**: Get the current uptime of the bot.\n\nMore information about this bot: https://github.com/ffflorian/wire-weather-bot`;

  constructor(private readonly weatherAPI: WeatherAPI) {
    super();
  }

  async handleEvent(payload: PayloadBundleIncoming) {
    switch (payload.type) {
      case PayloadBundleType.TEXT: {
        if (payload.conversation) {
          const messageContent = payload.content as TextContent;
          return this.handleText(payload.conversation, messageContent.text, payload.id);
        }
      }
      case PayloadBundleType.CONNECTION_REQUEST: {
        if (payload.conversation) {
          const connectRequest = payload.content as Connection;
          return this.handleConnectionRequest(connectRequest.to, payload.conversation);
        }
      }
    }
  }

  private parseMessage(text: string): [MessageType, string] {
    const parsedCommand = text.match(/\/(\w+)(?: (.*))?/);

    if (parsedCommand && parsedCommand.length) {
      const command = parsedCommand[1].toLowerCase();
      const content = parsedCommand[2] || '';

      switch (command) {
        case MessageType.HELP:
          return [MessageType.HELP, ''];
        case MessageType.WEATHER:
        case MessageType.FORECAST:
        case MessageType.UPTIME:
          return [command, content];
        default:
          return [MessageType.UNKNOWN_COMMAND, ''];
      }
    }
    return [MessageType.NO_COMMAND, ''];
  }

  private mapIconToEmoji(weatherId: number): string {
    if (
      weatherId.toString().startsWith('2') ||
      weatherId === 900 ||
      weatherId === 901 ||
      weatherId === 902 ||
      weatherId === 905
    ) {
      return '☈';
    } else if (weatherId.toString().startsWith('3')) {
      return 'drizzle';
    } else if (weatherId.toString().startsWith('5')) {
      return '🌧️';
    } else if (weatherId.toString().startsWith('6') || weatherId === 903 || weatherId === 906) {
      return '❄️';
    } else if (weatherId.toString().startsWith('7')) {
      return '';
    } else if (weatherId === 800) {
      return '☀️';
    } else if (weatherId === 801) {
      return '⛅';
    } else if (weatherId === 802 || weatherId === 803) {
      return '☁️☁️';
    } else if (weatherId === 904) {
      return '🌞';
    }
    return '😎';
  }

  async handleText(conversationId: string, text: string, messageId: string): Promise<void> {
    const [command, content] = this.parseMessage(text);

    switch (command) {
      case MessageType.UNKNOWN_COMMAND:
      case MessageType.NO_COMMAND:
        break;
      default:
        await this.sendReaction(conversationId, messageId, ReactionType.LIKE);
    }

    switch (command) {
      case MessageType.HELP: {
        await this.sendText(conversationId, this.helpText);
        break;
      }
      case MessageType.WEATHER: {
        let response;
        if (!content) {
          return this.sendText(conversationId, `You did not provide a city. Try e.g. \`/weather Berlin\`.`);
        }
        try {
          response = await this.weatherAPI.current(content);
        } catch (error) {
          return this.sendText(conversationId, `Oops. Something went wrong with the weather API: "${error}"`);
        }
        const {
          name: cityName,
          weather: [{id: weatherId, description}],
          main: {temp: temperature},
        } = response;
        await this.sendText(
          conversationId,
          `Current weather in **${cityName}**: ${description}, ${temperature.toFixed(0)} °C. ${this.mapIconToEmoji(
            weatherId
          )}`
        );
        break;
      }
      case MessageType.FORECAST: {
        await this.sendForecast(conversationId, content);
        break;
      }
      case MessageType.UPTIME: {
        return this.sendText(conversationId, `Current uptime: ${toHHMMSS(process.uptime().toString())}`);
      }
      case MessageType.UNKNOWN_COMMAND: {
        return this.sendText(conversationId, `Sorry, I don't know the command "${text}" yet.`);
      }
    }
  }

  async sendForecast(conversationId: string, content: string): Promise<void> {
    let response;
    if (!content) {
      return this.sendText(conversationId, `You did not provide a city. Try e.g. \`/forecast Berlin\`.`);
    }
    try {
      response = await this.weatherAPI.forecast(content);
    } catch (error) {
      return this.sendText(conversationId, `Oops. Something went wrong with the weather API: "${error}"`);
    }

    const {
      city: {name: cityName},
      list: forecastList,
    } = response;
    const daysList = forecastList.filter(forecast => forecast.dt_txt.includes('09:00')).reduce((result, forecast) => {
      const {
        dt_txt,
        main: {temp_max, temp_min},
        weather,
      } = forecast;
      const weekday = new Date(dt_txt).toLocaleTimeString('en-US', {weekday: 'long'}).split(' ')[0];
      const minTemp = temp_min.toFixed(0);
      const maxTemp = temp_max.toFixed(0);
      const weatherId = weather[0].id;
      const temperature = minTemp === maxTemp ? `around ${minTemp} °C` : `between ${minTemp} °C and ${maxTemp} °C`;
      return result + `**${weekday}:** ${weather[0].description}, ${temperature}. ${this.mapIconToEmoji(weatherId)}\n`;
    }, '');
    await this.sendText(conversationId, `5-day forecast for **${cityName}**:\n\n${daysList}`);
  }

  async handleConnectionRequest(userId: string, conversationId: string): Promise<void> {
    await this.sendConnectionResponse(userId, true);
    await this.sendText(conversationId, this.helpText);
  }
}

export {WeatherHandler};
