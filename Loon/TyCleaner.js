/**
 * @title 桃源谷净化脚本 v3.4 (Full Scan + Ad Block)
 * @desc 深度清洗所有子域名的 CPS 推广及跳转链接 + 拦截开屏广告
 */

let body = $response.body;
if (!body) $done({});

let url = $request.url;
console.log(`[TyCleaner] Scanning: ${url}`);

// ── 开屏广告拦截 ──

// 广告配置接口：关闭第三方广告
if (url.includes('/adms/servlet/getThirdAppAdConfig')) {
  try {
    let obj = JSON.parse(body);
    obj.thirdAd = 0;
    obj.startAdCfg = 0;
    obj.startAdSlot = '';
    console.log(`[TyCleaner] Blocked splash ad config`);
    $done({ body: JSON.stringify(obj) });
  } catch (e) {
    $done({ body: body });
  }
  return;
}

// 广告列表接口：清空所有广告源
if (url.includes('/adms/servlet/getAppPalyList')) {
  try {
    let obj = JSON.parse(body);
    obj.sourceList = [];
    console.log(`[TyCleaner] Cleared ad source list`);
    $done({ body: JSON.stringify(obj) });
  } catch (e) {
    $done({ body: body });
  }
  return;
}

// 广告上报接口：丢弃
if (url.includes('/adms/servlet/reportThirdAppAdEventLog')) {
  console.log(`[TyCleaner] Dropped ad event report`);
  $done({});
  return;
}

// ── CPS 推广链接清洗（原有逻辑） ──

try {
    let obj = JSON.parse(body);
    function deepClean(data) {
        if (!data) return data;
        if (typeof data === 'object') {
            for (let key in data) {
                let val = data[key];
                if (typeof val === 'string' && (val.startsWith('{') || val.startsWith('['))) {
                    try {
                        let nested = JSON.parse(val);
                        nested = deepClean(nested);
                        data[key] = JSON.stringify(nested);
                        continue;
                    } catch (e) {}
                } else {
                    data[key] = deepClean(val);
                }
            }
            return data;
        }
        if (typeof data === 'string') {
            let lower = data.toLowerCase();
            if (lower.includes("alipay") || lower.includes("weixin")) {
                if (lower.includes("://") || lower.includes("http") || lower.includes(".com") || lower.includes(".cn")) {
                    return "";
                }
            }
        }
        return data;
    }
    obj = deepClean(obj);
    body = JSON.stringify(obj);
} catch (e) {
    console.log(`[TyCleaner] JSON Parse Error: ${e.message}`);
}

$done({ body: body });
