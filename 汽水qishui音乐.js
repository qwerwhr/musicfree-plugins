"use strict";

Object.defineProperty(exports, "__esModule", {
  "value": true
});

const axios = require("axios");

// ============================================
// 常量定义
// ============================================

/**
 * 每页返回的数据数量
 * @constant {number}
 */
const PAGE_SIZE = 20;

/**
 * 抖音图片 CDN 基础 URL
 * @constant {string}
 */
const DOUYIN_IMAGE_BASE_URL = "https://p3-luna.douyinpic.com/img/";

/**
 * 汽水音乐 API 请求头
 * @constant {Object}
 */
const QISHUI_API_HEADERS = {
  "Accept": "*/*",
  "Content-Type": "application/json; charset=UTF-8",
  "User-Agent": "com.luna.music/100159040 (Linux; U; Android 11; zh_CN; Cronet/TTNetVersion:dd1b0931 2024-06-28 QuicVersion:d299248d 2024-04-09)",
  "X-Argus": "=",
  "x-common-params-v2": "channel=appstore&aid=8478&device_id=1100210274091033"
};

/**
 * 音频播放请求头
 * @constant {Object}
 */
const AUDIO_PLAYBACK_HEADERS = {
  "Accept": "*/*",
  "Accept-Language": "zh-CN,zh;q=0.9",
  "Cache-Control": "no-cache",
  "Pragma": "no-cache",
  "Range": "bytes=0-",
  "Referer": "https://www.douyin.com/",
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.69 Safari/537.36"
};

/**
 * 汽水 VIP 播放接口配置
 */
const QISHUI_VIP_API_BASE = "http://api.vsaa.cn/api/music.qishui.vip";
const QISHUI_VIP_PROXY_SERVER = "https://proxy.qishui.vsaa.cn/qishui/proxy";

// ============================================
// 工具函数
// ============================================

/**
 * 构建抖音图片 URL
 * @param {string} uri - 图片 URI
 * @param {string} templatePrefix - 模板前缀
 * @param {string} [size='960:960'] - 图片尺寸
 * @returns {string} 完整的图片 URL
 */
function buildDouyinImageUrl(uri, templatePrefix, size = '960:960') {
  return `${DOUYIN_IMAGE_BASE_URL}${uri}~${templatePrefix}-resize:${size}.png`;
}

/**
 * 获取 VIP 标记
 * @param {boolean} isVipOnly - 是否仅限 VIP
 * @returns {number} VIP 付费标记（1=VIP，0=免费）
 */
function getVipFee(isVipOnly) {
  return isVipOnly === true ? 1 : 0;
}

// ============================================
// 数据转换函数
// ============================================

/**
 * 将搜索结果项转换为标准音乐信息格式
 * @param {Object} searchItem - 搜索 API 返回的音乐项
 * @returns {Object} 标准化的音乐信息对象
 *
 * @example
 * const musicInfo = parseSearchResultItem(rawItem);
 * // Returns: { id, title, artist, artwork, qualities }
 */
function parseSearchResultItem(searchItem) {
  const vipFee = getVipFee(searchItem?.["qishui_label_info"]?.["only_vip_playable"]);

  // 提供基础音质支持（汽水音乐暂无详细音质信息API）
  const qualities = {
    "128k": { bitrate: 128000 },
    "320k": { bitrate: 320000 },
    "flac": { bitrate: 1411000 },
  };

  // 保存作者信息，用于详情跳转
  const authorInfo = searchItem.author_info || {};
  const singerList = (authorInfo.id || authorInfo.name) ? [{
    id: authorInfo.id,
    name: authorInfo.name,
    avatar: authorInfo.avatar || "",
  }] : [];

  return {
    "id": searchItem.item_id,
    "title": searchItem.title,
    "artist": searchItem.author_info.name,
    "singerList": singerList,
    "artwork": searchItem.cover_url,
    "qualities": qualities,
    "fee": vipFee
  };
}

/**
 * 将排行榜曲目数据转换为标准音乐信息格式
 * @param {Object} rankItem - 排行榜 API 返回的曲目项
 * @returns {Object} 标准化的音乐信息对象（包含专辑信息）
 *
 * @example
 * const musicInfo = parseRankTrackItem(rankItem);
 * // Returns: { id, title, artist, artistId, album, albumId, artwork, qualities }
 */
