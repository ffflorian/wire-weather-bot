const mapIconToEmoji = (weatherId: number): string => {
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
    return '☁️️';
  } else if (weatherId === 904) {
    return '🌞';
  }
  return '😎';
};

const toHHMMSS = (input: string): string => {
  const pad = (t: number) => (t < 10 ? '0' + t : t);

  const uptime = parseInt(input, 10);
  const hours = Math.floor(uptime / 3600);
  const minutes = Math.floor((uptime - hours * 3600) / 60);
  const seconds = uptime - hours * 3600 - minutes * 60;

  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
};

export {mapIconToEmoji, toHHMMSS};
