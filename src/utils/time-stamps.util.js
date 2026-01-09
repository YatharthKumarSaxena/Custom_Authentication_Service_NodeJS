const getTimeStamp = () => {
  const now = new Date();

  const dayName = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][now.getDay()];
  const day = String(now.getDate()).padStart(2, '0');
  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const month = monthNames[now.getMonth()];
  const year = now.getFullYear();

  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');

  const tzOffset = -now.getTimezoneOffset(); // in minutes
  const tzHours = Math.floor(Math.abs(tzOffset) / 60);
  const tzMinutes = Math.abs(tzOffset) % 60;
  const tzSign = tzOffset >= 0 ? '+' : '-';
  const timezone = `UTC${tzSign}${String(tzHours).padStart(2, '0')}:${String(tzMinutes).padStart(2, '0')}`;

  return `[${dayName}, ${day} ${month} ${year}, ${hours}:${minutes}:${seconds} ${timezone}]`;
};

// Custom Time Logger Function
exports.logWithTime = (...args) => {
  console.log(`🕒 ${getTimeStamp()}`, ...args);
};