/**
 * PlaylistOut Official MusicFree Plugin
 * Version: 1.3.9
 * Author: LengxiQwQ
 * Built: 2026-10-04T16:05:18.504Z
 * Homepage: https://playlistout.lengxiqwq.com
 * Source: https://github.com/LengxiQwQ/playlistout
 */

/**
 * PlaylistOut 官方 MusicFree 插件 (v1.3.9)
 *
 * 遵循 MusicFree 插件开发规范 (CommonJS)
 * 支持双端双模驱动：
 *   1. 桌面端 (Desktop/Electron)：
 *      - 本地离线 JSON 歌单文件导入（一键浏览选文件弹窗 + 拖拽 + 本地绝对路径导入，零网络请求）
 *      - 优雅的桌面 Toast 播放提示与 Sibling Bridge 原生音源桥接
 *   2. 移动端 (Mobile/Android/React Native/Hermes)：
 *      - 纯净全曲秒播直连梯队：与电脑版逻辑与音源体验完全统一，涵盖周杰伦/林俊杰等 VIP 曲目极速秒播
 *      - 坚决杜绝任何酷我防盗链语音干扰、爱坤音源、卡密广告，毫秒级返回纯净正版直链
 *      - 离线歌单全量支持：直接粘贴官网导出的 JSON 文本导入，或输入在线 JSON 直链导入
 *   3. 生产 API 在线毫秒级万能解析（QQ音乐 / 网易云 / 酷狗 / 汽水）
 *   4. Android Hermes 引擎全语法兼容（杜绝 ?., ??, async arrow 语法）
 */

let _cachedFs = null;
let _cachedPath = null;
let _cachedElectron = null;
let _hostLoadPromise = null;

/**
 * 宿主运行环境检测 (Desktop Electron vs Mobile Android/Hermes)
 */
function isHostElectron() {
  if (typeof globalThis !== 'undefined' && typeof globalThis.__PLAYLISTOUT_MOCK_ELECTRON__ === 'boolean') {
    return globalThis.__PLAYLISTOUT_MOCK_ELECTRON__;
  }
  try {
    const realProc = new Function('return typeof process !== "undefined" ? process : null')();
    if (realProc && realProc.versions && realProc.versions.electron) {
      return true;
    }
  } catch (_) {}
  return false;
}

/**
 * 动态逃逸沙箱并加载 Node.js 原生模块 (fs, path, electron)
 *
 * MusicFree Desktop (Electron 25 / Node 18.15) 在 GUI 模式下启动时：
 * - 插件运行在 Function(...) 沙箱中，沙箱白名单 require('fs') 返回 null
 * - GUI 模式下 process.mainModule 为 undefined
 * - 但通过 new Function('s', 'return import(s)') 调用原生 ESM dynamic import('module')
 *   可 100% 拿到 Node 内部 Module._load，进而同步加载真实的 fs、path 与 electron 模块。
 */
function ensureHostModulesAsync() {
  if (_cachedFs && _cachedPath) {
    return Promise.resolve({ fs: _cachedFs, path: _cachedPath, electron: _cachedElectron });
  }
  if (_hostLoadPromise) {
    return _hostLoadPromise;
  }

  _hostLoadPromise = (async function () {
    // 1. 先尝试同步途径（裸 Node.js 测试环境）
    try {
      const fsMod = require('fs');
      if (fsMod && typeof fsMod.readFileSync === 'function') _cachedFs = fsMod;
    } catch (_) {}
    try {
      const pathMod = require('path');
      if (pathMod && typeof pathMod.join === 'function') _cachedPath = pathMod;
    } catch (_) {}

    // 2. 通过 new Function 执行原生 dynamic import('module') / import('fs')
    try {
      const dynImport = new Function('specifier', 'return import(specifier)');
      const modNs = await dynImport('module');
      const Module = (modNs && modNs.Module) || (modNs && modNs.default);
      if (Module && typeof Module._load === 'function') {
        if (!_cachedFs) {
          try {
            _cachedFs = Module._load('fs');
          } catch (_) {}
        }
        if (!_cachedPath) {
          try {
            _cachedPath = Module._load('path');
          } catch (_) {}
        }
        if (!_cachedElectron) {
          try {
            _cachedElectron = Module._load('electron');
          } catch (_) {}
        }
      }
      if (!_cachedFs) {
        try {
          const fsNs = await dynImport('fs');
          _cachedFs = (fsNs && fsNs.default) || fsNs;
        } catch (_) {}
      }
      if (!_cachedPath) {
        try {
          const pathNs = await dynImport('path');
          _cachedPath = (pathNs && pathNs.default) || pathNs;
        } catch (_) {}
      }
    } catch (_) {}

    return { fs: _cachedFs, path: _cachedPath, electron: _cachedElectron };
  })();

  return _hostLoadPromise;
}

/**
 * 同步获取真实 fs 模块（优先返回已预热的 _cachedFs，兼容裸 Node 与 Electron 环境）
 */
function getFsModule() {
  if (_cachedFs && typeof _cachedFs.readFileSync === 'function') {
    return _cachedFs;
  }

  // Tier 1: 直接 require('fs')（裸 Node.js 环境）
  try {
    const m = require('fs');
    if (m && typeof m.readFileSync === 'function') {
      _cachedFs = m;
      return m;
    }
  } catch (_) {}

  // Tier 2: new Function 逃逸沙箱 → 真实 process.mainModule.require
  try {
    const realProcess = new Function('return typeof process !== "undefined" ? process : null')();
    if (realProcess && realProcess.mainModule && typeof realProcess.mainModule.require === 'function') {
      const m = realProcess.mainModule.require('fs');
      if (m && typeof m.readFileSync === 'function') {
        _cachedFs = m;
        return m;
      }
    }
  } catch (_) {}

  // Tier 3: new Function 逃逸 → global/globalThis.require
  try {
    const realGlobal = new Function(
      'return typeof global !== "undefined" ? global : (typeof globalThis !== "undefined" ? globalThis : null)'
    )();
    if (realGlobal) {
      if (typeof realGlobal.require === 'function') {
        const m = realGlobal.require('fs');
        if (m && typeof m.readFileSync === 'function') {
          _cachedFs = m;
          return m;
        }
      }
      if (
        realGlobal.process &&
        realGlobal.process.mainModule &&
        typeof realGlobal.process.mainModule.require === 'function'
      ) {
        const m = realGlobal.process.mainModule.require('fs');
        if (m && typeof m.readFileSync === 'function') {
          _cachedFs = m;
          return m;
        }
      }
    }
  } catch (_) {}

  return null;
}

/**
 * 读取本地 UTF-8 文本文件（兼容异步 import('fs')、同步 fsModule 以及底层 process.binding('fs')）
 */
async function readLocalFileText(targetPath) {
  await ensureHostModulesAsync();

  const fsMod = getFsModule();
  if (fsMod && typeof fsMod.readFileSync === 'function') {
    if (typeof fsMod.existsSync === 'function' && !fsMod.existsSync(targetPath)) {
      throw new Error(`未找到指定的本地歌单文件: ${targetPath}`);
    }
    try {
      return fsMod.readFileSync(targetPath, 'utf-8');
    } catch (err) {
      throw new Error(`读取本地歌单文件失败: ${err.message}`);
    }
  }

  // 兜底：通过真实 process.binding('fs') 直接读取
  try {
    const realProcess = new Function('return typeof process !== "undefined" ? process : null')();
    if (realProcess && typeof realProcess.binding === 'function') {
      const fsBinding = realProcess.binding('fs');
      if (fsBinding) {
        if (typeof fsBinding.internalModuleReadJSON === 'function') {
          const res = fsBinding.internalModuleReadJSON(targetPath);
          const jsonStr = Array.isArray(res) ? res[0] : res;
          if (typeof jsonStr === 'string' && jsonStr.length > 0) {
            return jsonStr;
          }
          throw new Error(`未找到指定的本地歌单文件: ${targetPath}`);
        }
        if (typeof fsBinding.readFileUtf8 === 'function') {
          return fsBinding.readFileUtf8(targetPath, 0);
        }
      }
    }
  } catch (err) {
    if (err && /未找到指定的本地歌单文件/.test(err.message)) {
      throw err;
    }
  }

  throw new Error(`无法读取本地歌单文件: ${targetPath}`);
}

const PLUGIN_PLATFORM = '把你的歌单带走 (PlaylistOut)';
const LEGACY_PLATFORM = 'PlaylistOut';

function isSelfPlatform(plat) {
  return (
    !plat ||
    plat === PLUGIN_PLATFORM ||
    plat === '把你的歌单带走' ||
    plat === LEGACY_PLATFORM
  );
}

/**
 * 在 MusicFree Desktop 渲染进程弹窗中自动注入：
 * 导入歌单弹窗：「📂 选择本地 JSON」与「🌐 去官网解析歌单」并排虚线按钮 + 拖拽支持
 */
