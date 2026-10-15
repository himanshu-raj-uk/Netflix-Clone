const UAParser = require("ua-parser-js");

const getDeviceInfo = (userAgent) => {
  if (!userAgent) {
    return "Unknown Device";
  }

  const parser = new UAParser(userAgent);
  const result = parser.getResult();

  const browser = result.browser.name || "Unknown Browser";
  const os = result.os.name || "Unknown OS";
  const device = result.device.model || result.device.type || "Desktop";

  return `${browser} on ${os} (${device})`;
};

module.exports = getDeviceInfo;