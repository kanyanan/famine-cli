"use strict";

const urlJoin = require("url-join");
const axios = require("axios");

const getDefaultRegister = (isOriginal = false) => {
  return isOriginal
    ? "https://registry.npmjs.org"
    : "https://registry.npmmirror.com";
};

// 获取指定包的全部版本号
const getNpmVersions = async (npmName) => {
  const register = getDefaultRegister();
  const npmUrl = urlJoin(register, npmName);
  const res = await axios.get(npmUrl);
  if (res?.status === 200) {
    return res?.data?.versions ?? {};
  } else {
    return {};
  }
};

// 获取指定包NPM上最新的版本号
const getNpmLatestVersion = async (npmName) => {
  const versionObject = await getNpmVersions(npmName);
  const versions = Object.keys(versionObject) ?? [];
  if (versions.length > 0) {
    const versionsBySort = versions.sort(
      (a, b) => b.replaceAll(".", "") - a.replaceAll(".", "")
    );
    // 返回最大版本号
    return versionsBySort[0];
  } else {
    return "";
  }
};

module.exports = {
  getNpmVersions,
  getNpmLatestVersion,
};