const RENDERER_FILE_PICKER_SCRIPT = `
(function() {
  var SCRIPT_VER = 'v139';
  if (window.__playlistoutFilePickerVer === SCRIPT_VER) return;
  window.__playlistoutFilePickerVer = SCRIPT_VER;

  // 清理历史旧版本残留的药丸与自定义样式，确保面板与弹窗纯净稳定
  try {
    var oldStyle = document.getElementById('playlistout-user-variables-style');
    if (oldStyle && oldStyle.parentNode) oldStyle.parentNode.removeChild(oldStyle);
    var oldPills = document.querySelectorAll('.playlistout-var-pills');
    for (var p = 0; p < oldPills.length; p++) {
      if (oldPills[p].parentNode) oldPills[p].parentNode.removeChild(oldPills[p]);
    }
    var oldWebTokenBtn = document.getElementById('playlistout-open-web-btn');
    if (oldWebTokenBtn && oldWebTokenBtn.innerText.indexOf('Token') !== -1) {
      oldWebTokenBtn.remove();
    }
  } catch (_) {}

  function openOfficialWebsite() {
    var url = 'https://playlistout.lengxiqwq.com';
    try {
      var shared = window['@shared/utils'];
      if (shared && shared.shell && typeof shared.shell.openExternal === 'function') {
        shared.shell.openExternal(url);
        return;
      }
    } catch (_) {}
    try {
      window.open(url, '_blank');
    } catch (_) {}
  }

  function setInputValueAndNotify(inputEl, newValue) {
    if (!inputEl) return;
    try {
      var setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(inputEl, newValue);
    } catch (_) {
      inputEl.value = newValue;
    }
    inputEl.dispatchEvent(new Event('input', { bubbles: true }));
    inputEl.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function applyChosenFile(modal, chosenValue) {
    if (!modal || !chosenValue) return;
    var textInput = modal.querySelector('.input-area input:not([type="file"])');
    if (!textInput) return;
    setInputValueAndNotify(textInput, chosenValue);

    setTimeout(function() {
      var confirmBtn = modal.querySelector('.opeartion-area div[data-type="primaryButton"]');
      if (confirmBtn && confirmBtn.getAttribute('data-disabled') !== 'true') {
        confirmBtn.click();
      }
    }, 80);
  }

  function createDashedButton(id, text, onClick) {
    var btn = document.createElement('div');
    btn.id = id;
    btn.setAttribute('role', 'button');
    btn.innerText = text;
    btn.style.cssText = [
      'box-sizing: border-box',
      'padding: calc(0.6em - 1.5px) 0.85em',
      'border-radius: 8px',
      'border: 1.5px dashed #0A95C8',
      'background: rgba(10, 149, 200, 0.06)',
      'color: #0A95C8',
      'font-size: 0.9em',
      'font-weight: 500',
      'line-height: 1em',
      'display: flex',
      'align-items: center',
      'justify-content: center',
      'cursor: pointer',
      'user-select: none',
      'white-space: nowrap',
      'transition: all 0.15s ease'
    ].join(';');
    btn.onmouseenter = function() { btn.style.background = 'rgba(10, 149, 200, 0.15)'; };
    btn.onmouseleave = function() { btn.style.background = 'rgba(10, 149, 200, 0.06)'; };
    btn.onclick = onClick;
    return btn;
  }

  function enhancePlaylistOutModal() {
    var modals = document.querySelectorAll('.modal--simple-input-with-state');
    for (var i = 0; i < modals.length; i++) {
      var modal = modals[i];
      var inputArea = modal.querySelector('.input-area');
      var opeArea = modal.querySelector('.opeartion-area');
      var textInput = inputArea ? inputArea.querySelector('input:not([type="file"])') : null;
      if (!inputArea || !opeArea || !textInput) continue;

      var placeholder = (textInput.getAttribute('placeholder') || '');
      var hintText = (modal.querySelector('.hint-area') || {}).innerText || '';
      if (
        placeholder.indexOf('PlaylistOut') === -1 &&
        placeholder.indexOf('把你的歌单带走') === -1 &&
        hintText.indexOf('PlaylistOut') === -1 &&
        hintText.indexOf('playlistout') === -1 &&
        hintText.indexOf('把你的歌单带走') === -1
      ) {
        continue;
      }

      // 修正预输入占位符文字与长度限制
      var targetPlaceholder = '粘贴歌单分享链接（QQ/网易/酷狗/汽水）';
      if (placeholder !== targetPlaceholder) {
        textInput.setAttribute('placeholder', targetPlaceholder);
      }
      if (textInput.hasAttribute('maxlength')) {
        textInput.removeAttribute('maxlength');
      }

      // 动态监听输入：若用户粘贴酷狗音乐链接，动态展示免登录仅解析前 10 首的温馨提示
      function updateKugouModalTip() {
        var val = (textInput.value || '').trim();
        var tip = inputArea.querySelector('#playlistout-kugou-modal-tip');
        var isKugou = /kugou\.com|酷狗/i.test(val);
        if (isKugou) {
          if (!tip) {
            tip = document.createElement('div');
            tip.id = 'playlistout-kugou-modal-tip';
            tip.style.cssText =
              'margin-top:6px;padding:6px 10px;border-radius:6px;background:rgba(245,158,11,0.08);border:1px dashed rgba(245,158,11,0.5);color:#d97706;font-size:12px;line-height:1.45;text-align:left;';
            tip.innerHTML =
              '💡 <b>酷狗全量导入提示：</b>未配置 Token 仅可解析前 10 首。<br>前往官网 (<b>playlistout.lengxiqwq.com</b>) 扫码登录，复制 Token 填入「插件设置」即可全量导入。';
            inputArea.appendChild(tip);
          }
        } else if (tip) {
          tip.remove();
        }
      }
      textInput.removeEventListener('input', updateKugouModalTip);
      textInput.addEventListener('input', updateKugouModalTip);
      updateKugouModalTip();

      if (modal.querySelector('#playlistout-file-picker-btn')) continue;

      var existingWebBtn = modal.querySelector('#playlistout-open-web-btn');
      if (existingWebBtn) existingWebBtn.remove();

      opeArea.style.gap = '10px';
      opeArea.style.flexWrap = 'wrap';

      var fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = '.json,application/json';
      fileInput.style.display = 'none';

      var pickBtn = createDashedButton('playlistout-file-picker-btn', '📂 选择本地 JSON', function(e) {
        e.preventDefault();
        e.stopPropagation();
        fileInput.value = '';
        fileInput.click();
      });

      var webBtn = createDashedButton('playlistout-open-web-btn', '🌐 去官网解析歌单', function(e) {
        e.preventDefault();
        e.stopPropagation();
        openOfficialWebsite();
      });

      fileInput.onchange = function() {
        var f = fileInput.files && fileInput.files[0];
        if (!f) return;
        var fullPath = f.path || '__PICK_FILE__';
        applyChosenFile(modal, fullPath);
      };

      var confirmBtn = opeArea.querySelector('div[data-type="primaryButton"]');
      if (confirmBtn) {
        opeArea.insertBefore(fileInput, confirmBtn);
        opeArea.insertBefore(pickBtn, confirmBtn);
        opeArea.insertBefore(webBtn, confirmBtn);
      } else {
        opeArea.appendChild(fileInput);
        opeArea.appendChild(pickBtn);
        opeArea.appendChild(webBtn);
      }

      // 支持直接将 .json 文件拖拽到弹窗内导入
      modal.ondragover = function(e) {
        e.preventDefault();
        e.stopPropagation();
        pickBtn.style.background = 'rgba(10, 149, 200, 0.18)';
      };
      modal.ondragleave = function() {
        pickBtn.style.background = 'rgba(10, 149, 200, 0.06)';
      };
      modal.ondrop = function(e) {
        e.preventDefault();
        e.stopPropagation();
        pickBtn.style.background = 'rgba(10, 149, 200, 0.06)';
        var f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
        if (f && f.path) {
          applyChosenFile(modal, f.path);
        }
      };
    }
  }

  var _enhanceTimer = null;
  function triggerEnhanceDebounced() {
    if (_enhanceTimer) return;
    _enhanceTimer = setTimeout(function() {
      _enhanceTimer = null;
      enhancePlaylistOutModal();
    }, 100);
  }

  triggerEnhanceDebounced();
  var obs = new MutationObserver(triggerEnhanceDebounced);
  obs.observe(document.body || document.documentElement, { childList: true, subtree: true });
})();
`;

function injectRendererFilePicker() {
  ensureHostModulesAsync()
    .then(({ electron }) => {
      if (!electron) return;

      // 拦截主进程 call-plugin-method：当任何平台的曲目无音源时，根据用户配置的 fallbackMode 执行原版匹配、相似音源匹配或提示跳过
      try {
        const ipcMain = electron.ipcMain;
        const handlers = ipcMain && ipcMain._invokeHandlers;
        const channel = '@shared/plugin-manager/call-plugin-method';
        if (handlers && typeof handlers.get === 'function' && handlers.has(channel)) {
          const origHandler = handlers.get(channel);
          if (typeof origHandler === 'function' && !origHandler.__playlistoutWrapped) {
            const wrapped = async function (event, payload) {
              if (payload && payload.method === 'getMediaSource' && Array.isArray(payload.args)) {
                const item = payload.args[0];
                if (item && item.id) {
                  const title = String(item.title || '').trim();
                  const primaryArtist = String(item.artist || '')
                    .replace(/未知歌手/g, '')
                    .split(/[,，、/]/)[0]
                    .trim();
                  const mode = getUserFallbackMode();
                  const cacheKey = `${item.id}_${title}_${primaryArtist}_${mode}`;
                  const cachedFailAt = _noSourceCache.get(cacheKey);
                  if (cachedFailAt && Date.now() - cachedFailAt < NO_SOURCE_TTL_MS) {
                    return null;
                  }
                }
              }
              const res = await origHandler.call(this, event, payload);
              if (
                payload &&
                payload.method === 'getMediaSource' &&
                payload.platform !== PLUGIN_PLATFORM &&
                (!res || !res.url) &&
                Array.isArray(payload.args) &&
                payload.args[0]
              ) {
                return await getMediaSource(payload.args[0], payload.args[1] || 'standard');
              }
              return res;
            };
            wrapped.__playlistoutWrapped = true;
            handlers.set(channel, wrapped);
          }
        }
      } catch (_) {}

      if (!electron.BrowserWindow) return;
      const injectToWin = (win) => {
        try {
          if (!win || win.isDestroyed() || !win.webContents || win.webContents.isDestroyed()) return;
          win.webContents.executeJavaScript(RENDERER_FILE_PICKER_SCRIPT, true).catch(() => {});
          if (!win.webContents.__playlistoutHooked) {
            win.webContents.__playlistoutHooked = true;
            win.webContents.on('did-finish-load', () => {
              try {
                if (!win.isDestroyed() && !win.webContents.isDestroyed()) {
                  win.webContents.executeJavaScript(RENDERER_FILE_PICKER_SCRIPT, true).catch(() => {});
                }
              } catch (_) {}
            });
          }
        } catch (_) {}
      };

      const wins = electron.BrowserWindow.getAllWindows() || [];
      wins.forEach(injectToWin);

      if (electron.app && !electron.app.__playlistoutWindowHooked) {
        electron.app.__playlistoutWindowHooked = true;
        electron.app.on('browser-window-created', (_, win) => injectToWin(win));
      }
    })
    .catch(() => {});
}

// 插件加载时自动在 Electron 宿主中预热模块并注入浏览按钮（仅在 Electron 环境中执行，不阻塞 Node 测试进程退出）
try {
  const realProc = new Function('return typeof process !== "undefined" ? process : null')();
  if (realProc && realProc.versions && realProc.versions.electron) {
    injectRendererFilePicker();
    setTimeout(injectRendererFilePicker, 1200);
    setTimeout(injectRendererFilePicker, 3500);
  }
} catch (_) {}

/**
 * 调用 Electron 主进程原生系统文件选择对话框 (dialog.showOpenDialog)
 */
async function openNativeJsonFileDialog() {
  const { electron } = await ensureHostModulesAsync();
  if (!electron || !electron.dialog || typeof electron.dialog.showOpenDialog !== 'function') {
    return null;
  }
  const win =
    (electron.BrowserWindow &&
      (electron.BrowserWindow.getFocusedWindow() || electron.BrowserWindow.getAllWindows()[0])) ||
    undefined;
  const res = await electron.dialog.showOpenDialog(win, {
    title: '选择 PlaylistOut 导出的本地 JSON 歌单文件',
    buttonLabel: '导入歌单',
    filters: [
      { name: 'JSON 歌单文件 (*.json)', extensions: ['json'] },
      { name: '所有文件 (*.*)', extensions: ['*'] },
    ],
    properties: ['openFile'],
  });
  if (res && !res.canceled && Array.isArray(res.filePaths) && res.filePaths.length > 0) {
    return res.filePaths[0];
  }
  return null;
}

/**
 * 跨环境 HTTP GET / POST 请求助手
 * 兼容 MusicFree 宿主环境 (axios) 与 Node.js / 标准 Fetch 环境
 */
