const axios = require('axios');

const CONFIG = {
    platform: "汽水 Vip",
    author: "简云",
    version: "2.2.0",
    srcUrl: "https://gitee.com/janyun/music-free-plugin/raw/master/qishui.vip.js",
    primaryKey: ["id"],
    cacheControl: "no-store",
    hints: {
        importMusicItem: ["请输入汽水音乐歌曲分享链接或 id"],
        importMusicSheet: ["请输入汽水音乐歌单链接或 歌单id"],
    },
    userVariables: [
        {
            key: "QQ",
            title: "您的QQ号码",
        }
    ],
    pageSize: 30,
    supportedSearchType: ['music'],
    requestRetryCount: 3, // 请求重试次数
    requestRetryDelay: 1000, // 重试延迟时间(毫秒)
    apiBase: 'http://api.vsaa.cn/api/music.qishui.vip', // API基础地址
    proxyServer: 'https://proxy.qishui.vsaa.cn/qishui/proxy' // 代理服务器地址
};

/**
 * 工具函数集
 */
const Utils = {
    /**
     * 延迟函数
     */
    delay: function(ms) {
        return new Promise(function(resolve) {
            setTimeout(resolve, ms);
        });
    },

    /**
     * 带重试的请求函数
     */
    retryRequest: function(requestFn, retries, delay) {
        const _this = this;
        retries = retries || CONFIG.requestRetryCount;
        delay = delay || CONFIG.requestRetryDelay;
        
        return new Promise(function(resolve, reject) {
            const attemptRequest = function(attempt) {
                requestFn().then(resolve).catch(function(error) {
                    if (attempt >= retries) {
                        reject(error);
                        return;
                    }
                    
                    console.warn('请求失败，第' + (attempt + 1) + '次重试...', error.message);
                    
                    if (delay > 0) {
                        _this.delay(delay).then(function() {
                            attemptRequest(attempt + 1);
                        });
                    } else {
                        attemptRequest(attempt + 1);
                    }
                });
            };
            
            attemptRequest(0);
        });
    }
};

/**
 * 数据转换器
 */
const DataTransformer = {
    /**
     * 转换歌曲数据
     */
    transformSong: function(item) {
        return {
            platform: CONFIG.platform,
            id: item.id || '',
            title: item.name || '未知歌曲',
            artist: item.artists || '未知歌手',
            artwork: item.cover || '',
            album: item.album || '未知专辑',
            duration: Math.floor(item.duration/1000 || 0),
            rawData: item
        };
    }
};

/**
 * API服务层
 */
const ApiService = {
    /**
     * 发起带重试的API请求
     */
    request: function(endpoint, params, retryCount) {
        console.log('请求接口: ' + endpoint + '，参数:', params);
        
        const requestFn = () => {
            return axios.get(CONFIG.apiBase, {
                params: { act: endpoint, ...params },
                timeout: 10000
            }).then(response => {
                return response.data;
            });
        };
        
        retryCount = retryCount || CONFIG.requestRetryCount;
        return Utils.retryRequest(requestFn, retryCount).catch(error => {
            throw new Error('API请求失败(' + endpoint + '): ' + error.message);
        });
    },

    /**
     * 搜索功能
     */
    search: function(query, page, type, pagesize = CONFIG.pageSize) {
        page = page || 1;
        
        return this.request('search', {
            keywords: query,
            page: page,
            pagesize: pagesize,
            type: type
        });
    }
};

/**
 * 业务逻辑层
 */
const Service = {
    /**
     * 搜索音乐内容
     */
    search: function(query, page, type, pagesize = CONFIG.pageSize) {
        page = page || 1;
        type = type || 'music';
        
        if (CONFIG.supportedSearchType.indexOf(type) === -1) {
            return Promise.resolve({ isEnd: true, data: [] });
        }
        
        return ApiService.search(query, page, type, pagesize).then(response => {
            const data = response.data || {};
            let transformer;
            
            switch (type) {
                default:
                    transformer = DataTransformer.transformSong;
            }
            
            const items = (data.lists || []).map(transformer);
            const totalPages = Math.ceil(data.total / CONFIG.pageSize);
            const isEnd = page >= totalPages;
            
            return { 
                isEnd: isEnd, 
                data: items, 
                total: data.total || items.length 
            };
        }).catch(error => {
            console.error('搜索失败:', error);
            return { isEnd: true, data: [] };
        });
    },

    /**
     * 获取音源播放地址
     */
    getMediaSource: async function(mediaItem, quality = 'standard') {
        if (!mediaItem?.id) return null;

        try {
            // 1. 获取原始音源信息
            const { data } = await axios.get(CONFIG.apiBase, {
                params: { act: 'song', id: mediaItem.id, quality },
                timeout: 15000
            });

            const song = data?.data?.[0];
            // console.log(song)
            if (!song?.url) return null;

            // 2. 无需解密：直接返回
            if (!song.ekey) {
                return this.buildAudioInfo(song, song.url);
            }
            
            // 3. 需要解密：调用代理服务
            try {
                const proxyRes = await axios.post(
                    CONFIG.proxyServer,
                    {
                        url: song.url,
                        key: song.ekey,
                        filename: song.name,
                        ext: 'aac'
                    },
                    {
                        timeout: 60000,
                        headers: { 'Content-Type': 'application/json' }
                    }
                );

                if (proxyRes.data?.code === 200) {
                    return { url: proxyRes.data.url }
                } else {
                    console.warn('代理服务返回错误:', proxyRes.data?.msg || '未知错误');
                }
            } catch (err) {
                console.warn('代理请求失败，回退到原始地址:', err.message);
            }
            return {
                needDecrypt: true,
                decryptKey: song.ekey,
                _note: '需本地解密，请确保代理服务运行'
            };

        } catch (error) {
            console.error('获取音源失败:', error.message);
            return null;
        }
    },
    /**
     * 获取歌词
     */
    getLyric: async function(musicItem) {
        if (!musicItem?.id) return null;
        
        try {
            const response = await axios.get(CONFIG.apiBase, {
                params: { act: 'song', id: musicItem.id },
                timeout: 10000
            });
            return { rawLrc: response.data?.data?.[0]?.lyric || null };
        } catch (error) {
            console.error('获取歌词失败:', error.message);
            return null;
        }
    },
    /**
     * 歌单导入
     */
    importMusicSheet: async function(input) {
        return ApiService.request('playlist', { id: input }).then(response => {
            const data = response.data || {};
            const items = (data.list || []).map(DataTransformer.transformSong);
            console.log(data)
            return items;
        }).catch(error => {
            console.error('搜索失败:', error);
            return [];
        });
    },

};

/**
 * 汽水音乐插件模块
 */
module.exports = {
    // 基础信息
    author: CONFIG.author,
    platform: CONFIG.platform,
    version: CONFIG.version,
    srcUrl: CONFIG.srcUrl,
    
    // 配置
    primaryKey: CONFIG.primaryKey,
    cacheControl: CONFIG.cacheControl,
    hints: CONFIG.hints,
    userVariables: CONFIG.userVariables,
    supportedSearchType: CONFIG.supportedSearchType,
    
    // 核心方法
    search: Service.search,
    getLyric: Service.getLyric,
    getMediaSource: Service.getMediaSource,
    importMusicSheet: Service.importMusicSheet
};