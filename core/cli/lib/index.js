"use strict";

const path = require("path");
const pkg = require("../package.json");
const log = require("@famine-cli/log");
const colors = require("colors");
const semver = require("semver");
const constant = require("./const");
const rootCheck = require("root-check");
const userHome = require("user-home");
const minimist = require("minimist");
const dotenv = require("dotenv");
const { getNpmLatestVersion } = require("@famine-cli/get-npm-info");

module.exports = core;

// 检查版本号
function checkPkgVersion() {
  log.notice(pkg.version);
}

// 检查node版本
function checkNodeVersion() {
  const currentVersion = process.version;
  const lowestVersion = constant.LOWEST_VERSION;
  if (!semver.gte(currentVersion, lowestVersion)) {
    throw new Error(
      log.error(`famine-cli 需要安装 ${lowestVersion} 以上的Node.js版本`)
    );
  }
}

// 检查当前用户是否为root用户，若是root用户则自动降级
async function checkRoot() {
  rootCheck();
}

// 检查用户主目录是否存在
async function checkUserHomeExist() {
  const { pathExists } = await import("path-exists");
  if (!userHome || !pathExists(userHome)) {
    throw new Error(log.error("cli", "当前用户主目录不存在"));
  }
}

// 检查入参
function checkInputArgs() {
  const argv = minimist(process.argv.slice(2));
  if (argv.debug) {
    process.env.LOG_LEVEL = "verbose";
  } else {
    process.env.LOG_LEVEL = "info";
  }
  log.level = process.env.LOG_LEVEL;
}

// 检查环境变量
async function checkEnv() {
  const { pathExists } = await import("path-exists");
  const dotenvPath = path.resolve(userHome, ".env");
  let config;
  // 用户主目录下存在 .env 文件，则默认读取 .env 文件
  if (pathExists(dotenvPath)) {
    config = dotenv.config({ path: dotenvPath });
  }
  // 全局变量中没有配置 CLI_HOME_PATH 时，初始化 CLI_HOME_PATH，并更新config
  if (!process.env.CLI_HOME_PATH) {
    config["CLI_HOME_PATH"] = path.resolve(userHome, constant.DEFAULT_CLI);
    process.env.CLI_HOME_PATH = config.CLI_HOME_PATH;
  }
}

// 检查是否为最新版本
async function checkGlobalUpdate() {
  // 获取本地安装的版本号和模块名称
  const currentVersion = pkg.version;
  const npmName = pkg.name;
  // 调用 NPM API, 获取 NPM 上最新的版本号
  const latestVersion = await getNpmLatestVersion(npmName);
  // 比较本地版本号 与 NPM 上最新的版本号
  if (latestVersion && semver.gt(latestVersion, currentVersion)) {
    log.warn(
      "更新提醒",
      colors.yellow(
        `请更新 ${npmName} 的版本，当前版本为 ${currentVersion}，最新版本为 ${latestVersion}`
      )
    );
  }
}

function core() {
  try {
    checkPkgVersion();
    checkNodeVersion();
    checkRoot();
    checkUserHomeExist();
    checkInputArgs();
    checkEnv();
    checkGlobalUpdate();
  } catch (e) {
    log.error(e.message);
  }
}
