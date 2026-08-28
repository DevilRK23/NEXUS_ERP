/**
 * NEXUS ENTERPRISE ERP — STRUCTURED MICROSERVICE LOGGER
 */

const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  magenta: "\x1b[35m"
};

function createLogger(serviceName) {
  return {
    info(msg, meta = {}) {
      const ts = new Date().toISOString().substring(11, 19);
      console.log(`${colors.dim}[${ts}]${colors.reset} ${colors.cyan}[${serviceName}]${colors.reset} ${colors.green}INFO${colors.reset}: ${msg}`, Object.keys(meta).length ? meta : '');
    },
    warn(msg, meta = {}) {
      const ts = new Date().toISOString().substring(11, 19);
      console.log(`${colors.dim}[${ts}]${colors.reset} ${colors.yellow}[${serviceName}]${colors.reset} ${colors.yellow}WARN${colors.reset}: ${msg}`, Object.keys(meta).length ? meta : '');
    },
    error(msg, err = {}) {
      const ts = new Date().toISOString().substring(11, 19);
      console.error(`${colors.dim}[${ts}]${colors.reset} ${colors.red}[${serviceName}]${colors.reset} ${colors.red}ERROR${colors.reset}: ${msg}`, err);
    },
    http(method, path, status, durationMs) {
      const ts = new Date().toISOString().substring(11, 19);
      const color = status < 400 ? colors.green : (status < 500 ? colors.yellow : colors.red);
      console.log(`${colors.dim}[${ts}]${colors.reset} ${colors.magenta}[${serviceName}]${colors.reset} ${method} ${path} -> ${color}${status}${colors.reset} (${durationMs}ms)`);
    }
  };
}

module.exports = { createLogger };