function parseRankTrackItem(rankItem) {
  const track = rankItem.track;
  const vipFee = getVipFee(track?.["label_info"]?.["only_vip_playable"]);
  const coverUri = track.album.url_cover.uri;
  const coverTemplate = track.album.url_cover.template_prefix;

  // 提供基础音质支持
  const qualities = {
    "128k": { bitrate: 128000 },
    "320k": { bitrate: 320000 },
    "flac": { bitrate: 1411000 },
  };

  // 保存歌手信息列表，用于详情跳转
  const singerList = (track.artists || []).map(a => ({
    id: a.id,
    name: a.name,
    avatar: a.avatar || "",
  }));

  return {
    "id": track.id,
    "title": track.name,
    "artist": track.artists[0].name,
    "artistId": track.artists[0].id,
    "singerList": singerList,
    "album": track.album.name,
    "albumId": track.album.id,
    "artwork": buildDouyinImageUrl(coverUri, coverTemplate),
    "qualities": qualities,
    "fee": vipFee
  };
}

/**
 * 将曲目数据转换为标准音乐信息格式
 * @param {Object} track - API 返回的曲目对象
 * @returns {Object} 标准化的音乐信息对象
 *
 * @example
 * const musicInfo = parseTrackItem(track);
 * // Returns: { id, title, artist, artistId, album, albumId, artwork, qualities }
 */
function parseTrackItem(track) {
  const vipFee = getVipFee(track?.["label_info"]?.["only_vip_playable"]);
  const coverUri = track.album.url_cover.uri;
  const coverTemplate = track.album.url_cover.template_prefix;

  // 提供基础音质支持
  const qualities = {
    "128k": { bitrate: 128000 },
    "320k": { bitrate: 320000 },
    "flac": { bitrate: 1411000 },
  };

  // 保存歌手信息列表，用于详情跳转
  const singerList = (track.artists || []).map(a => ({
    id: a.id,
    name: a.name,
    avatar: a.avatar || "",
  }));

  return {
    "id": track.id,
    "title": track.name,
    "artist": track.artists[0].name,
    "artistId": track.artists[0].id,
    "singerList": singerList,
    "album": track.album.name,
    "albumId": track.album.id,
    "artwork": buildDouyinImageUrl(coverUri, coverTemplate),
    "qualities": qualities,
    "fee": vipFee
  };
}

/**
 * 将歌单媒体资源转换为标准音乐信息格式
 * @param {Object} mediaResource - 歌单 API 返回的媒体资源对象
 * @returns {Object} 标准化的音乐信息对象
 *
 * @example
 * const musicInfo = parsePlaylistMediaResource(resource);
 * // Returns: { id, title, artist, artistId, album, albumId, artwork, qualities }
 */
function parsePlaylistMediaResource(mediaResource) {
  const track = mediaResource.entity.track_wrapper.track;
  const vipFee = getVipFee(track?.["label_info"]?.["only_vip_playable"]);
  const coverUri = track.album.url_cover.uri;
  const coverTemplate = track.album.url_cover.template_prefix;

  // 提供基础音质支持
  const qualities = {
    "128k": { bitrate: 128000 },
    "320k": { bitrate: 320000 },
    "flac": { bitrate: 1411000 },
  };

  return {
    "id": track.id,
    "title": track.name,
    "artist": track.artists[0].name,
    "artistId": track.artists[0].id,
    "album": track.album.name,
    "albumId": track.album.id,
    "artwork": buildDouyinImageUrl(coverUri, coverTemplate),
    "qualities": qualities,
    "fee": vipFee
  };
}

/**
 * 将推荐歌单块数据转换为标准歌单信息格式
 * @param {Object} playlistBlock - 推荐 API 返回的歌单块对象
 * @returns {Object} 标准化的歌单信息对象
 *
 * @example
 * const playlistInfo = parseRecommendPlaylistBlock(block);
 * // Returns: { id, title, artist, createUserId, description, artwork, createTime }
 */