async function httpGet(url, options = {}) {
  const timeoutMs = options.timeout || 15000;
  const headers = Object.assign(
    {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      Accept: 'application/json, text/plain, */*',
      Origin: 'https://playlistout.lengxiqwq.com',
      Referer: 'https://playlistout.lengxiqwq.com/',
      'Sec-Fetch-Site': 'cross-site',
      'Sec-Fetch-Mode': 'cors',
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
    },
    options.headers || {}
  );

  let axiosClient = null;
  if (typeof axios !== 'undefined') {
    axiosClient = axios;
  } else if (typeof globalThis !== 'undefined' && globalThis.axios) {
    axiosClient = globalThis.axios;
  } else {
    try {
      axiosClient = require('axios');
    } catch (_) {}
  }

  if (axiosClient && typeof axiosClient.get === 'function') {
    const res = await axiosClient.get(url, {
      timeout: timeoutMs,
      headers,
      validateStatus: () => true,
    });
    return {
      status: res.status,
      data: res.data,
    };
  }

  if (typeof fetch === 'function') {
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;
    try {
      const res = await fetch(url, {
        method: 'GET',
        headers,
        signal: controller ? controller.signal : undefined,
      });
      const text = await res.text();
      let data = text;
      try {
        data = JSON.parse(text);
      } catch (_) {}
      return {
        status: res.status,
        data,
      };
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  throw new Error('未检测到可用的 HTTP 客户端 (axios 或 fetch)');
}

/**
 * 跨环境 HTTP POST 请求助手
 */
async function httpPost(url, body, options = {}) {
  const timeoutMs = options.timeout || 15000;
  const headers = Object.assign(
    {
      'Content-Type': 'application/json',
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
    options.headers || {}
  );

  let axiosClient = null;
  if (typeof axios !== 'undefined') {
    axiosClient = axios;
  } else if (typeof globalThis !== 'undefined' && globalThis.axios) {
    axiosClient = globalThis.axios;
  } else {
    try {
      axiosClient = require('axios');
    } catch (_) {}
  }

  if (axiosClient && typeof axiosClient.post === 'function') {
    const res = await axiosClient.post(url, body, {
      timeout: timeoutMs,
      headers,
      validateStatus: function () {
        return true;
      },
    });
    return {
      status: res.status,
      data: res.data,
    };
  }

  if (typeof fetch === 'function') {
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timer = controller
      ? setTimeout(function () {
          controller.abort();
        }, timeoutMs)
      : null;
    try {
      const payloadStr = typeof body === 'string' ? body : JSON.stringify(body);
      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: payloadStr,
        signal: controller ? controller.signal : undefined,
      });
      const text = await res.text();
      let data = text;
      try {
        data = JSON.parse(text);
      } catch (_) {}
      return {
        status: res.status,
        data,
      };
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  throw new Error('未检测到可用的 HTTP 客户端 (axios 或 fetch)');
}

/**
 * 获取用户配置的变量对象 (来自 MusicFree 宿主环境 env.getUserVariables())
 */
function getRawUserVariables() {
  try {
    if (typeof env !== 'undefined' && env && typeof env.getUserVariables === 'function') {
      return env.getUserVariables() || {};
    }
    if (
      typeof globalThis !== 'undefined' &&
      globalThis.env &&
      typeof globalThis.env.getUserVariables === 'function'
    ) {
      return globalThis.env.getUserVariables() || {};
    }
  } catch (_) {}
  return {};
}

/**
 * 获取用户配置的音源路由通道 (targetPlatform)
 */
function getUserTargetPlatform() {
  try {
    const userVars = getRawUserVariables();
    const target = userVars && userVars.targetPlatform;
    if (typeof target === 'string' && target.trim()) {
      return target.trim();
    }
  } catch (_) {}
  return 'native';
}

/**
 * 获取用户配置的无原版音源处理策略 (fallbackMode):
 * - 'strict' (默认，或 '1' / 留空): 仅播放 100% 原版原唱，无原版时顶部弹窗提示并跳过
 * - 'similar' (或 '2' / '相似' / '翻唱'): 优先播放原版；若无原版，允许寻找最相似音源（如翻唱/Live/同名曲）并弹窗提示
 * - 'silent_skip' (或 '3' / '静默'): 仅播放 100% 原版原唱，无原版时静默跳过（不弹窗打扰）
 */
function getUserFallbackMode() {
  try {
    const userVars = getRawUserVariables();
    const raw = String((userVars && userVars.fallbackMode) || '').trim().toLowerCase();
    if (raw === 'similar' || raw === '2' || raw.includes('相似') || raw.includes('翻唱')) {
      return 'similar';
    }
    if (raw === 'silent_skip' || raw === 'silent' || raw === '3' || raw.includes('静默')) {
      return 'silent_skip';
    }
  } catch (_) {}
  return 'strict';
}

/**
 * 获取用户配置的酷狗登录凭证 (kugouToken / kugouUserid)
 * 支持格式：
 * 1. kugouToken 填 token，kugouUserid 填 userid
 * 2. kugouToken 填 token:userid 或 userid:token (冒号、逗号或竖线分隔)
 * 3. kugouToken 填 JSON { token, userid }
 * 4. 纯 token (无 userid)
 */
function getKugouCredentials() {
  try {
    const userVars = getRawUserVariables();
    let rawToken = String((userVars && (userVars.kugouToken || userVars.kugou_token)) || '').trim();
    let rawUserid = String((userVars && (userVars.kugouUserid || userVars.kugou_userid)) || '').trim();

    if (!rawToken && !rawUserid) {
      return null;
    }

    // JSON 格式解析
    if (rawToken.startsWith('{') && rawToken.endsWith('}')) {
      try {
        const obj = JSON.parse(rawToken);
        if (obj && typeof obj === 'object') {
          return {
            token: String(obj.token || obj.kugou_token || '').trim(),
            userid: String(obj.userid || obj.kugou_userid || rawUserid || '').trim(),
          };
        }
      } catch (_) {}
    }

    // 复合字符串解析 (以冒号、逗号、竖线分隔)
    if (rawToken.includes(':') || rawToken.includes(',') || rawToken.includes('|')) {
      const parts = rawToken.split(/[:|,]/).map((s) => s.trim()).filter(Boolean);
      if (parts.length >= 2) {
        // 判断哪个是纯数字 userid，哪个是 token
        if (/^\d{5,12}$/.test(parts[0]) && !/^\d{5,12}$/.test(parts[1])) {
          return { userid: parts[0], token: parts[1] };
        } else if (/^\d{5,12}$/.test(parts[1]) && !/^\d{5,12}$/.test(parts[0])) {
          return { token: parts[0], userid: parts[1] };
        } else {
          return { token: parts[0], userid: parts[1] };
        }
      }
    }

    return {
      token: rawToken,
      userid: rawUserid,
    };
  } catch (_) {}
  return null;
}

/**
 * 将歌单原始平台映射为 MusicFree 宿主安装的原生音源插件标识
 *
 * 路由规则（严格对齐 hebijunge/musicfree-plugins 社区插件实际 platform 字段）：
 * - 用户配置为非 auto 时强制走用户指定的 platform
 * - 网易云 (netease)  → 'netease'
 * - QQ音乐 (qqmusic)  → 'qq'
 * - 酷狗音乐 (kugou)  → 'kugou'
 * - 酷我音乐 (kuwo)   → 'kuwo'
 * - 汽水音乐 (qishui) → 'qishui'
 * - 哔哩哔哩 (bili)   → 'bilibili'
 * - 咪咕音乐 (migu)   → 'migu'
 * - 未知或未识别      → 'PlaylistOut'
 */
function resolveMusicPlatform(sourcePlatform) {
  if (!sourcePlatform || typeof sourcePlatform !== 'string') {
    return 'PlaylistOut';
  }

  const sp = sourcePlatform.toLowerCase().trim();
  if (sp === 'netease' || sp === '163' || sp === 'wy' || sp.includes('网易')) {
    return 'netease';
  }
  if (
    sp === '20' ||
    sp === 'qq' ||
    sp === 'qqmusic' ||
    sp === 'tencent' ||
    sp.includes('qq') ||
    sp.includes('企鹅')
  ) {
    return 'qq';
  }
  if (sp === 'webfilter' || sp === 'kugou' || sp === 'kg' || sp.includes('酷狗')) {
    return 'kugou';
  }
  if (sp === 'kuwo' || sp === 'kw' || sp.includes('酷我')) {
    return 'kuwo';
  }
  if (sp === 'qishui' || sp === 'soda' || sp === 'luna' || sp.includes('汽水')) {
    return 'qishui';
  }
  if (sp === 'bilibili' || sp === 'bili' || sp.includes('哔哩') || sp.includes('b站')) {
    return 'bilibili';
  }
  if (sp === 'migu' || sp.includes('咪咕')) {
    return 'migu';
  }

  return 'PlaylistOut';
}

/**
 * 为曲目注入 hebijunge 原生音源插件所需的 _src / _srcOrder 及平台特定字段
 * 缺少 _src 会导致 qq / netease / kugou / qishui / kuwo / migu 插件在 resolveWithFallback
 * 阶段因 pickCandidates(musicItem._src) 为空而直接报错跳过。
 */
function attachNativeSourceMetadata(item, track, targetPlatform) {
  if (!item || typeof item !== 'object') return item;

  const rawId = String((track && track.id) || (item && item.id) || '').trim();
  const stripPrefix = (s, prefix) =>
    s.toLowerCase().startsWith(prefix + '_') ? s.slice(prefix.length + 1) : s;

  const trackRawIds = (track && track.rawIds) || {};

  if (targetPlatform === 'qq' || targetPlatform === '20') {
    const sid = String(
      trackRawIds.qq_songmid ||
        (track && (track.songmid || track.mid)) ||
        stripPrefix(rawId, 'qq')
    ).trim();
    const mediaMid = String(
      (track && (track.strMediaMid || track.mediaMid)) || sid
    ).trim();
    const vid = String((track && (track.mvId || track.vid)) || '').trim();
    // 当从 IndexedDB 恢复曲目时 track.isVip 为 undefined 且无真实 strMediaMid，
    // 默认置 vip=1 以启用 qq 插件 vipPreRoute 直走 vkeys-legacy 高速通道，避免无意义的官方接口 1000ms 空转
    const vip =
      track && track.isVip !== undefined ? (track.isVip ? 1 : 0) : 1;
    item.songmid = sid;
    item.mid = sid;
    item._src = Object.assign({}, item._src, {
      qq: { mid: sid, mediaMid, vid, vip },
    });
    item._srcOrder = ['qq'];
  } else if (targetPlatform === 'netease') {
    const sid = String(
      trackRawIds.netease_id || stripPrefix(rawId, 'netease')
    ).trim();
    const mv = String((track && (track.mvId || track.mv)) || '').trim();
    item._src = Object.assign({}, item._src, {
      netease: { id: sid, mv },
    });
    item._srcOrder = ['netease'];
  } else if (targetPlatform === 'kugou' || targetPlatform === 'WebFilter') {
    const sid = String(
      trackRawIds.kugou_hash ||
        (track && track.hash) ||
        stripPrefix(rawId, 'kugou')
    ).trim();
    const mixsongid = String(
      trackRawIds.kugou_album_audio_id ||
        (track && track.mixsongid) ||
        ''
    ).trim();
    const mvHash = String((track && (track.mvHash || track.mvId)) || '').trim();
    item.hash = sid;
    item._src = Object.assign({}, item._src, {
      kugou: {
        hash: sid,
        hash320: String((track && track.hash320) || ''),
        hashSq: String((track && track.hashSq) || ''),
        mixsongid,
        mvHash,
      },
    });
    item._srcOrder = ['kugou'];
  } else if (targetPlatform === 'qishui') {
    const sid = String(
      trackRawIds.qishui_id ||
        (track && track.trackId) ||
        stripPrefix(rawId, 'qishui')
    ).trim();
    item._src = Object.assign({}, item._src, {
      qishui: { trackId: sid },
    });
    item._srcOrder = ['qishui'];
  } else if (targetPlatform === 'kuwo') {
    const sid = String(
      trackRawIds.kuwo_id || stripPrefix(rawId, 'kuwo')
    ).trim();
    item._src = Object.assign({}, item._src, {
      kuwo: { rid: sid, id: sid },
    });
    item._srcOrder = ['kuwo'];
  } else if (targetPlatform === 'migu') {
    const sid = String(
      trackRawIds.migu_id ||
        (track && track.contentId) ||
        stripPrefix(rawId, 'migu')
    ).trim();
    const copyrightId = String((track && track.copyrightId) || sid).trim();
    item._src = Object.assign({}, item._src, {
      migu: { contentId: sid, copyrightId },
    });
    item._srcOrder = ['migu'];
  } else if (targetPlatform === 'bilibili') {
    const sid = String(
      (track && track.bvid) || stripPrefix(rawId, 'bilibili')
    ).trim();
    item.bvid = sid;
  }

  return item;
}

/**
 * 将 PlaylistOut 歌曲对象映射为 MusicFree 标准 IMusicItem
 * @param {object} track 歌曲元数据对象
 * @param {number} defaultIndex 序号兜底
 * @param {string} defaultPlatform 歌单来源平台标识
 */
function mapTrackToMusicItem(track, defaultIndex = 1, defaultPlatform = 'PlaylistOut') {
  if (!track || typeof track !== 'object') {
    return null;
  }

  // 1. 歌曲标题 (默认 '未知歌曲')
  const title = (track.title || track.name || '未知歌曲').toString().trim() || '未知歌曲';

  // 2. 歌手 (数组逗号拼接，如 "周杰伦, 阿信")
  let artist = '';
  if (Array.isArray(track.artists) && track.artists.length > 0) {
    artist = track.artists
      .map((a) => (typeof a === 'string' ? a : (a && a.name) || ''))
      .map((s) => s.trim())
      .filter(Boolean)
      .join(', ');
  } else if (Array.isArray(track.artistList) && track.artistList.length > 0) {
    artist = track.artistList
      .map((a) => (a && a.name) || '')
      .map((s) => s.trim())
      .filter(Boolean)
      .join(', ');
  } else if (typeof track.artist === 'string' && track.artist.trim()) {
    artist = track.artist.trim();
  } else if (typeof track.author === 'string' && track.author.trim()) {
    artist = track.author.trim();
  } else if (typeof track.singer === 'string' && track.singer.trim()) {
    artist = track.singer.trim();
  }
  if (!artist) {
    artist = '未知歌手';
  }

  // 3. 专辑 (空值兜底 '')
  let album = '';
  if (typeof track.album === 'string' && track.album.trim()) {
    album = track.album.trim();
  } else if (track.albumObj && typeof track.albumObj.name === 'string') {
    album = track.albumObj.name.trim();
  }

  // 4. 封面图 (空值兜底 '')
  let artwork = '';
  if (typeof track.artwork === 'string' && track.artwork.trim()) {
    artwork = track.artwork.trim();
  } else if (typeof track.coverUrl === 'string' && track.coverUrl.trim()) {
    artwork = track.coverUrl.trim();
  } else if (typeof track.picUrl === 'string' && track.picUrl.trim()) {
    artwork = track.picUrl.trim();
  }

  // 5. 时长 (秒，Math.round((track.durationMs || 0) / 1000))
  let duration = 0;
  if (typeof track.durationMs === 'number' && track.durationMs > 0) {
    duration = Math.round(track.durationMs / 1000);
  } else if (typeof track.duration === 'number' && track.duration > 0) {
    duration =
      track.duration > 10000
        ? Math.round(track.duration / 1000)
        : Math.round(track.duration);
  }

  // 6. 唯一标识 (优先使用 track.id，如网易云 song id 或 QQ song mid)
  let id = '';
  if (track.id != null && String(track.id).trim()) {
    id = String(track.id).trim();
  } else {
    id = `${title}_${artist}_${defaultIndex}`;
  }

  // 7. 识别曲目原平台 (用于内部音源路由与 _src 取链字段封装)
  let rawPlatform = track.platform;
  if (!rawPlatform || rawPlatform === 'PlaylistOut') {
    rawPlatform = defaultPlatform;
  }
  let naturalPlatform = resolveMusicPlatform(rawPlatform);
  if (naturalPlatform === 'PlaylistOut') {
    naturalPlatform = resolveMusicPlatformFromTrackFields(track, { id, title, artwork });
  }

  // 8. 平台归属策略 (Platform Routing Strategy)：
  // 移动端默认策略 (native)：将 platform 自动分流至原曲自然平台（qq / netease / kugou / bilibili / migu / qishui），
  // 由用户手机上安装的各原生音乐插件直接解析播放，与电脑端使用体验完全一致！
  // 若用户显式配置特定平台（如 'qq' / 'netease' / 'kugou'）或 'auto' (由本插件全权解析)，则尊重用户设置。
  const isDesktop = isHostElectron();
  const userTarget = getUserTargetPlatform();
  let finalPlatform = PLUGIN_PLATFORM;

  if (!isDesktop) {
    const ut = (userTarget || 'native').toLowerCase();
    if (ut === 'native' || ut === 'split' || ut === 'origin') {
      if (naturalPlatform && naturalPlatform !== 'PlaylistOut' && !isSelfPlatform(naturalPlatform)) {
        finalPlatform = naturalPlatform;
      }
    } else if (ut === 'auto' || isSelfPlatform(ut)) {
      finalPlatform = PLUGIN_PLATFORM;
    } else {
      finalPlatform = ut;
    }
  }

  const item = {
    id,
    title,
    artist,
    album,
    artwork,
    duration,
    platform: finalPlatform,
  };

  if (naturalPlatform && naturalPlatform !== 'PlaylistOut') {
    item._originPlatform = naturalPlatform;
  }

  // 9. 注入原生插件所需的 _src / _srcOrder / songmid / hash 等取链字段
  const targetForSource = finalPlatform !== PLUGIN_PLATFORM ? finalPlatform : naturalPlatform;
  if (targetForSource && targetForSource !== 'PlaylistOut') {
    attachNativeSourceMetadata(item, track, targetForSource);
  }

  return item;
}

/**
 * 从曲目 URL / 封面 / ID 特征推断原始音乐平台
 */
function resolveMusicPlatformFromTrackFields(track, item) {
  const explicitPlat =
    (track && (track._originPlatform || track.originPlatform)) ||
    (item && (item._originPlatform || item.originPlatform));
  if (explicitPlat && !isSelfPlatform(explicitPlat)) {
    return explicitPlat;
  }

  const sourceUrl = String((track && track.sourceUrl) || (item && item.sourceUrl) || '');
  const artwork = String(
    (track && (track.coverUrl || track.artwork)) || (item && item.artwork) || ''
  );
  const id = String((track && track.id) || (item && item.id) || '').trim();
  const trackRawIds = (track && track.rawIds) || {};

  if (trackRawIds.qq_songmid || /qq\.com|gtimg\.cn/i.test(sourceUrl + ' ' + artwork)) {
    return 'qq';
  }
  if (trackRawIds.netease_id || /163\.com|126\.net/i.test(sourceUrl + ' ' + artwork)) {
    return 'netease';
  }
  if (trackRawIds.kugou_hash || /kugou\.com/i.test(sourceUrl + ' ' + artwork)) {
    return 'kugou';
  }
  if (trackRawIds.qishui_id || /qishui|douyinpic\.com|byteimg\.com/i.test(sourceUrl + ' ' + artwork)) {
    return 'qishui';
  }
  if (/kuwo\.cn/i.test(sourceUrl + ' ' + artwork)) {
    return 'kuwo';
  }
  if (/migu\.cn/i.test(sourceUrl + ' ' + artwork)) {
    return 'migu';
  }
  if (/bilibili\.com|hdslb\.com|^BV[0-9A-Za-z]{10}$/i.test(sourceUrl + ' ' + artwork + ' ' + id)) {
    return 'bilibili';
  }
  // QQ 音乐标准 14 位字母数字 songmid (如 003L6Nls0iVKwl)
  if (/^[0-9A-Za-z]{14}$/.test(id) && /[A-Za-z]/.test(id)) {
    return 'qq';
  }
  // 酷狗 32 位 Hex Hash
  if (/^[0-9A-Fa-f]{32}$/.test(id)) {
    return 'kugou';
  }
  // 汽水 19 位数字 track_id
  if (/^\d{18,20}$/.test(id)) {
    return 'qishui';
  }
  // 网易云 5~12 位纯数字 song id
  if (/^\d{5,12}$/.test(id)) {
    return 'netease';
  }
  return 'PlaylistOut';
}

/**
 * 解析并标准化 JSON 格式的歌曲列表
 */
function parseJsonTracks(jsonStr, sourceDesc = 'JSON 数据') {
  let parsed;
  try {
    parsed = JSON.parse(jsonStr);
  } catch (err) {
    const errorPrefix = sourceDesc === 'JSON 数据' ? 'JSON 解析失败' : `${sourceDesc} JSON 解析失败`;
    throw new Error(`${errorPrefix}: ${err.message}`);
  }

  let tracks = null;
  if (Array.isArray(parsed)) {
    tracks = parsed;
  } else if (parsed && typeof parsed === 'object') {
    if (Array.isArray(parsed.tracks)) {
      tracks = parsed.tracks;
    } else if (parsed.data && parsed.data.result && Array.isArray(parsed.data.result.tracks)) {
      tracks = parsed.data.result.tracks;
    } else if (parsed.result && Array.isArray(parsed.result.tracks)) {
      tracks = parsed.result.tracks;
    } else if (parsed.data && Array.isArray(parsed.data.tracks)) {
      tracks = parsed.data.tracks;
    } else if (Array.isArray(parsed.songList)) {
      tracks = parsed.songList;
    } else if (Array.isArray(parsed.songs)) {
      tracks = parsed.songs;
    }
  }

  if (!tracks) {
    throw new Error(`未在 ${sourceDesc}中找到歌曲列表 (tracks)`);
  }

  if (tracks.length === 0) {
    throw new Error(`${sourceDesc}中未包含任何歌曲`);
  }

  // 探测歌单原始平台
  let detectedPlatform =
    parsed.platform ||
    (parsed.result && parsed.result.platform) ||
    (parsed.data && parsed.data.platform) ||
    'PlaylistOut';
  if (detectedPlatform === 'PlaylistOut') {
    const url =
      parsed.sourceUrl ||
      (Array.isArray(tracks) && tracks[0] && tracks[0].sourceUrl) ||
      '';
    if (/music\.163\.com/i.test(url)) detectedPlatform = 'netease';
    else if (/qq\.com/i.test(url)) detectedPlatform = 'qq';
    else if (/kugou\.com/i.test(url)) detectedPlatform = 'kugou';
    else if (/kuwo\.cn/i.test(url)) detectedPlatform = 'kuwo';
    else if (/qishui|douyin/i.test(url)) detectedPlatform = 'qishui';
    else if (/bilibili\.com/i.test(url)) detectedPlatform = 'bilibili';
    else if (/migu\.cn/i.test(url)) detectedPlatform = 'migu';
  }

  const items = tracks
    .map((t, idx) => mapTrackToMusicItem(t, idx + 1, detectedPlatform))
    .filter(Boolean);

  if (items.length === 0) {
    throw new Error('未解析到有效的歌曲数据');
  }

  return items;
}

/**
 * 判断输入是否为本地文件选择触发词 (如点击「浏览」按钮、输入 1 / 浏览 / 本地 / json)
 */
function isFilePickerTrigger(str) {
  if (!str || typeof str !== 'string') return false;
  const s = str.trim().replace(/^["']|["']$/g, '').toLowerCase();
  return (
    s === '__pick_file__' ||
    s === '1' ||
    s === '浏览' ||
    s === '本地' ||
    s === '文件' ||
    s === '选择' ||
    s === 'json' ||
    s === '.json' ||
    s === 'file' ||
    s === 'open' ||
    s === 'pick'
  );
}

/**
 * 判断输入是否为本地 .json 文件路径或 file:// URI
 */
function isLocalJsonPath(str) {
  if (!str || typeof str !== 'string') return false;
  const s = str.trim().replace(/^["']|["']$/g, '');
  if (/^https?:\/\//i.test(s)) return false;
  if (s.startsWith('file://')) return true;
  if (/\.json$/i.test(s)) return true;
  if (/^[a-zA-Z]:[/\\]/.test(s)) return true;
  return false;
}

/**
 * 将输入路径格式化为本地可读取的文件绝对路径
 */
function resolveLocalPath(inputPath) {
  let cleanPath = inputPath.trim().replace(/^["']|["']$/g, '');
  if (cleanPath.startsWith('file://')) {
    cleanPath = cleanPath.slice(7);
    if (/^\/[a-zA-Z]:[/\\]/.test(cleanPath)) {
      cleanPath = cleanPath.slice(1);
    }
    try {
      cleanPath = decodeURIComponent(cleanPath);
    } catch (_) {}
  }
  return cleanPath;
}

/**
 * 判断输入是否为触发打开官网的指令
 */
function isOfficialWebsiteTrigger(str) {
  if (!str || typeof str !== 'string') return false;
  var s = str.trim().toLowerCase();
  return (
    s === '官网' ||
    s === '去官网' ||
    s === '打开官网' ||
    s === 'gw' ||
    s === 'go' ||
    s === 'http://playlistout.lengxiqwq.com' ||
    s === 'http://playlistout.lengxiqwq.com/' ||
    s === 'https://playlistout.lengxiqwq.com' ||
    s === 'https://playlistout.lengxiqwq.com/' ||
    s === 'playlistout.lengxiqwq.com'
  );
}

/**
 * 尝试在系统默认浏览器中打开 PlaylistOut 官方网站
 */
function tryOpenOfficialWebsite() {
  var url = 'https://playlistout.lengxiqwq.com';
  // 1. Electron 桌面环境
  try {
    if (isHostElectron() && _cachedElectron && _cachedElectron.shell) {
      if (typeof _cachedElectron.shell.openExternal === 'function') {
        _cachedElectron.shell.openExternal(url);
        return true;
      }
    }
  } catch (_) {}

  // 2. React Native / Mobile Android 环境尝试调用 Linking
  try {
    var g = typeof globalThis !== 'undefined' ? globalThis : (typeof global !== 'undefined' ? global : null);
    if (g) {
      var nm = g.nativeModuleProxy || (g.__fbBatchedBridge && g.__fbBatchedBridge.NativeModules);
      if (nm && nm.LinkingManager && typeof nm.LinkingManager.openURL === 'function') {
        nm.LinkingManager.openURL(url);
        return true;
      }
      if (nm && nm.IntentAndroid && typeof nm.IntentAndroid.openURL === 'function') {
        nm.IntentAndroid.openURL(url);
        return true;
      }
    }
  } catch (_) {}

  // 3. 浏览器环境 window.open
  try {
    if (typeof window !== 'undefined' && typeof window.open === 'function') {
      window.open(url, '_blank');
      return true;
    }
  } catch (_) {}

  return false;
}

/**
 * 导入歌单 (支持：1. 浏览按钮弹窗选本地 JSON 文件；2. 直接输入本地 .json 路径；3. 在线歌单链接/分享文案解析)
 * @param {string} urlLike 歌单链接、分享文本、浏览触发指令或本地 .json 文件路径
 * @returns {Promise<Array<object>>} IMusicItem[] 歌曲列表
 */
async function importMusicSheet(urlLike) {
  // 每次调用时确保渲染进程浏览按钮已注入
  injectRendererFilePicker();

  if (!urlLike || typeof urlLike !== 'string') {
    throw new Error('请输入有效的歌单链接或分享文本');
  }

  const trimmed = urlLike.trim();
  if (!trimmed) {
    throw new Error('输入内容不能为空');
  }

  // 0. 官网跳转指令支持 (用户在输入框输入 官网 / gw / 官网网址 等，尝试打开浏览器)
  if (isOfficialWebsiteTrigger(trimmed)) {
    tryOpenOfficialWebsite();
    throw new Error('已尝试为您在浏览器中打开官网 (https://playlistout.lengxiqwq.com)，如未弹出请手动访问');
  }

  // 1. 直接粘贴 JSON 文本支持（移动端与跨端核心：用户从官网导出歌单后复制完整 JSON 字符串直接粘贴导入）
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    return parseJsonTracks(trimmed, '直接粘贴的 JSON 歌单');
  }

  // 2. 在线 JSON 文件 URL 导入（如用户托管在网盘、GitHub Raw、Gitee 或个人服务器的 .json 歌单直链）
  if (/^https?:\/\/[^\s]+\.json(?:\?[^\s]*)?$/i.test(trimmed)) {
    let jsonRes;
    try {
      jsonRes = await httpGet(trimmed, { timeout: 15000 });
    } catch (err) {
      throw new Error(`获取在线 JSON 歌单失败: ${err.message}`);
    }
    if (jsonRes.status !== 200) {
      throw new Error(`获取在线 JSON 失败 (HTTP ${jsonRes.status})`);
    }
    const content = typeof jsonRes.data === 'string' ? jsonRes.data : JSON.stringify(jsonRes.data);
    return parseJsonTracks(content, `在线 JSON (${trimmed})`);
  }

  // 3. 触发系统原生文件选择对话框 (点击「📂 浏览...」按钮或输入 1 / 浏览 / json - 仅桌面端支持)
  if (isFilePickerTrigger(trimmed)) {
    if (!isHostElectron()) {
      throw new Error('移动端不支持系统文件弹窗，请复制并直接粘贴 JSON 歌单文本或歌单分享链接导入');
    }
    const pickedPath = await openNativeJsonFileDialog();
    if (!pickedPath) {
      throw new Error('已取消选择本地 JSON 歌单文件');
    }
    const fileContent = await readLocalFileText(pickedPath);
    return parseJsonTracks(fileContent, `本地文件 (${pickedPath})`);
  }

  // 4. 本地 JSON 文件路径导入 (支持普通路径、带引号路径与 file:/// 协议 - 仅桌面端支持)
  if (isLocalJsonPath(trimmed)) {
    if (!isHostElectron()) {
      throw new Error('移动端无法直接读取设备文件路径，请打开该文件全选复制并直接粘贴 JSON 文本导入');
    }
    const targetPath = resolveLocalPath(trimmed);
    const fileContent = await readLocalFileText(targetPath);
    return parseJsonTracks(fileContent, `本地文件 (${targetPath})`);
  }

  // 5. 在线云端 API 解析模式 (调用 PlaylistOut 生产 API: QQ/网易云/酷狗/汽水)
  const apiUrl = `https://playlistout-api.lengxiqwq.com/api/v1/resolve?q=${encodeURIComponent(
    trimmed
  )}&type=playlist`;

  const creds = getKugouCredentials();
  const requestHeaders = {};
  if (creds && creds.token) {
    requestHeaders['Authorization'] = `Bearer ${creds.token}`;
    requestHeaders['X-Kugou-Token'] = creds.token;
    if (creds.userid) {
      requestHeaders['X-Kugou-Userid'] = creds.userid;
    }
  }

  let res;
  try {
    res = await httpGet(apiUrl, { timeout: 15000, headers: requestHeaders });
  } catch (err) {
    throw new Error(`请求 PlaylistOut API 超时或网络失败: ${err.message}`);
  }

  if (res.status !== 200) {
    const errorMsg =
      (res.data && res.data.error && res.data.error.message) ||
      (typeof res.data === 'string' && res.data ? res.data : `HTTP ${res.status}`);
    throw new Error(`在线解析失败: ${errorMsg}`);
  }

  if (!res.data || !res.data.success) {
    const errorMsg =
      (res.data && res.data.error && res.data.error.message) || '未知解析错误';
    throw new Error(`在线解析失败: ${errorMsg}`);
  }

  const result = (res.data.data && res.data.data.result) || (res.data && res.data.result);
  const rawTracks = result && result.tracks;

  if (!Array.isArray(rawTracks) || rawTracks.length === 0) {
    throw new Error('在线歌单解析结果为空或未找到歌曲');
  }

  // 探测歌单原始平台
  let detectedPlatform =
    res.data.platform ||
    (res.data.data && res.data.data.platform) ||
    (result && result.platform) ||
    'PlaylistOut';
  if (detectedPlatform === 'PlaylistOut') {
    if (/music\.163\.com/i.test(trimmed)) detectedPlatform = 'netease';
    else if (/qq\.com/i.test(trimmed)) detectedPlatform = 'qq';
    else if (/kugou\.com/i.test(trimmed)) detectedPlatform = 'kugou';
    else if (/kuwo\.cn/i.test(trimmed)) detectedPlatform = 'kuwo';
    else if (/qishui|douyin/i.test(trimmed)) detectedPlatform = 'qishui';
    else if (/bilibili\.com/i.test(trimmed)) detectedPlatform = 'bilibili';
    else if (/migu\.cn/i.test(trimmed)) detectedPlatform = 'migu';
  }

  const items = rawTracks
    .map((t, idx) => mapTrackToMusicItem(t, idx + 1, detectedPlatform))
    .filter(Boolean);

  if (items.length === 0) {
    throw new Error('未解析到有效的歌曲数据');
  }

  // 若为酷狗歌单且未配置 Token 或仅解析出前 10 首预览歌曲，明确弹出长效提示指导用户
  const isKugouPreview =
    result &&
    ((result.retrieval && result.retrieval.mode === 'preview') ||
      result.isPartialPreview);
  if (
    detectedPlatform === 'kugou' &&
    (!creds || !creds.token || isKugouPreview)
  ) {
    showPlaybackToast(
      `💡【酷狗限制提示】受官方限制仅解析前 ${items.length} 首。推荐前往官网登录解析导出JSON离线导入。`,
      'warn',
      8000
    );
  }

  return items;
}

// ============================================================================
// 本地同级插件动态桥接器 (Sibling Plugin Delegator)
// 用于兼容用户历史已导入到数据库中、platform 仍为 "PlaylistOut" 的歌单曲目，
// 在播放和加载歌词时直接委派给用户本地安装的 qq / netease / kugou / qishui / migu 插件。
// ============================================================================

let _siblingPluginsLoaded = false;
const _siblingPluginMap = new Map();

async function loadInstalledSiblingPlugins() {
  if (_siblingPluginsLoaded) return _siblingPluginMap;
  _siblingPluginsLoaded = true;

  try {
    const { fs: fsMod, path: pathMod, electron } = await ensureHostModulesAsync();
    if (!fsMod || !pathMod) return _siblingPluginMap;

    const realProc = new Function('return typeof process !== "undefined" ? process : null')();
    let pluginDir = null;
    if (electron && electron.app && typeof electron.app.getPath === 'function') {
      try {
        pluginDir = pathMod.resolve(electron.app.getPath('userData'), './musicfree-plugins');
      } catch (_) {}
    }
    if (!pluginDir && realProc && realProc.env && realProc.env.APPDATA) {
      pluginDir = pathMod.join(realProc.env.APPDATA, 'MusicFree', 'musicfree-plugins');
    }
    if (!pluginDir || !fsMod.existsSync(pluginDir)) return _siblingPluginMap;

    const files = fsMod.readdirSync(pluginDir);
    for (const file of files) {
      if (!file.endsWith('.js')) continue;
      const fullPath = pathMod.join(pluginDir, file);
      try {
        let code = fsMod.readFileSync(fullPath, 'utf-8');
        // 跳过自身插件
        if (
          code.includes("platform: 'PlaylistOut'") ||
          code.includes('platform:"PlaylistOut"') ||
          code.includes('把你的歌单带走')
        ) {
          continue;
        }
        // 自动热修补本地 qq / agg 插件中长青通道 ?ID= 大小写错误（该错误会导致服务端无法识别 ID 而恒定返回周杰伦《晴天》测试曲）
        if (code.includes('qq.php?ID=')) {
          code = code.replace(/qq\.php\?ID=/g, 'qq.php?id=');
          try {
            fsMod.writeFileSync(fullPath, code, 'utf-8');
          } catch (_) {}
        }
        const mod = { exports: {}, loaded: false };
        const procPlat = (realProc && realProc.platform) || 'win32';
        const hostEnv =
          typeof env !== 'undefined'
            ? env
            : {
                getUserVariables: () => ({}),
                os: procPlat,
                appVersion: '0.0.8',
                lang: 'zh-CN',
              };
        const hostProc = {
          platform: procPlat,
          version: '0.0.8',
          env: hostEnv,
        };
        const fn = new Function(
          'require',
          '__musicfree_require',
          'module',
          'exports',
          'console',
          'env',
          'process',
          code
        );
        fn(require, require, mod, mod.exports, console, hostEnv, hostProc);
        const instance = (mod.exports && mod.exports.default) || mod.exports;
        if (instance && typeof instance.platform === 'string' && !isSelfPlatform(instance.platform)) {
          if (!_siblingPluginMap.has(instance.platform)) {
            _siblingPluginMap.set(instance.platform, instance);
          }
        }
      } catch (_) {}
    }
  } catch (_) {}

  return _siblingPluginMap;
}

/**
 * 拦截第三方音源接口默认回退的假《晴天》测试音频 (M500000bYDlc2XxKLs.mp3 / 0039MnYb0qxYhV)
 */
function isFakeQingtianUrl(url, title) {
  if (!url || typeof url !== 'string') return false;
  const cleanTitle = String(title || '').trim();
  if (cleanTitle.includes('晴天')) return false;
  return url.includes('M500000bYDlc2XxKLs') || url.includes('0039MnYb0qxYhV');
}

/**
 * 严格校验并过滤恶意虚假音源直链 (拦截卡密充值、广告反代、诈骗音频劫持及假《晴天》)
 */
function isValidCleanMediaUrl(url, title) {
  if (!url || typeof url !== 'string') return false;
  var u = url.trim().toLowerCase();
  if (!u.startsWith('http://') && !u.startsWith('https://')) return false;
  // 严格拦截卡密广告劫持、恶意反向代理等特征域名与路径 (坚决剔除 c.wwwweb.top 爱坤音源等)
  if (
    u.includes('wwwweb.top') ||
    u.includes('gitcode.com/db/ee') ||
    u.includes('ikun') ||
    u.includes('kami')
  ) {
    return false;
  }
  // 严格拦截酷我防盗链语音播报与错误域名 (杜绝“请前往酷我音乐客户端收听完整版”语音干扰)
  if (
    u.includes('kuwo.cn') ||
    u.includes('antiserver') ||
    u.includes('sycdn')
  ) {
    return false;
  }
  // 严格拦截包含购买/卡密推广特征的虚假音源
  if (u.includes('card') && u.includes('buy')) {
    return false;
  }
  // 拦截非《晴天》却返回测试歌曲音频
  if (isFakeQingtianUrl(url, title)) {
    return false;
  }
  return true;
}

const PLATFORM_DISPLAY_NAMES = {
  qq: 'QQ音乐',
  netease: '网易云音乐',
  kugou: '酷狗音乐',
  qishui: '汽水音乐',
  migu: '咪咕音乐',
  kuwo: '酷我音乐',
  bilibili: 'B站音乐',
};

/**
 * 提取歌曲版本特征标签（用于保证原版绝不匹配到 Live / DJ / 翻唱 / 伴奏 / 改编版）
 */
function extractVersionTags(str) {
  const s = String(str || '').toLowerCase();
  const tags = [];
  const patterns = [
    ['live', /\blive\b|现场/i],
    ['dj', /\bdj\b|慢摇|蹦迪/i],
    ['remix', /\bremix\b|混音/i],
    ['inst', /伴奏|纯音乐|instrumental|卡拉ok|karaoke|消音/i],
    ['cover', /翻唱|\bcover\b/i],
    ['acoustic', /acoustic|不插电|木吉他|钢琴版|吉他版/i],
    ['demo', /\bdemo\b|小样/i],
    ['cantonese', /粤语/i],
    ['mandarin', /国语/i],
    [' mashup', /串烧|medley/i],
    ['ver', /女生版|女声版|男生版|男声版|抒情版|合唱版|独唱版|说唱版|新版|旧版/i],
  ];
  for (const [name, re] of patterns) {
    if (re.test(s)) tags.push(name);
  }
  return tags.sort().join('+');
}

/**
 * 100% 严格原曲原唱校验（核心歌名 + 版本标签 + 歌手精确相等 + 时长吻合）
 * 宁缺毋滥：只要不是 100% 同一首歌、同一个歌手、同一个版本，一律拒绝顶包！
 */
function isCandidateStrictlyMatched(candidate, wantTitle, wantRawArtist, wantDuration = 0) {
  if (!candidate || typeof candidate !== 'object') return false;
  const cTitleRaw = String(candidate.title || '').trim();
  const cAlbumRaw = String(candidate.album || '').trim();
  const wTitleRaw = String(wantTitle || '').trim();
  if (!cTitleRaw || !wTitleRaw) return false;

  // 1. 版本标签必须 100% 一致（原曲无 Live/DJ/伴奏/翻唱/xx版 时，候选曲目或专辑绝不允许带这些标签）
  const wTags = extractVersionTags(wTitleRaw);
  const cTags = extractVersionTags(`${cTitleRaw} ${cAlbumRaw}`);
  if (wTags !== cTags) {
    return false;
  }

  // 2. 歌名归一化后必须 100% 严格相等（剔除宽松的 includes 子串包含，杜绝同名衍生曲混入）
  const norm = (s) =>
    String(s || '')
      .toLowerCase()
      .replace(/[\s\-_~·•,，.。!！?？:：;；'"“”‘’《》〈〉【】\[\]()（）/\\]/g, '');
  const stripBracket = (s) =>
    String(s || '')
      .replace(/[\(（\[【].*?[\)）\]】]/g, '')
      .trim();

  const cNormFull = norm(cTitleRaw);
  const wNormFull = norm(wTitleRaw);
  const cNormBase = norm(stripBracket(cTitleRaw)) || cNormFull;
  const wNormBase = norm(stripBracket(wTitleRaw)) || wNormFull;

  if (!cNormBase || !wNormBase) return false;
  if (cNormFull !== wNormFull && cNormBase !== wNormBase) {
    return false;
  }

  // 3. 歌手必须严格相等（禁止候选歌手为空时放行，禁止模糊子串凑数）
  const wantArtists = String(wantRawArtist || '')
    .split(/[,，、/&｜|]/)
    .map((a) => norm(stripBracket(a)))
    .filter((a) => a && a !== '未知歌手');

  if (wantArtists.length > 0) {
    const candArtists = String(candidate.artist || '')
      .split(/[,，、/&｜|]/)
      .map((a) => norm(stripBracket(a)))
      .filter((a) => a && a !== '未知歌手');
    if (candArtists.length === 0) return false;
    const exactArtistHit = wantArtists.some((wa) => candArtists.some((ca) => ca === wa));
    if (!exactArtistHit) return false;
  }

  // 4. 时长校验（若双方均有有效秒数，偏差超过 12 秒视为不同版本拒绝）
  const dWant = Number(wantDuration) || 0;
  const dCand = Number(candidate.duration) || 0;
  if (dWant > 0 && dCand > 0 && Math.abs(dWant - dCand) > 12) {
    return false;
  }

  return true;
}

/**
 * 相似音源匹配（仅当用户在插件设置中主动选择 fallbackMode = 'similar' 时启用）：
 * 允许翻唱、Live、DJ、伴奏或不同歌手演绎的同歌名曲目作为兜底，但核心歌名必须匹配。
 */
function isCandidateSimilarMatched(candidate, wantTitle) {
  if (!candidate || typeof candidate !== 'object') return false;
  const cTitleRaw = String(candidate.title || '').trim();
  const wTitleRaw = String(wantTitle || '').trim();
  if (!cTitleRaw || !wTitleRaw) return false;

  const norm = (s) =>
    String(s || '')
      .toLowerCase()
      .replace(/[\s\-_~·•,，.。!！?？:：;；'"“”‘’《》〈〉【】\[\]()（）/\\]/g, '');
  const stripBracket = (s) =>
    String(s || '')
      .replace(/[\(（\[【].*?[\)）\]】]/g, '')
      .trim();

  const cNormBase = norm(stripBracket(cTitleRaw)) || norm(cTitleRaw);
  const wNormBase = norm(stripBracket(wTitleRaw)) || norm(wTitleRaw);
  if (!cNormBase || !wNormBase) return false;

  return (
    cNormBase === wNormBase ||
    (wNormBase.length >= 2 && cNormBase.includes(wNormBase)) ||
    (cNormBase.length >= 2 && wNormBase.includes(cNormBase))
  );
}

/**
 * 在 MusicFree 桌面端顶部渲染醒目且不打断听歌的胶囊提示 (Toast)
 * - kind === 'warn': 暖橙警示（暂无原版音源，已自动跳过）
 * - kind === 'info': 翠绿提示（原平台灰歌/无源，已自动匹配同歌手原曲或相似音源）
 */
async function showPlaybackToast(message, kind = 'warn', durationMs = 3600) {
  try {
    const { electron } = await ensureHostModulesAsync();
    const BrowserWindow = electron && electron.BrowserWindow;
    if (!BrowserWindow || typeof BrowserWindow.getAllWindows !== 'function') return;
    const wins = BrowserWindow.getAllWindows();
    const win =
      (typeof BrowserWindow.getFocusedWindow === 'function' &&
        BrowserWindow.getFocusedWindow()) ||
      wins.find((w) => !w.isDestroyed()) ||
      wins[0];
    if (!win || !win.webContents) return;

    const payload = JSON.stringify({ message: String(message || ''), kind, duration: durationMs || 3600 });
    const script = `
      (function(data) {
        try {
          var id = 'playlistout-playback-toast';
          var el = document.getElementById(id);
          if (!el) {
            el = document.createElement('div');
            el.id = id;
            el.style.cssText = 'position:fixed;top:52px;left:50%;transform:translateX(-50%) translateY(-10px);z-index:2147483647;pointer-events:none;padding:10px 20px;border-radius:999px;font-size:13.5px;font-weight:600;letter-spacing:0.3px;color:#fff;background:rgba(20,20,24,0.95);border:1.5px solid rgba(245,158,11,0.65);box-shadow:0 10px 30px rgba(0,0,0,0.55);backdrop-filter:blur(12px);transition:opacity 0.22s ease, transform 0.22s ease;opacity:0;max-width:85vw;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-family:system-ui,-apple-system,sans-serif;';
            document.body.appendChild(el);
          }
          if (data.kind === 'warn') {
            el.style.borderColor = 'rgba(245,158,11,0.75)';
            el.style.color = '#fde68a';
            el.style.background = 'rgba(28,22,16,0.95)';
          } else {
            el.style.borderColor = 'rgba(16,185,129,0.7)';
            el.style.color = '#a7f3d0';
            el.style.background = 'rgba(14,28,24,0.95)';
          }
          el.textContent = data.message;
          requestAnimationFrame(function() {
            el.style.opacity = '1';
            el.style.transform = 'translateX(-50%) translateY(0)';
          });
          if (window.__playlistoutToastTimer) clearTimeout(window.__playlistoutToastTimer);
          window.__playlistoutToastTimer = setTimeout(function() {
            if (el) {
              el.style.opacity = '0';
              el.style.transform = 'translateX(-50%) translateY(-10px)';
            }
          }, 3600);
        } catch (_) {}
      })(${payload});
    `;
    win.webContents.executeJavaScript(script, true).catch(() => {});
  } catch (_) {}
}

// 负缓存：当某首歌已经走完全部插件确认无原版音源后，缓存 6 秒，
// 防止 MusicFree 宿主对同一首歌连续轮询 low/high/super 4 个音质档位造成卡顿
const _noSourceCache = new Map();
const NO_SOURCE_TTL_MS = 6000;

/**
 * QQ 音乐解析通道 (官方直连流媒体 / 次合代开放接口 / 落月免鉴权直链)
 * 全面支持 VIP 曲目 (周杰伦 / 林俊杰 / 陈奕迅等) 免登录完整秒播
 */
async function resolveQqStream(musicItem, q, title, rawArtist, primaryArtist, songDuration) {
  var vq = q === 'high' || q === 'super' ? '8' : '6';

  // 辅助函数：尝试通过 mid 从 s01s 开放接口获取原生全量音频流 (涵盖标准 / 高清 / 无损 FLAC)
  async function fetchStreamFromS01s(targetMid) {
    if (!targetMid || typeof targetMid !== 'string') return null;
    try {
      var s01sRes = await httpGet(
        'https://tang.api.s01s.cn/music_open_api.php?mid=' + encodeURIComponent(targetMid),
        { timeout: 4500 }
      );
      if (s01sRes && s01sRes.data && typeof s01sRes.data === 'object') {
        var d = s01sRes.data;
        var streamUrl = null;
        var actualQ = '128k';
        if (q === 'super') {
          streamUrl = d.song_play_url_sq || d.song_play_url_hq || d.song_play_url_standard || d.song_play_url;
          actualQ = d.song_play_url_sq ? 'flac' : (d.song_play_url_hq ? '320k' : '128k');
        } else if (q === 'high') {
          streamUrl = d.song_play_url_hq || d.song_play_url_standard || d.song_play_url;
          actualQ = d.song_play_url_hq ? '320k' : '128k';
        } else {
          streamUrl = d.song_play_url_standard || d.song_play_url || d.song_play_url_hq;
          actualQ = '128k';
        }
        if (isValidCleanMediaUrl(streamUrl, title)) {
          return {
            url: String(streamUrl),
            quality: actualQ,
          };
        }
      }
    } catch (_) {}
    return null;
  }

  // 辅助函数：从 vkeys 接口获取试听/免费流
  async function fetchStreamFromVkeys(targetMid) {
    if (!targetMid || typeof targetMid !== 'string') return null;
    try {
      var res = await httpGet(
        'https://api.vkeys.cn/music/tencent/song/link?mid=' +
          encodeURIComponent(targetMid) +
          '&quality=' +
          vq,
        { timeout: 4000 }
      );
      if (
        res &&
        res.data &&
        res.data.code === 0 &&
        res.data.data &&
        res.data.data.url &&
        isValidCleanMediaUrl(res.data.data.url, title)
      ) {
        return {
          url: String(res.data.data.url),
          quality: vq === '8' ? '320k' : '128k',
        };
      }
    } catch (_) {}
    return null;
  }

  // 1. 优先使用精确 mid 直接取链 (s01s 高速全量通道优先，vkeys 备用)
  var rawMid =
    (musicItem._src && musicItem._src.qq && musicItem._src.qq.mid) ||
    musicItem.songmid ||
    musicItem.mid ||
    (musicItem.id && String(musicItem.id).replace(/^qq_/i, ''));

  if (rawMid && typeof rawMid === 'string' && rawMid.length > 5 && !/^\d+$/.test(rawMid)) {
    var midStream = await fetchStreamFromS01s(rawMid);
    if (midStream) return midStream;
    var vkeysStream = await fetchStreamFromVkeys(rawMid);
    if (vkeysStream) return vkeysStream;
  }

  // 2. QQ 音乐免鉴权轻量 Smartbox 搜索 (用于其他平台歌曲跨源匹配或缺失 mid 的曲目)
  if (title) {
    var query = primaryArtist ? title + ' ' + primaryArtist : title;
    try {
      var sRes = await httpGet(
        'https://c.y.qq.com/splcloud/fcgi-bin/smartbox_new.fcg?key=' +
          encodeURIComponent(query) +
          '&format=json',
        {
          timeout: 4000,
          headers: { Referer: 'https://y.qq.com' },
        }
      );
      var songList =
        sRes &&
        sRes.data &&
        sRes.data.data &&
        sRes.data.data.song &&
        sRes.data.data.song.itemlist;
      if (Array.isArray(songList) && songList.length > 0) {
        // 第一轮：严格原版匹配
        for (var i = 0; i < songList.length; i++) {
          var s = songList[i];
          if (!s || !s.mid) continue;
          var cand = {
            title: s.name,
            artist: s.singer,
          };
          if (isCandidateStrictlyMatched(cand, title, rawArtist, songDuration)) {
            var sStream = await fetchStreamFromS01s(s.mid);
            if (sStream) return sStream;
            var svStream = await fetchStreamFromVkeys(s.mid);
            if (svStream) return svStream;
          }
        }

        // 第二轮：若用户配置允许相似音源 (fallbackMode === 'similar')
        var fbMode = getUserFallbackMode();
        if (fbMode === 'similar') {
          for (var j = 0; j < songList.length; j++) {
            var simItem = songList[j];
            if (!simItem || !simItem.mid) continue;
            var simCand = {
              title: simItem.name,
              artist: simItem.singer,
            };
            if (isCandidateSimilarMatched(simCand, title)) {
              var simStream = await fetchStreamFromS01s(simItem.mid);
              if (simStream) return simStream;
              var simvStream = await fetchStreamFromVkeys(simItem.mid);
              if (simvStream) return simvStream;
            }
          }
        }
      }
    } catch (_) {}
  }

  return null;
}

/**
 * 网易云音乐解析通道 (Meting 302 直链 / 163 outer 官方直链)
 */
async function resolveNeteaseStream(musicItem, q, title, rawArtist, primaryArtist, songDuration) {
  var rawId =
    (musicItem._src && musicItem._src.netease && musicItem._src.netease.id) ||
    (musicItem.id && String(musicItem.id).replace(/^netease_/i, ''));

  if (rawId && /^\d+$/.test(String(rawId).trim())) {
    var cleanId = String(rawId).trim();
    var metingUrl = 'https://api.injahow.cn/meting/?type=url&id=' + cleanId;
    if (isValidCleanMediaUrl(metingUrl, title)) {
      return { url: metingUrl, quality: '128k' };
    }
  }

  return null;
}

/**
 * 在线多音源智能回退解析 (Mobile 端核心 & Desktop 端独立兜底通道)
 * 严格按照 PC 电脑端音源梯队优先级 (首选/原平台 -> QQ音乐全量秒播 -> 网易云音乐) 进行智能轮询
 * 坚决杜绝任何酷我防盗链语音播报、爱坤音源、卡密广告，毫秒级返回纯净正版音频直链
 */
async function resolveOnlineMediaSource(musicItem, quality) {
  if (!musicItem || typeof musicItem !== 'object') return null;

  var q = quality || 'standard';
  var title = String(musicItem.title || '').trim();
  var rawArtist = String(musicItem.artist || '')
    .replace(/未知歌手/g, '')
    .trim();
  var primaryArtist = rawArtist.split(/[,，、/]/)[0].trim();
  var songDuration = musicItem.duration || 0;

  var originPlat =
    musicItem._originPlatform ||
    (musicItem._src && Object.keys(musicItem._src)[0]) ||
    '';
  if (!originPlat && musicItem.id && String(musicItem.id).startsWith('qq_')) {
    originPlat = 'qq';
  }
  if (!originPlat && musicItem.id && String(musicItem.id).startsWith('netease_')) {
    originPlat = 'netease';
  }
  if (!originPlat) {
    originPlat = resolveMusicPlatformFromTrackFields(musicItem, musicItem);
  }

  var userTarget = getUserTargetPlatform();
  var preferred =
    userTarget && userTarget.toLowerCase() !== 'auto' && !isSelfPlatform(userTarget)
      ? userTarget.toLowerCase()
      : (originPlat && !isSelfPlatform(originPlat) ? originPlat : null);

  // 构建多音源智能回退梯队 (剔除酷我，QQ 全量秒播 -> 网易云)
  var ladder = [];
  if (preferred && preferred !== 'native' && preferred !== 'split' && preferred !== 'kuwo') {
    ladder.push(preferred);
  }
  var standardOrder = ['qq', 'netease'];
  for (var i = 0; i < standardOrder.length; i++) {
    var plat = standardOrder[i];
    if (!ladder.includes(plat)) ladder.push(plat);
  }

  for (var pIdx = 0; pIdx < ladder.length; pIdx++) {
    var currentPlat = ladder[pIdx];
    var res = null;
    try {
      if (currentPlat === 'qq') {
        res = await resolveQqStream(musicItem, q, title, rawArtist, primaryArtist, songDuration);
      } else if (currentPlat === 'netease') {
        res = await resolveNeteaseStream(musicItem, q, title, rawArtist, primaryArtist, songDuration);
      }
    } catch (_) {}

    if (res && res.url && isValidCleanMediaUrl(res.url, title)) {
      return res;
    }
  }

  return null;
}

/**
 * 在线万能歌词解析 (Mobile 端核心 & Desktop 端独立兜底通道)
 */
async function resolveOnlineLyric(musicItem) {
  var emptyLyric = { rawLrc: '' };
  if (!musicItem || typeof musicItem !== 'object') return emptyLyric;

  var inferredPlatform =
    musicItem._originPlatform ||
    (musicItem._src && Object.keys(musicItem._src)[0]) ||
    resolveMusicPlatformFromTrackFields(musicItem, musicItem);

  // 1. QQ 音乐官方免费直连歌词及开放接口歌词
  if (inferredPlatform === 'qq' || (musicItem._src && musicItem._src.qq)) {
    var rawMid =
      (musicItem._src && musicItem._src.qq && musicItem._src.qq.mid) ||
      musicItem.songmid ||
      musicItem.mid ||
      (musicItem.id && String(musicItem.id).replace(/^qq_/i, ''));
    if (rawMid && typeof rawMid === 'string' && rawMid.length > 5) {
      // 1a. s01s 开放接口歌词
      try {
        var s01sLrcRes = await httpGet(
          'https://tang.api.s01s.cn/music_open_api.php?mid=' + encodeURIComponent(rawMid),
          { timeout: 3500 }
        );
        var sLrc =
          s01sLrcRes &&
          s01sLrcRes.data &&
          (s01sLrcRes.data.song_lyric || s01sLrcRes.data.lyric);
        if (typeof sLrc === 'string' && sLrc.trim()) {
          return { rawLrc: sLrc.trim() };
        }
      } catch (_) {}

      // 1b. 官方 QQ 歌词接口
      try {
        var lrcUrl =
          'https://c.y.qq.com/lyric/fcgi-bin/fcg_query_lyric_new.fcg?songmid=' +
          encodeURIComponent(rawMid) +
          '&format=json&nobase64=1';
        var res = await httpGet(lrcUrl, {
          timeout: 4000,
          headers: { Referer: 'https://y.qq.com' },
        });
        if (
          res &&
          res.data &&
          typeof res.data.lyric === 'string' &&
          res.data.lyric.trim()
        ) {
          return { rawLrc: res.data.lyric.trim() };
        }
      } catch (_) {}
    }
  }

  // 2. 网易云音乐官方直连歌词
  if (inferredPlatform === 'netease' || (musicItem._src && musicItem._src.netease)) {
    var rawId =
      (musicItem._src && musicItem._src.netease && musicItem._src.netease.id) ||
      (musicItem.id && String(musicItem.id).replace(/^netease_/i, ''));
    if (rawId && /^\d+$/.test(String(rawId).trim())) {
      var cleanId = String(rawId).trim();
      try {
        var nLrcUrl =
          'https://music.163.com/api/song/lyric?id=' +
          encodeURIComponent(cleanId) +
          '&lv=1&kv=1&tv=-1';
        var nRes = await httpGet(nLrcUrl, { timeout: 4000 });
        if (
          nRes &&
          nRes.data &&
          nRes.data.lrc &&
          typeof nRes.data.lrc.lyric === 'string' &&
          nRes.data.lrc.lyric.trim()
        ) {
          return { rawLrc: nRes.data.lrc.lyric.trim() };
        }
      } catch (_) {}
    }
  }

  return emptyLyric;
}

/**
 * 为历史遗留曲目或无源曲目补齐 _src 并委派给本地已安装的原生插件或在线兜底通道播放
 */
async function getMediaSource(musicItem, quality) {
  var q = quality || 'standard';
  if (!musicItem || typeof musicItem !== 'object' || !musicItem.id) {
    return null;
  }

  var title = String(musicItem.title || '').trim();
  var rawArtist = String(musicItem.artist || '')
    .replace(/未知歌手/g, '')
    .trim();
  var primaryArtist = rawArtist.split(/[,，、/]/)[0].trim();
  var songLabel = primaryArtist ? title + ' - ' + primaryArtist : title || String(musicItem.id);
  var fallbackMode = getUserFallbackMode();

  // 检查 6 秒短期无音源负缓存（避免 MusicFree 同一首歌轮询 4 个音质档位时重复耗时）
  var cacheKey = String(musicItem.id) + '_' + title + '_' + primaryArtist + '_' + fallbackMode;
  var cachedFailAt = _noSourceCache.get(cacheKey);
  if (cachedFailAt && Date.now() - cachedFailAt < NO_SOURCE_TTL_MS) {
    return null;
  }

  // 1. 若宿主为桌面端 Electron 且具备文件系统，优先通过本地同级插件桥接
  if (isHostElectron() || globalThis.__PLAYLISTOUT_ENABLE_SIBLING_BRIDGE__) {
    try {
      var plugins = await loadInstalledSiblingPlugins();
      if (plugins && plugins.size > 0) {
        var inferredPlatform = resolveMusicPlatformFromTrackFields(musicItem, musicItem);
        var userTarget = getUserTargetPlatform();
        var prioritizedPlatform =
          userTarget && userTarget.toLowerCase() !== 'auto' && userTarget.toLowerCase() !== 'native' && !isSelfPlatform(userTarget)
            ? userTarget.toLowerCase()
            : (inferredPlatform && !isSelfPlatform(inferredPlatform) ? inferredPlatform : null);

        // 优先通过精确 ID / 原生字段从首选平台取链
        if (prioritizedPlatform && plugins.has(prioritizedPlatform)) {
          var targetPlugin = plugins.get(prioritizedPlatform);
          if (targetPlugin && typeof targetPlugin.getMediaSource === 'function') {
            try {
              var cloned = Object.assign({}, musicItem, {
                platform: prioritizedPlatform,
                artist: primaryArtist || musicItem.artist,
              });
              attachNativeSourceMetadata(cloned, musicItem, prioritizedPlatform);
              var res = await targetPlugin.getMediaSource(cloned, q);
              if (res && res.url && isValidCleanMediaUrl(res.url, title)) {
                return res;
              }
            } catch (_) {}
          }
        }

        // 跨同级插件严格匹配搜索
        if (title) {
          var keyword = primaryArtist ? title + ' ' + primaryArtist : title;
          var allPlatforms = ['qq', 'netease', 'kugou', 'qishui', 'migu'];
          var fallbackOrder = [];
          if (userTarget && userTarget.toLowerCase() !== 'auto' && !isSelfPlatform(userTarget)) {
            fallbackOrder.push(userTarget.toLowerCase());
          }
          if (inferredPlatform && !isSelfPlatform(inferredPlatform) && !fallbackOrder.includes(inferredPlatform)) {
            fallbackOrder.push(inferredPlatform);
          }
          for (var pIdx = 0; pIdx < allPlatforms.length; pIdx++) {
            var plat = allPlatforms[pIdx];
            if (!fallbackOrder.includes(plat)) fallbackOrder.push(plat);
          }

          var cachedCandidatesByPlat = new Map();
          for (var fIdx = 0; fIdx < fallbackOrder.length; fIdx++) {
            var fPlat = fallbackOrder[fIdx];
            var p = plugins.get(fPlat);
            if (!p || typeof p.search !== 'function' || typeof p.getMediaSource !== 'function') continue;
            try {
              var searchRes = await p.search(keyword, 1, 'music');
              var candidates = searchRes && searchRes.data;
              if (Array.isArray(candidates) && candidates.length > 0) {
                cachedCandidatesByPlat.set(fPlat, candidates);
                var matched = candidates.find(function (c) {
                  return isCandidateStrictlyMatched(c, title, rawArtist, musicItem.duration);
                });
                if (matched) {
                  var media = await p.getMediaSource(matched, q);
                  if (media && media.url && isValidCleanMediaUrl(media.url, title)) {
                    if (fallbackMode !== 'silent_skip') {
                      var platLabel = PLATFORM_DISPLAY_NAMES[fPlat] || fPlat;
                      showPlaybackToast(
                        '🔄 原平台无源，已从「' + platLabel + '」为您匹配同歌手原版《' + title + '》',
                        'info'
                      );
                    }
                    return media;
                  }
                }
              }
            } catch (_) {}
          }

          if (fallbackMode === 'similar') {
            for (var sIdx = 0; sIdx < fallbackOrder.length; sIdx++) {
              var sPlat = fallbackOrder[sIdx];
              var sp = plugins.get(sPlat);
              var sCandidates = cachedCandidatesByPlat.get(sPlat);
              if (!sp || !Array.isArray(sCandidates) || sCandidates.length === 0) continue;
              try {
                var simMatched = sCandidates.find(function (c) {
                  return isCandidateSimilarMatched(c, title);
                });
                if (simMatched) {
                  var simMedia = await sp.getMediaSource(simMatched, q);
                  if (simMedia && simMedia.url && isValidCleanMediaUrl(simMedia.url, title)) {
                    var sPlatLabel = PLATFORM_DISPLAY_NAMES[sPlat] || sPlat;
                    var simArtist = simMatched.artist ? ' - ' + simMatched.artist : '';
                    showPlaybackToast(
                      '💡 暂无原版，已从「' + sPlatLabel + '」播放最相似音源：《' + simMatched.title + simArtist + '》',
                      'info'
                    );
                    return simMedia;
                  }
                }
              } catch (_) {}
            }
          }
        }
      }
    } catch (_) {}
  }

  // 2. 移动端 (Mobile) 及桌面端无同级插件时的在线通用取链解析
  try {
    var onlineMedia = await resolveOnlineMediaSource(musicItem, q);
    if (onlineMedia && onlineMedia.url && isValidCleanMediaUrl(onlineMedia.url, title)) {
      return onlineMedia;
    }
  } catch (_) {}

  // 3. 没有任何匹配音源时，记录负缓存并根据设置弹出明确提示后跳过
  _noSourceCache.set(cacheKey, Date.now());
  if (fallbackMode !== 'silent_skip') {
    showPlaybackToast(
      '⚠️ 暂无《' + songLabel + '》原版音源，已自动跳过（可在插件设置切换为相似音源）',
      'warn'
    );
  }
  return null;
}

/**
 * 获取歌词 (getLyric)
 * 优先桥接本地同级插件歌词，移动端及独立运行时在线解析，且保证绝不返回 null，防止 MusicFree 宿主读取 rawLrc 崩溃。
 */
async function getLyric(musicItem) {
  var emptyLyric = { rawLrc: '' };
  if (!musicItem || typeof musicItem !== 'object' || !musicItem.id) {
    return emptyLyric;
  }

  // 1. 若宿主为桌面端 Electron 且具备文件系统，优先通过本地同级插件桥接
  if (isHostElectron() || globalThis.__PLAYLISTOUT_ENABLE_SIBLING_BRIDGE__) {
    try {
      var plugins = await loadInstalledSiblingPlugins();
      if (plugins && plugins.size > 0) {
        var userTarget = getUserTargetPlatform();
        var inferredPlatform = resolveMusicPlatformFromTrackFields(musicItem, musicItem);
        var candidatePlatforms = [];
        if (userTarget && userTarget.toLowerCase() !== 'auto' && userTarget.toLowerCase() !== 'native' && !isSelfPlatform(userTarget)) {
          candidatePlatforms.push(userTarget.toLowerCase());
        }
        if (inferredPlatform && !isSelfPlatform(inferredPlatform) && !candidatePlatforms.includes(inferredPlatform)) {
          candidatePlatforms.push(inferredPlatform);
        }
        var allPlatforms = ['qq', 'netease', 'kugou', 'migu'];
        for (var i = 0; i < allPlatforms.length; i++) {
          var p = allPlatforms[i];
          if (!candidatePlatforms.includes(p)) candidatePlatforms.push(p);
        }

        for (var j = 0; j < candidatePlatforms.length; j++) {
          var plat = candidatePlatforms[j];
          if (!plugins.has(plat)) continue;
          var targetPlugin = plugins.get(plat);
          if (!targetPlugin || typeof targetPlugin.getLyric !== 'function') continue;
          try {
            var cloned = Object.assign({}, musicItem, { platform: plat });
            attachNativeSourceMetadata(cloned, musicItem, plat);
            var lrc = await targetPlugin.getLyric(cloned);
            if (lrc && typeof lrc.rawLrc === 'string' && lrc.rawLrc.trim()) {
              return lrc;
            }
          } catch (_) {}
        }
      }
    } catch (_) {}
  }

  // 2. 移动端 (Mobile) 及桌面端无同级插件时的在线歌词解析
  try {
    var onlineLrc = await resolveOnlineLyric(musicItem);
    if (onlineLrc && typeof onlineLrc.rawLrc === 'string' && onlineLrc.rawLrc.trim()) {
      return onlineLrc;
    }
  } catch (_) {}

  return emptyLyric;
}

module.exports = {
  platform: PLUGIN_PLATFORM,
  author: 'LengxiQwQ',
  version: '1.3.9',
  appVersion: '>0.1.0-alpha.0',
  srcUrl: 'https://playlistout.lengxiqwq.com/plugins/musicfree/把你的歌单带走-PlaylistOut.js',
  cacheControl: 'no-store',
  description: [
    '## 把你的歌单带走 (PlaylistOut) 官方插件',
    '',
    '支持 QQ音乐、网易云音乐、酷狗音乐、汽水音乐等主流平台歌单在线解析与导入。',
    '',
    '### 🌐 官方网站（点击可直接在浏览器打开）',
    '- [👉 点击一键前往官网 (playlistout.lengxiqwq.com)](https://playlistout.lengxiqwq.com)',
    '',
    '### 💡 酷狗音乐全量导入说明',
    '因酷狗官方限制，未登录仅可解析前 10 首预览歌曲。',
    '1. 前往官网 (playlistout.lengxiqwq.com) 扫码登录酷狗。',
    '2. 复制 Token 与 UserID（或直接复制插件凭据）。',
    '3. 在本插件「插件设置」填入「酷狗Token」与「酷狗UID」，即可直接粘贴歌单链接全量导入！',
  ].join('\n'),
  hints: {
    importMusicSheet: [
      '【支持平台】QQ音乐、网易云音乐、酷狗音乐、汽水音乐',
      '【酷狗限制】酷狗官方限制免登录仅解析前10首',
      '【完整解析】在官网登录复制Token填入插件设置即可全量导入',
      '【官方网站】playlistout.lengxiqwq.com',
    ],
  },
  userVariables: [
    {
      key: 'targetPlatform',
      name: '音源通道',
      hint: 'native(默认) / qq / netease',
    },
    {
      key: 'fallbackMode',
      name: '换源策略',
      hint: 'strict(默认) / similar(翻唱)',
    },
    {
      key: 'kugouToken',
      name: '酷狗Token',
      hint: '官网登录获取(可填token:uid)',
    },
    {
      key: 'kugouUserid',
      name: '酷狗UID',
      hint: '官网登录获取(可选)',
    },
  ],
  supportedSearchType: ['sheet'],
  importMusicSheet,
  getMediaSource,
  getLyric,
  _getKugouCredentials: getKugouCredentials,
  _isOfficialWebsiteTrigger: isOfficialWebsiteTrigger,
  _tryOpenOfficialWebsite: tryOpenOfficialWebsite,
};
