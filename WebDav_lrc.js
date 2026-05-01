/*
 * 基于 [https://gitee.com/maotoumao/MusicFreePlugins] 修改
 * 原始版权: [猫头猫]
 * 修改说明: 新增WebDAV支持歌词显示，歌词名和歌曲名需要相同
 * 
 * 本程序是自由软件，遵循GPLv3许可
 */


"use strict";

const { createClient, AuthType } = require("webdav");

// 缓存WebDAV客户端和文件列表
let cachedData = {
  client: null,
  url: null,
  username: null,
  password: null,
  searchPath: null,
  searchPathList: null,
  cacheFileList: null,
  lastFetchTime: 0,
  lyric: {}
};

// 缓存有效期（1小时）
const CACHE_TTL = 60 * 60 * 1000;

/**
 * 获取或创建WebDAV客户端
 * 通过缓存避免重复创建连接
 */
function getClient() {
  // 从环境变量获取配置
  const userVars = env.getUserVariables ? env.getUserVariables() : (env.userVariables || {});
  const { url, username, password, searchPath } = userVars;

  // 验证必要配置
  if (!url || !username || !password) {
    console.error("WebDAV配置不完整");
    return null;
  }

  // 检查配置是否变更，如变更则清除缓存
  const configChanged = (
    cachedData.url !== url ||
    cachedData.username !== username ||
    cachedData.password !== password ||
    cachedData.searchPath !== searchPath
  );

  if (configChanged || !cachedData.client) {
    // 更新缓存数据
    cachedData = {
      client: null,
      url,
      username,
      password,
      searchPath: searchPath || null,
      searchPathList: searchPath ? searchPath.split(",").map(path => path.trim()).filter(Boolean) : ['/'],
      cacheFileList: null,
      lastFetchTime: 0
    };

    // 创建新的WebDAV客户端
    try {
      cachedData.client = createClient(url, {
        authType: AuthType.Password,
        username,
        password
      });
    } catch (error) {
      console.error("创建WebDAV客户端失败:", error);
      return null;
    }
  }

  return cachedData.client;
}

/**
 * 获取目录下的所有音频文件
 * 支持递归搜索子目录
 */
async function getAudioFilesFromDirectory(client, path, recursive = true) {
  try {
    const items = await client.getDirectoryContents(path);
    const audioFiles = [];

    for (const item of items) {
      if (item.type === "directory" && recursive) {
        // 递归搜索子目录
        const subDirFiles = await getAudioFilesFromDirectory(client, item.filename, recursive);
        audioFiles.push(...subDirFiles);
      } else if (item.type === "file" && item.mime && item.mime.startsWith("audio")) {
        audioFiles.push(item);
      }
    }

    return audioFiles;
  } catch (error) {
    console.error(`获取目录 ${path} 内容失败:`, error);
    return [];
  }
}

/**
 * 搜索音乐
 * 通过缓存优化重复搜索性能
 */
async function searchMusic(query) {
  const client = getClient();
  if (!client) {
    return { isEnd: true, data: [] };
  }

  const now = Date.now();
  const cacheExpired = now - cachedData.lastFetchTime > CACHE_TTL;

  // 如果缓存为空或已过期，重新获取文件列表
  if (!cachedData.cacheFileList || cachedData.cacheFileList.length === 0 || cacheExpired) {
    const searchPaths = cachedData.searchPathList && cachedData.searchPathList.length > 0
      ? cachedData.searchPathList
      : ['/'];

    const filePromises = searchPaths.map(path =>
      getAudioFilesFromDirectory(client, path, true)
    );

    try {
      const results = await Promise.allSettled(filePromises);
      cachedData.cacheFileList = results
        .filter(result => result.status === "fulfilled")
        .flatMap(result => result.value);
      cachedData.lastFetchTime = now;
    } catch (error) {
      console.error("获取音频文件列表失败:", error);
      cachedData.cacheFileList = [];
    }
  }

  // 如果没有查询关键词，返回所有文件
  if (!query || query.trim() === "") {
    return {
      isEnd: true,
      data: (cachedData.cacheFileList || []).map(file => ({
        title: file.basename || "未知歌曲",
        id: file.filename,
        artist: "未知作者",
        album: "未知专辑"
      }))
    };
  }

  // 根据关键词过滤
  const searchTerm = query.toLowerCase();
  const filteredFiles = (cachedData.cacheFileList || [])
    .filter(file => {
      if (!file.basename) return false;
      return file.basename.toLowerCase().includes(searchTerm);
    })
    .map(file => ({
      title: file.basename,
      id: file.filename,
      artist: "未知作者",
      album: "未知专辑"
    }));

  return {
    isEnd: true,
    data: filteredFiles
  };
}