function parseRecommendPlaylistBlock(playlistBlock) {
  const playlist = playlistBlock.resources[0].entity.playlist;
  const vipFee = getVipFee(playlist?.["label_info"]?.["only_vip_playable"]);
  const coverUri = playlist.url_cover.uri;
  const coverTemplate = playlist.url_cover.template_prefix;

  return {
    "id": playlist.id,
    "title": playlist.title,
    "artist": playlist.owner.nickname,
    "createUserId": playlist.owner.id,
    "description": playlist.desc,
    "artwork": buildDouyinImageUrl(coverUri, coverTemplate),
    "createTime": playlist.create_time,
    "fee": vipFee
  };
}

/**
 * 将评论数据转换为标准评论信息格式
 * @param {Object} comment - API 返回的评论对象
 * @returns {Object} 标准化的评论信息对象
 *
 * @example
 * const commentInfo = parseCommentItem(comment);
 * // Returns: { id, nickName, avatar, comment, like, createAt }
 */
function parseCommentItem(comment) {
  const createDate = new Date(comment.time_created);

  return {
    "id": comment.id,
    "nickName": comment.user.nickname,
    "avatar": comment.user.medium_avatar_url && comment.user.medium_avatar_url.urls[0],
    "comment": comment.content,
    "like": comment.count_digged,
    "createAt": createDate.toLocaleString()
  };
}

// ============================================
// 核心 API 函数
// ============================================

/**
 * 搜索音乐
 * @async
 * @param {string} keyword - 搜索关键词
 * @param {number} page - 页码（从1开始）
 * @returns {Promise<Object>} 搜索结果对象
 * @returns {boolean} return.isEnd - 是否已到最后一页
 * @returns {Array<Object>} return.data - 音乐列表
 *
 * @description
 * 通过火山引擎搜索 API 搜索汽水音乐库中的歌曲
 *
 * @example
 * const result = await searchMusic("周杰伦", 1);
 * // Returns: { isEnd: false, data: [...] }
 */
async function searchMusic(keyword, page) {
  const offset = (page - 1) * PAGE_SIZE;
  const response = await axios.default.get("https://api-vehicle.volcengine.com/v2/search/type", {
    "params": {
      "keyword": keyword,
      "search_type": "music",
      "limit": PAGE_SIZE,
      "real_offset": offset,
      "search_source": "qishui"
    }
  });

  const apiData = response.data;
  const musicList = apiData.data.list.map(parseSearchResultItem);

  return {
    "isEnd": apiData.data.list.length === 0 || apiData.data.list.length < PAGE_SIZE ? true : false,
    "data": musicList
  };
}

/**
 * 获取音乐详细信息（包含歌词）
 * @async
 * @param {Object} musicItem - 音乐对象
 * @param {string} musicItem.id - 音乐 ID
 * @returns {Promise<Object>} 音乐详细信息
 * @returns {string} return.artwork - 封面图 URL
 * @returns {string} return.rawLrc - 原始歌词文本（LRC 格式）
 *
 * @description
 * 通过音乐 ID 获取封面和歌词信息
 *
 * @example
 * const info = await getMusicDetailInfo({ id: "123456" });
 * // Returns: { artwork: "...", rawLrc: "..." }
 */
async function getMusicDetailInfo(musicItem) {
  const response = await axios.default.get("https://api-vehicle.volcengine.com/v2/custom/contents", {
    "params": {
      "sources": "qishui",
      "need_author": true,
      "need_album": true,
      "need_ugc": true,
      "need_stat": true,
      "item_ids": musicItem.id
    }
  });

  const apiData = response.data;

  return {
    "artwork": apiData.data.list[0].cover_url,
    "rawLrc": apiData.data.list[0].lyric_info.lyric_text
  };
}

/**
 * 获取音乐完整信息（用于PlayById功能）
 * @async
 * @param {Object} musicBase - 音乐基础对象
 * @param {string} musicBase.id - 音乐 ID
 * @returns {Promise<Object>} 音乐完整信息
 */
