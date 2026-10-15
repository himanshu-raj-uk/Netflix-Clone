const geoip = require("geoip-lite");

const getLocation = (ip) => {
  if (!ip) {
    return "Unknown location";
  }
  const cleanIP = ip.split(",")[0].trim().replace("::ffff:", "");
  if (cleanIP === "::1" || cleanIP === "127.0.0.1") {
    return "Localhost";
  }
  const geo = geoip.lookup(cleanIP);
  if (!geo) {
    return "Unknown location";
  }
  return `${geo.city || "Unknown city"}, ${geo.country || "Unknown country"}`;
};

module.exports = getLocation;