/**
 * 获取歌单列表
 */
async function getTopLists() {
  getClient(); // 确保客户端初始化
  const searchPaths = cachedData.searchPathList || ['/'];

  return [{
    title: "全部歌曲",
    data: searchPaths.map(path => ({
      title: path,
      id: path
    }))
  }];
}

/**
 * 获取歌单详情
 */
async function getTopListDetail(topListItem) {
  const client = getClient();
  if (!client || !topListItem || !topListItem.id) {
    return { musicList: [] };
  }

  try {
    const fileItems = await getAudioFilesFromDirectory(client, topListItem.id, false);

    return {
      musicList: fileItems.map(item => ({
        title: item.basename || "未知歌曲",
        id: item.filename,
        artist: "未知作者",
        album: "未知专辑"
      }))
    };
  } catch (error) {
    console.error(`获取歌单详情失败 ${topListItem.id}:`, error);
    return { musicList: [] };
  }
}

/**
 * 获取媒体源URL
 */
function getMediaSource(musicItem) {
  const client = getClient();
  if (!client || !musicItem || !musicItem.id) {
    return { url: null };
  }

  try {
    return {
      url: client.getFileDownloadLink(musicItem.id)
    };
  } catch (error) {
    console.error("获取媒体源URL失败:", error);
    return { url: null };
  }
}

/**
 * 搜索函数（主入口）
 */
function search(query, page, type) {
  if (type === "music") {
    return searchMusic(query);
  }

  return Promise.resolve({ isEnd: true, data: [] });
}


// 获取歌词
async function getLyric(musicItem) {

  if (!musicItem || !musicItem.id) {
    return;
  }
  let content = cachedData[musicItem.id];
  if (content){
    return {
      rawLrc: content, // 文本格式的歌词
      translation: content // 文本格式的歌词
    }
  }
  const client = getClient();

  // 后缀换成 .lrc
  let i = musicItem.id.lastIndexOf('.');
  let lrcPath = musicItem.id.substring(0, i) + '.lrc';

  try {
    // 读取文件内容
    const content = await client.getFileContents(lrcPath, {
      format: 'text'
    });

    cachedData[musicItem.id] = content;
    return {
      rawLrc: content, // 文本格式的歌词
      translation: content // 文本格式的歌词
    }

  } catch (error) {
    let path = lrcPath
    if (error && error.response && error.response.url){
      path = error.response.url
    }
    console.error(`读取文件失败 ${path}:`, error);
  }
}


// 导出模块
module.exports = {
  platform: "WebDAV",
  author: "mcck",
  description: "使用此插件前先配置用户变量",
  userVariables: [
    {
      key: "url",
      name: "WebDAV地址",
      hint: "例如: https://example.com/dav"
    },
    {
      key: "username",
      name: "用户名"
    },
    {
      key: "password",
      name: "密码",
      type: "password"
    },
    {
      key: "searchPath",
      name: "存放歌曲的路径",
      hint: "多个路径用逗号分隔，例如: /Music,/Audio"
    }
  ],
  version: "0.1.2",
  supportedSearchType: ["music"],
  srcUrl: "https://gitee.com/mcck-tools/other/raw/master/musicfree/webdav.js",
  // srcUrl: "http://172.88.0.47:5500/webdav.js",
  cacheControl: "no-cache",

  // 主功能接口
  search,
  getTopLists,
  getTopListDetail,
  getMediaSource,
  getLyric
};