async function getMusicInfo(musicBase) {
  // 如果已有完整信息（artwork和qualities），直接返回，避免重复请求
  if (musicBase.artwork && musicBase.qualities && Object.keys(musicBase.qualities).length > 0) {
    return {
      id: musicBase.id,
      title: musicBase.title,
      artist: musicBase.artist,
      album: musicBase.album,
      albumId: musicBase.albumId,
      artwork: musicBase.artwork,
      qualities: musicBase.qualities,
      fee: musicBase.fee,
      platform: '汽水音乐',
    };
  }

  const songId = musicBase.id || musicBase.item_id;
  if (!songId) {
    console.error('[汽水音乐] getMusicInfo: 缺少有效的歌曲ID');
    return null;
  }

  try {
    const response = await axios.default.get("https://api-vehicle.volcengine.com/v2/custom/contents", {
      "params": {
        "sources": "qishui",
        "need_author": true,
        "need_album": true,
        "need_ugc": true,
        "need_stat": true,
        "item_ids": songId
      }
    });

    const apiData = response.data;
    if (!apiData.data || !apiData.data.list || apiData.data.list.length === 0) {
      console.error('[汽水音乐] getMusicInfo: 未找到歌曲信息');
      return null;
    }

    const item = apiData.data.list[0];
    const vipFee = getVipFee(item?.["qishui_label_info"]?.["only_vip_playable"]);

    // 构建音质信息
    const qualities = {
      "128k": { bitrate: 128000 },
      "320k": { bitrate: 320000 },
      "flac": { bitrate: 1411000 },
    };

    // 构建歌手列表
    const authorInfo = item.author_info || {};
    const singerList = (authorInfo.id || authorInfo.name) ? [{
      id: authorInfo.id,
      name: authorInfo.name,
      avatar: authorInfo.avatar || "",
    }] : [];

    return {
      id: songId,
      title: (item.title || ''),
      artist: item.author_info?.name || '',
      album: item.album_info?.name || '',
      artwork: item.cover_url,
      duration: item.duration ? Math.floor(item.duration / 1000) : undefined,
      qualities: qualities,
      fee: vipFee,
      platform: '汽水音乐',
      singerList,
    };
  } catch (error) {
    console.error('[汽水音乐] getMusicInfo 错误:', error.message);
    return null;
  }
}

/**
 * 获取音乐播放源（VIP 接口）
 * @async
 * @param {Object} musicItem - 音乐对象
 * @param {string} musicItem.id - 音乐 ID
 * @param {string} quality - 音质（如 "128k", "320k", "flac" 等）
 * @returns {Promise<Object>} 播放源信息
 */
async function getMusicPlaybackSource(musicItem, quality = "128k") {
  if (!musicItem?.id) return null;

  try {
    const qualityToLevel = {
      "128k": "standard",
      "320k": "high",
      "flac": "lossless",
    };
    const level = qualityToLevel[quality] || "standard";

    // 1. 获取原始音源信息
    const response = await axios.default.get(QISHUI_VIP_API_BASE, {
      params: { act: "song", id: musicItem.id, level },
      timeout: 15000
    });

    const song = response?.data?.data?.[0];
    if (!song?.url) return null;

    // 2. 无需解密：直接返回
    if (!song.ekey) {
      return { url: song.url };
    }

    // 3. 需要解密：调用代理服务
    try {
      const proxyRes = await axios.default.post(
        QISHUI_VIP_PROXY_SERVER,
        {
          url: song.url,
          key: song.ekey,
          filename: song.name,
          ext: "aac"
        },
        {
          timeout: 60000,
          headers: { "Content-Type": "application/json" }
        }
      );

      if (proxyRes.data?.code === 200 && proxyRes.data?.url) {
        return { url: proxyRes.data.url };
      } else {
        console.warn("[汽水音乐] 代理服务返回错误:", proxyRes.data?.msg || "未知错误");
      }
    } catch (err) {
      console.warn("[汽水音乐] 代理请求失败，回退到原始地址:", err.message);
    }

    return {
      needDecrypt: true,
      decryptKey: song.ekey,
      _note: "需本地解密，请确保代理服务运行"
    };
  } catch (error) {
    console.error(`[汽水音乐] 获取播放源错误: ${error.message}`);
    return {
      url: ""
    };
  }
}

/**
 * 获取排行榜列表
 * @async
 * @returns {Promise<Array<Object>>} 排行榜分组列表
 *
 * @description
 * 返回固定的排行榜列表（热歌榜、新歌榜、欧美榜、音乐人歌曲榜）
 *
 * @example
 * const topLists = await getTopLists();
 * // Returns: [{ title: "默认排行榜", data: [...] }]
 */
