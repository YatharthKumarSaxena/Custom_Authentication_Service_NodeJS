// ISO Format Timestamp Function (standard for logs)
exports.getTimeStamp = () => {
  return `[${new Date().toISOString()}]`;
};

// Custom Time Logger Function
exports.logWithTime = (...args) => {
  console.log(`🕒 ${exports.getTimeStamp()}`, ...args);
};