async function getTopLists() {
  return [{
    "title": "默认排行榜",
    "data": [{
      "id": "7036274230471712007",
      "description": "汽水音乐内每周热度最高的50首歌，每周四更新",
      "coverImg": "https://p3-luna.douyinpic.com/img/tos-cn-i-b829550vbb/d0d8d48461a62748e84689cdf049b19a.png~tplv-b829550vbb-resize:960:960.png",
      "title": "热歌榜"
    }, {
      "id": "7060812597884869927",
      "description": "近期发行的热度最高的50首新歌，每周四更新",
      "coverImg": "https://p3-luna.douyinpic.com/img/tos-cn-i-b829550vbb/f12f7eb5b54d0899c7c724df009668a8.png~tplv-b829550vbb-resize:960:960.png",
      "title": "新歌榜"
    }, {
      "id": "7061475546400005410",
      "description": "汽水音乐内每周热度最高的50首外文歌曲，每周四更新",
      "coverImg": "https://p3-luna.douyinpic.com/img/tos-cn-i-b829550vbb/33747550ed5499b58feda42a21748637.png~tplv-b829550vbb-resize:960:960.png",
      "title": "欧美榜"
    }, {
      "id": "7415959718721494311",
      "description": "抖音音乐人开放平台上传歌曲，综合每周站内热度进行排序展示",
      "coverImg": "https://p3-luna.douyinpic.com/img/tos-cn-v-2774c002/o8FQKiQQBxHWa2hzsBNAgYOX6iEHEAibADAbfB~tplv-b829550vbb-resize:960:960.png",
      "title": "音乐人歌曲榜"
    }]
  }];
}

/**
 * 获取排行榜详细信息
 * @async
 * @param {Object} topListItem - 排行榜对象
 * @param {string} topListItem.id - 排行榜 ID
 * @param {number} [page=1] - 页码（未使用，始终返回完整榜单）
 * @returns {Promise<Object>} 排行榜详细信息（包含音乐列表）
 *
 * @description
 * 获取指定排行榜的完整曲目列表
 *
 * @example
 * const detail = await getTopListDetail({ id: "7036274230471712007" });
 * // Returns: { ...topListItem, musicList: [...] }
 */
async function getTopListDetail(topListItem, page = 1) {
  const response = await axios.default.get(`https://api5-lf.qishui.com/luna/charts/${topListItem.id}?charge=0`, {
    "headers": QISHUI_API_HEADERS
  });

  const apiData = response.data;

  return Object.assign(Object.assign({}, topListItem), {
    "musicList": apiData.chart.track_ranks.map(parseRankTrackItem)
  });
}

/**
 * 导入音乐歌单
 * @async
 * @param {string} playlistUrl - 歌单分享链接或纯数字 ID
 * @returns {Promise<Array<Object>>} 歌单中的音乐列表
 *
 * @description
 * 支持两种格式：
 * 1. 完整分享链接：https://xxx.douyin.com/qishui/share/playlist?playlist_id=123456
 * 2. 纯数字 ID：123456
 *
 * @example
 * const musicList = await importMusicPlaylist("7036274230471712007");
 * // Returns: [{ id, title, artist, ... }, ...]
 */
async function importMusicPlaylist(playlistUrl) {
  let playlistId;

  // 尝试从完整 URL 中提取 ID
  !playlistId && (playlistId = (playlistUrl.match(/https?:\/\/(.*?).douyin.com\/qishui\/share\/playlist\?playlist_id=([0-9]+)/) || [])[2]);

  // 尝试匹配纯数字 ID
  if (!playlistId) {
    playlistId = (playlistUrl.match(/^(\d+)$/) || [])[1];
  }

  if (!playlistId) return;

  const playlistDetail = await fetchPlaylistDetail(playlistId);
  return playlistDetail.data.media_resources.map(parsePlaylistMediaResource);
}

/**
 * 获取歌单详细信息（内部函数）
 * @async
 * @private
 * @param {string} playlistId - 歌单 ID
 * @returns {Promise<Object>} 歌单详细数据
 *
 * @description
 * 通过汽水音乐 API 获取歌单完整信息
 *
 * @example
 * const detail = await fetchPlaylistDetail("7036274230471712007");
 * // Returns: { data: { media_resources: [...] } }
 */
async function fetchPlaylistDetail(playlistId) {
  try {
    return await axios.default.post("https://api5-lq.qishui.com/luna/playlist/detail?charge=0", {
      "playlist_id": playlistId
    }, {
      "headers": QISHUI_API_HEADERS
    });
  } catch (error) {
    return [];
  }
}

/**
 * 获取艺术家作品列表
 * @async
 * @param {Object} artist - 艺术家对象
 * @param {string} artist.id - 艺术家 ID
 * @param {number} page - 页码（未使用，始终返回全部）
 * @param {number} limit - 限制数量（未使用）
 * @returns {Promise<Object>} 艺术家作品数据
 * @returns {Array<Object>} return.data - 音乐列表
 *
 * @description
 * 获取指定艺术家的所有曲目（最多1000首）
 *
 * @example
 * const works = await getArtistWorks({ id: "123456" }, 1, 20);
 * // Returns: { data: [...] }
 */
async function getArtistWorks(artist, page, limit) {
  const response = await axios.default.get(`https://api5-lq.qishui.com/luna/artists/${artist.id}/tracks?count=1000&charge=0`, {
    "headers": QISHUI_API_HEADERS
  });

  const apiData = response.data;

  return {
    "data": apiData.tracks.map(parseTrackItem)
  };
}

/**
 * 获取专辑信息
 * @async
 * @param {Object} album - 专辑对象
 * @param {string} album.id - 专辑 ID
 * @returns {Promise<Object>} 专辑详细信息
 * @returns {Array<Object>} return.musicList - 专辑曲目列表
 *
 * @description
 * 获取指定专辑的所有曲目（最多1000首）
 *
 * @example
 * const albumInfo = await getAlbumInfo({ id: "123456" });
 * // Returns: { musicList: [...] }
 */
async function getAlbumInfo(album) {
  const response = await axios.default.get(`https://api5-lq.qishui.com/luna/albums/${album.id}?count=1000&charge=0`, {
    "headers": QISHUI_API_HEADERS
  });

  const apiData = response.data;

  return {
    "musicList": apiData.tracks.map(parseTrackItem)
  };
}

/**
 * 获取推荐歌单标签
 * @async
 * @returns {Promise<Object>} 标签数据
 * @returns {Array<Object>} return.data - 自定义标签（空）
 * @returns {Array<Object>} return.pinned - 固定标签列表
 *
 * @description
 * 返回固定的歌单分类标签（流行、华语、欧美等）
 *
 * @example
 * const tags = await getRecommendPlaylistTags();
 * // Returns: { data: [], pinned: [...] }
 */
async function getRecommendPlaylistTags() {
  return {
    "data": [],
    "pinned": [{
      "id": 0,
      "title": "每日推荐"
    }, {
      "id": 14,
      "title": "流行"
    }, {
      "id": 8,
      "title": "华语"
    }, {
      "id": 9,
      "title": "欧美"
    }, {
      "id": 20,
      "title": "国风"
    }, {
      "id": 18,
      "title": "民谣"
    }, {
      "id": 15,
      "title": "摇滚"
    }, {
      "id": 38,
      "title": "说唱"
    }, {
      "id": 16,
      "title": "电子"
    }, {
      "id": 19,
      "title": "R&B"
    }, {
      "id": 69,
      "title": "治愈"
    }, {
      "id": 45,
      "title": "睡前"
    }, {
      "id": 40,
      "title": "学习"
    }]
  };
}

/**
 * 根据标签获取推荐歌单
 * @async
 * @param {Object} tag - 标签对象
 * @param {string|number} tag.id - 标签 ID（子频道 ID）
 * @param {number} page - 页码（未使用）
 * @returns {Promise<Object>} 推荐歌单列表
 * @returns {boolean} return.isEnd - 是否已结束
 * @returns {Array<Object>} return.data - 歌单列表
 *
 * @description
 * 根据分类标签获取推荐歌单（流行、华语、欧美等）
 *
 * @example
 * const playlists = await getRecommendPlaylistsByTag({ id: 14 }, 1);
 * // Returns: { isEnd: false, data: [...] }
 */
async function getRecommendPlaylistsByTag(tag, page) {
  let subChannelId = Number.isNaN(parseInt(tag.id, 10)) ? 0 : parseInt(tag.id, 10);

  try {
    const response = await axios.default.post("https://api5-lq.qishui.com/luna/discover/mix?charge=0", {
      "block_type": "discover_playlist_mix",
      "feed_discover_extra": {},
      "latest_douyin_liked_playlist_show_ts": 0,
      "sub_channel_id": subChannelId
    }, {
      "headers": QISHUI_API_HEADERS
    });

    return {
      "isEnd": false,
      "data": response.data.inner_block.map(parseRecommendPlaylistBlock)
    };
  } catch (error) {
    return {
      "isEnd": false,
      "data": []
    };
  }
}

/**
 * 获取音乐评论
 * @async
 * @param {Object} musicItem - 音乐对象
 * @param {string} musicItem.id - 音乐 ID
 * @param {number} [page=1] - 页码
 * @returns {Promise<Object>} 评论数据
 * @returns {boolean} return.isEnd - 是否已到最后一页
 * @returns {Array<Object>} return.data - 评论列表
 *
 * @description
 * 分页获取指定音乐的用户评论
 *
 * @example
 * const comments = await getMusicComments({ id: "123456" }, 1);
 * // Returns: { isEnd: false, data: [...] }
 */
async function getMusicComments(musicItem, page = 1) {
  const cursor = (page - 1) * PAGE_SIZE;
  const response = await axios.default.get(`https://api5-lq.qishui.com/luna/comments?group_id=${musicItem.id}&cursor=${cursor}&count=${PAGE_SIZE}&charge=0`, {
    "headers": QISHUI_API_HEADERS
  });

  const apiData = response.data;

  return {
    "isEnd": page * PAGE_SIZE > apiData.count ? true : false,
    "data": apiData.comments.map(parseCommentItem)
  };
}

/**
 * 获取歌单信息
 * @async
 * @param {Object} playlist - 歌单对象
 * @param {string} playlist.id - 歌单 ID
 * @returns {Promise<Object>} 歌单详细信息
 * @returns {boolean} return.isEnd - 始终为 true
 * @returns {Array<Object>} return.musicList - 歌单曲目列表
 *
 * @description
 * 获取指定歌单的完整曲目列表
 *
 * @example
 * const info = await getMusicPlaylistInfo({ id: "123456" });
 * // Returns: { isEnd: true, musicList: [...] }
 */
async function getMusicPlaylistInfo(playlist) {
  const playlistDetail = await fetchPlaylistDetail(playlist.id);

  return {
    "isEnd": true,
    "musicList": playlistDetail.data.media_resources.map(parsePlaylistMediaResource)
  };
}

// ============================================
// 插件导出配置
// ============================================

module.exports = {
  "platform": "汽水音乐",
  "version": "0.2.3",
  "author": "Toskysun&简云",
  "appVersion": ">0.1.0-alpha.0",
  "srcUrl": "https://musicfree-plugins.netlify.app/plugins/qishui.js",
  "cacheControl": "no-cache",
  // 声明插件支持的音质列表
  "supportedQualities": ["128k", "320k", "flac"],
  "hints": {
    "importMusicSheet": [
      "汽水APP：歌单-分享-分享链接；手动访问链接后再复制链接粘贴即可",
      "网页：复制URL并粘贴，或者直接输入纯数字歌单ID即可",
      "导入时间和歌单大小有关，请耐心等待"
    ]
  },
  "supportedSearchType": ["music"],

  /**
   * 搜索功能
   * @param {string} query - 搜索关键词
   * @param {number} page - 页码
   * @param {string} type - 搜索类型（仅支持 "music"）
   */
  async "search"(query, page, type) {
    if (type === "music") return await searchMusic(query, page);
  },

  "getMusicInfo": getMusicInfo,
  "getLyric": getMusicDetailInfo,
  "getMediaSource": getMusicPlaybackSource,
  "getTopLists": getTopLists,
  "getTopListDetail": getTopListDetail,
  "importMusicSheet": importMusicPlaylist,
  "getArtistWorks": getArtistWorks,
  "getAlbumInfo": getAlbumInfo,
  "getRecommendSheetTags": getRecommendPlaylistTags,
  "getRecommendSheetsByTag": getRecommendPlaylistsByTag,
  "getMusicSheetInfo": getMusicPlaylistInfo,
  "getMusicComments": getMusicComments
};
