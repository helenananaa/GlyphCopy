(() => {
  const MESSAGE_SCAN = "GLYPHCOPY_SCAN";
  const MESSAGE_GET_LAST_SCAN = "GLYPHCOPY_GET_LAST_SCAN";
  const MESSAGE_RECOGNIZE = "GLYPHCOPY_RECOGNIZE";
  const MESSAGE_APPLY = "GLYPHCOPY_APPLY";
  const MESSAGE_RESTORE = "GLYPHCOPY_RESTORE";
  const PAGE_SCAN_REQUEST = "GLYPHCOPY_PAGE_SCAN_REQUEST";
  const PAGE_SCAN_RESULT = "GLYPHCOPY_PAGE_SCAN_RESULT";
  const PAGE_RECOGNIZE_REQUEST = "GLYPHCOPY_PAGE_RECOGNIZE_REQUEST";
  const PAGE_RECOGNIZE_RESULT = "GLYPHCOPY_PAGE_RECOGNIZE_RESULT";
  const PAGE_APPLY_REQUEST = "GLYPHCOPY_PAGE_APPLY_REQUEST";
  const PAGE_APPLY_RESULT = "GLYPHCOPY_PAGE_APPLY_RESULT";
  const PAGE_RESTORE_REQUEST = "GLYPHCOPY_PAGE_RESTORE_REQUEST";
  const PAGE_RESTORE_RESULT = "GLYPHCOPY_PAGE_RESTORE_RESULT";
  const CACHE_PREFIX = "glyphcopy:mapping:";
  const MAX_COMPUTED_STYLE_ELEMENTS = 5000;
  const MAX_SAMPLES = 8;
  const MAX_CHARS = 120;
  const MAX_RECOGNITION_CANDIDATES = 900;
  const RECOGNITION_GRID_SIZE = 28;
  const replacementOriginals = new WeakMap();
  const replacementObservers = [];
  let replacementObserverTimer = null;
  let replacementEnabled = false;

  const DOMAIN_RECOGNITION_CANDIDATES =
    "数字系统采用可以将减法运算转化为加法原码反码补码真值逻辑电路门与或非异或同或输入输出编码译码器信号二进制十进制八进制十六进制位权权值基数进位借位小数整数无符号有符号机器数表示范围溢出校验奇偶校验格雷码BCD码ASCII码触发器状态方程次态现态初态波形图所示端时钟脉冲上升沿下降沿边沿电平同步异步置位复位清零保持翻转计数器寄存器移位全加器半加器比较器选择器多路选择器数据选择器函数表达式卡诺图化简最小项最大项约束项无关项组合逻辑时序逻辑";

  const RECOGNITION_CANDIDATES =
    "的一是在不了有和人这中大为上个国我以要他时来用们生到作地于出就分对成会可主发年动同工也能下过子说产种面而方后多定行学法所民得经十三之进着等部度家电力里如水化高自二理起小物现实加量都两体制机当使点从业本去把性好应开它合还因由其些然前外天政四日那社义事平形相全表间样与关各重新线内数正心反你明看原又么利比或但质气第向道命此变条只没结解问意建月公无系军很情者最立代想已通并提直题党程展五果料象员革位入常文总次品式活设及管特件长求老头基资边流路级少图山统接知较将组见计别她手角期根论运农指几九区强放决西被干做必战先回则任取据处队南给色光门即保治北造百规热领七海口东导器压志世金增争济阶油思术极交受联认六共权收证改清己美再采转更单风切打白教速花带安场身车例真务具万每目至达走积示议声报斗完类八离华名确才科张信马节话米整空元况今集温传土许步群广石记需段研界拉林律叫且究观越织装影算低持音众书布复容儿须际商非验连断深难近矿千周委素技备半办青省列习响约支般史感劳便团往酸历市克何除消构府称太准精值号率族维划选标写存候毛亲快效斯院查江型眼王按格养易置派层片始却专状育厂京识适属圆包火住调满县局照参红细引听该铁价严首底液官德随病苏失尔死讲配女黄推显谈罪神艺呢席含企望密批营项防举球英氧势告李台落木帮轮破亚师围注远字材排供河态封另施减树溶怎止案言士均武固叶鱼波视仅费紧爱左章早朝害续轻服试食充兵源判护司足某练差致板田降黑犯负击范继兴似余坚曲输修故城夫够送笔船占右财吃富春职觉汉画功巴跟虽杂飞检吸助升阳互初创抗考投坏策古径换未跑留钢曾端责站简述钱副尽帝射草冲承独令限阿宣环双请超微让控州良轴找否纪益依优顶础载倒房突坐粉敌略客袁冷胜绝析块剂测丝协诉念陈仍罗盐友洋错苦夜刑移频逐靠混母短皮终聚汽村云哪既距卫停烈央察烧迅境若印洲刻括激孔搞甚室待核校散侵吧甲游久菜味旧模湖货损预阻毫普稳乙妈植息扩银语挥酒守拿序纸医缺雨吗针刘啊急唱误训愿审附获茶鲜粮斤孩脱硫肥善龙演父渐血欢械掌歌沙刚攻谓盾讨晚粒乱燃矛乎杀药宁鲁贵钟煤读班伯香介迫句丰培握兰担弦蛋沉假穿执答乐谁顺烟缩征脸喜松脚困异免背星福买染井概慢怕磁倍祖皇促静补评翻肉践尼衣宽扬棉希伤操垂秋宜氢套督振架亮末宪庆编牛触映雷销诗座居抓裂胞呼娘景威绿晶厚盟衡鸡孙延危胶屋乡临陆顾掉呀灯岁措束耐剧玉赵跳哥季课凯胡额款绍卷齐伟蒸殖永宗苗川炉岩弱零杨奏沿露杆探滑镇饭浓航怀赶库夺伊灵税途灭赛归召鼓播盘裁险康唯录菌纯借糖盖横符私努堂域枪润幅哈竟熟虫泽脑壤碳欧遍侧寨敢彻虑斜薄庭纳弹饲伸折麦湿暗荷瓦塞床筑恶户访塔奇透梁刀旋迹卡氯遇份毒泥退洗摆灰彩卖耗夏择忙铜献硬予繁圈雪函亦抽篇阵阴丁尺追堆雄迎泛爸楼避谋吨野猪旗累偏典馆索秦脂潮爷豆忽托惊塑遗愈朱替纤粗倾尚痛楚谢奋购磨君池旁碎骨监捕弟暴割贯殊释词亡壁顿宝午尘闻揭炮残冬桥妇警综招吴付浮遭徐您摇谷赞箱隔订男吹园纷唐败宋玻巨耕坦荣闭湾键凡驻锅救恩剥凝碱齿截炼麻纺禁废盛版缓净睛昌婚涉筒嘴插岸朗庄街藏姑贸腐奴啦惯乘伙恢匀纱扎辩耳彪臣亿璃抵脉秀萨俄网舞店喷纵寸汗挂洪贺闪柬爆烯津稻墙软勇像滚厘蒙芳肯坡柱荡腿仪旅尾轧冰贡登黎削钻勒逃障氨郭峰币港伏轨亩毕擦莫刺浪秘援株健售股岛甘泡睡童铸汤阀休汇舍牧绕炸哲磷绩朋淡尖启陷柴呈徒颜泪稍忘泵蓝拖洞授镜辛壮锋贫虚弯摩泰幼廷尊窗纲弄隶疑氏宫姐震瑞怪尤琴循描膜违夹腰缘珠穷森枝竹沟催绳忆邦剩幸浆栏拥牙贮礼滤钠纹罢拍咱喊袖埃勤罚焦潜伍墨欲缝姓刊饱仿奖铝鬼丽跨默挖链扫喝袋炭污幕诸弧励梅奶洁灾舟鉴苯讼抱毁懂寒智埔寄届跃渡挑丹艰贝碰拔爹戴码梦芽熔赤渔哭敬颗奔铅仲虎稀妹乏珍申桌遵允隆螺仓魏锐晓氮兼隐碍赫拨忠肃缸牵抢博巧壳兄杜讯诚碧祥柯页巡矩悲灌龄伦票寻桂铺圣恐恰郑趣抬荒腾贴柔滴猛阔辆妻填撤储签闹扰紫砂递戏吊陶伐喂疗瓶婆抚臂摸忍虾蜡邻胸巩挤偶弃槽劲乳邓吉仁烂砖租乌舰伴瓜浅丙暂燥橡柳迷暖牌秧胆详簧踏瓷谱呆宾糊洛辉愤竞隙怒粘乃绪肩籍敏涂熙皆侦悬掘享纠醒狂锁淀恨牲霸爬赏逆玩陵祝秒浙貌役彼悉鸭趋凤晨畜辈秩卵署梯炎滩棋驱筛峡冒啥寿译浸泉帽迟硅疆贷漏稿冠嫩胁芯牢叛蚀奥鸣岭羊凭串塘绘酵融盆锡庙筹冻辅摄袭筋拒僚旱钾鸟漆沈眉疏添棒穗硝韩逼扭侨凉挺碗栽炒杯患馏劝豪辽勃鸿旦吏拜狗埋辊掩饮搬骂辞勾扣估蒋绒雾丈朵姆拟宇辑陕雕偿蓄崇剪倡厅咬驶薯刷斥番赋奉佛浇漫曼扇钙桃扶仔返俗亏腔鞋棱覆框悄叔撞骗勘旺沸孤吐孟渠屈疾妙惜仰狠胀谐抛霉桑岗嘛衰盗渗脏赖涌甜曹阅肌哩厉烃纬毅昨伪症煮叹钉搭茎笼酷偷弓锥恒杰坑鼻翼纶叙狱逮罐络棚抑膨蔬寺骤穆冶枯册尸凸绅坯牺焰轰欣晋瘦御锭锦丧旬锻垄搜扑邀亭酯迈舒脆酶闲忧酚顽羽涨卸仗陪辟惩杭姚肚捉飘漂昆欺吾郎烘汁呵饰萧雅邮迁燕撒姻赴宴烦债帐斑铃旨醇董饼雏姿拌傅腹妥揉贤拆歪葡胺丢浩徽昂垫挡览贪慰缴汪慌冯诺姜谊凶劣诬耀昏躺盈骑乔溪丛卢抹闷咨刮驾缆悟摘铒掷颇幻柄惠惨佳仇腊窝涤剑瞧堡泼葱罩霍捞胎苍滨俩捅湘砍霞邵萄疯淮遂熊粪烤宿档戈驳嫂裕徙箭捐肠撑晒辨殿莲摊搅酱屏疫哀蔡堵沫皱畅叠阁莱敲辖钩痕坝巷饿祸丘玄溜曰逻彭尝卿妨艇吞韦怨矮歇";

  let lastScan = null;

  function stripQuotes(value) {
    return String(value || "").trim().replace(/^['"]|['"]$/g, "");
  }

  function normalizeFamily(value) {
    const firstFamily = String(value || "").split(",")[0];
    return stripQuotes(firstFamily);
  }

  function parseDeclarations(block) {
    const declarations = {};
    const parts = [];
    let current = "";
    let quote = null;
    let parenDepth = 0;

    for (const char of block || "") {
      if (quote) {
        current += char;
        if (char === quote) {
          quote = null;
        }
        continue;
      }

      if (char === "'" || char === '"') {
        quote = char;
        current += char;
        continue;
      }

      if (char === "(") {
        parenDepth += 1;
        current += char;
        continue;
      }

      if (char === ")") {
        parenDepth = Math.max(0, parenDepth - 1);
        current += char;
        continue;
      }

      if (char === ";" && parenDepth === 0) {
        if (current.trim()) {
          parts.push(current);
        }
        current = "";
        continue;
      }

      current += char;
    }

    if (current.trim()) {
      parts.push(current);
    }

    for (const part of parts) {
      const colonIndex = part.indexOf(":");
      if (colonIndex <= 0) {
        continue;
      }

      const key = part.slice(0, colonIndex).trim().toLowerCase();
      const value = part.slice(colonIndex + 1).trim();
      declarations[key] = value;
    }

    return declarations;
  }

  function extractUrls(src) {
    const urls = [];
    const urlPattern = /url\(\s*(['"]?)(.*?)\1\s*\)/g;
    let match;

    while ((match = urlPattern.exec(src || "")) !== null) {
      urls.push(match[2]);
    }

    return urls;
  }

  function parseFontFaces(cssText, sourceLabel, documentInfo) {
    const fontFaces = [];
    const fontFacePattern = /@font-face\s*\{([\s\S]*?)\}/gi;
    let match;

    while ((match = fontFacePattern.exec(cssText || "")) !== null) {
      const declarations = parseDeclarations(match[1]);
      const family = normalizeFamily(declarations["font-family"]);
      const urls = extractUrls(declarations.src);

      if (!family || urls.length === 0) {
        continue;
      }

      for (const url of urls) {
        fontFaces.push({
          family,
          src: url,
          cssSource: sourceLabel,
          documentPath: documentInfo.path,
          documentUrl: documentInfo.url,
          documentTitle: documentInfo.title,
          isDataUri: /^data:/i.test(url),
          isCxSecret: /cxsecret/i.test(family),
        });
      }
    }

    return fontFaces;
  }

  function discoverInlineFontFaces(documentInfo) {
    const doc = documentInfo.document;
    const faces = [];

    for (const style of doc.querySelectorAll("style")) {
      const label = style.id ? `style#${style.id}` : "inline style";
      faces.push(...parseFontFaces(style.textContent || "", label, documentInfo));
    }

    for (const sheet of Array.from(doc.styleSheets)) {
      let rules;

      try {
        rules = sheet.cssRules;
      } catch (_error) {
        continue;
      }

      if (!rules) {
        continue;
      }

      for (const rule of Array.from(rules)) {
        if (rule.type === CSSRule.FONT_FACE_RULE) {
          faces.push(...parseFontFaces(rule.cssText, sheet.href || "stylesheet", documentInfo));
        }
      }
    }

    const deduped = [];
    const seen = new Set();
    for (const face of faces) {
      const key = `${face.documentPath}\n${face.family}\n${face.src}`;
      if (!seen.has(key)) {
        seen.add(key);
        deduped.push(face);
      }
    }

    return deduped;
  }

  function dataUriToBytes(dataUri) {
    const commaIndex = dataUri.indexOf(",");
    if (commaIndex < 0) {
      throw new Error("Invalid data URI");
    }

    const meta = dataUri.slice(0, commaIndex);
    const data = dataUri.slice(commaIndex + 1);

    if (/;base64/i.test(meta)) {
      const binary = atob(data);
      const bytes = new Uint8Array(binary.length);
      for (let index = 0; index < binary.length; index += 1) {
        bytes[index] = binary.charCodeAt(index);
      }
      return bytes;
    }

    return new TextEncoder().encode(decodeURIComponent(data));
  }

  async function sha256Hex(bytes) {
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(digest))
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
  }

  function textNodeAllowed(node) {
    const parent = node.parentElement;
    if (!parent) {
      return false;
    }

    const blocked = parent.closest("script,style,noscript,input,textarea,select,option");
    return !blocked && Boolean(node.nodeValue && node.nodeValue.trim());
  }

  function collectTextNodes(root, doc) {
    const nodes = [];
    const nodeFilter = doc.defaultView.NodeFilter;
    const walker = doc.createTreeWalker(root, nodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        return textNodeAllowed(node) ? nodeFilter.FILTER_ACCEPT : nodeFilter.FILTER_REJECT;
      },
    });

    let node;
    while ((node = walker.nextNode()) !== null) {
      nodes.push(node);
    }

    return nodes;
  }

  function familyAppearsInComputedStyle(element, family) {
    const computedFamily = element.ownerDocument.defaultView.getComputedStyle(element).fontFamily || "";
    return computedFamily
      .split(",")
      .map((item) => stripQuotes(item).toLowerCase())
      .includes(family.toLowerCase());
  }

  function collectCandidateRoots(doc, family) {
    const roots = new Set();

    if (family) {
      for (const element of doc.querySelectorAll("*")) {
        if (element.classList && element.classList.contains(family)) {
          roots.add(element);
        }
      }
    }

    const elements = Array.from(doc.body ? doc.body.querySelectorAll("*") : []);
    for (const element of elements.slice(0, MAX_COMPUTED_STYLE_ELEMENTS)) {
      if (familyAppearsInComputedStyle(element, family)) {
        roots.add(element);
      }
    }

    return Array.from(roots);
  }

  function readUInt16(bytes, offset) {
    return (bytes[offset] << 8) | bytes[offset + 1];
  }

  function readInt16(bytes, offset) {
    const value = readUInt16(bytes, offset);
    return value & 0x8000 ? value - 0x10000 : value;
  }

  function readUInt32(bytes, offset) {
    return (
      ((bytes[offset] << 24) >>> 0) +
      (bytes[offset + 1] << 16) +
      (bytes[offset + 2] << 8) +
      bytes[offset + 3]
    );
  }

  function findSfntTable(bytes, tag) {
    if (bytes.byteLength < 12) {
      return null;
    }

    const tableCount = readUInt16(bytes, 4);
    for (let index = 0; index < tableCount; index += 1) {
      const offset = 12 + index * 16;
      const tableTag = String.fromCharCode(bytes[offset], bytes[offset + 1], bytes[offset + 2], bytes[offset + 3]);

      if (tableTag === tag) {
        return {
          offset: readUInt32(bytes, offset + 8),
          length: readUInt32(bytes, offset + 12),
        };
      }
    }

    return null;
  }

  function parseCmapFormat4(bytes, offset) {
    const codePoints = new Set();
    const length = readUInt16(bytes, offset + 2);
    const segCount = readUInt16(bytes, offset + 6) / 2;
    const endCountOffset = offset + 14;
    const startCountOffset = endCountOffset + segCount * 2 + 2;
    const idDeltaOffset = startCountOffset + segCount * 2;
    const idRangeOffsetOffset = idDeltaOffset + segCount * 2;

    for (let segment = 0; segment < segCount; segment += 1) {
      const end = readUInt16(bytes, endCountOffset + segment * 2);
      const start = readUInt16(bytes, startCountOffset + segment * 2);
      const delta = readInt16(bytes, idDeltaOffset + segment * 2);
      const rangeOffsetAddress = idRangeOffsetOffset + segment * 2;
      const rangeOffset = readUInt16(bytes, rangeOffsetAddress);

      if (start === 0xffff && end === 0xffff) {
        continue;
      }

      for (let codePoint = start; codePoint <= end; codePoint += 1) {
        let glyphIndex;

        if (rangeOffset === 0) {
          glyphIndex = (codePoint + delta) & 0xffff;
        } else {
          const glyphAddress = rangeOffsetAddress + rangeOffset + (codePoint - start) * 2;
          if (glyphAddress < offset || glyphAddress + 1 >= offset + length) {
            continue;
          }

          const glyphId = readUInt16(bytes, glyphAddress);
          glyphIndex = glyphId === 0 ? 0 : (glyphId + delta) & 0xffff;
        }

        if (glyphIndex !== 0) {
          codePoints.add(codePoint);
        }
      }
    }

    return codePoints;
  }

  function parseCmapFormat12(bytes, offset) {
    const codePoints = new Set();
    const groupCount = readUInt32(bytes, offset + 12);

    for (let index = 0; index < groupCount; index += 1) {
      const groupOffset = offset + 16 + index * 12;
      const start = readUInt32(bytes, groupOffset);
      const end = readUInt32(bytes, groupOffset + 4);

      for (let codePoint = start; codePoint <= end; codePoint += 1) {
        codePoints.add(codePoint);
      }
    }

    return codePoints;
  }

  function parseCmapCodePoints(bytes) {
    const cmap = findSfntTable(bytes, "cmap");
    if (!cmap) {
      return [];
    }

    const records = [];
    const recordCount = readUInt16(bytes, cmap.offset + 2);
    for (let index = 0; index < recordCount; index += 1) {
      const recordOffset = cmap.offset + 4 + index * 8;
      records.push({
        platformId: readUInt16(bytes, recordOffset),
        encodingId: readUInt16(bytes, recordOffset + 2),
        offset: cmap.offset + readUInt32(bytes, recordOffset + 4),
      });
    }

    const preferredRecords = records
      .map((record) => ({
        ...record,
        format: readUInt16(bytes, record.offset),
      }))
      .sort((left, right) => {
        const score = (record) => {
          if (record.format === 12) return 0;
          if (record.format === 4 && record.platformId === 3 && record.encodingId === 1) return 1;
          if (record.format === 4) return 2;
          return 3;
        };
        return score(left) - score(right);
      });

    for (const record of preferredRecords) {
      if (record.format === 12) {
        return Array.from(parseCmapFormat12(bytes, record.offset)).sort((left, right) => left - right);
      }

      if (record.format === 4) {
        return Array.from(parseCmapFormat4(bytes, record.offset)).sort((left, right) => left - right);
      }
    }

    return [];
  }

  function isInterestingCharacter(char, fontCodePoints) {
    if (!char || /\s/.test(char)) {
      return false;
    }

    const codePoint = char.codePointAt(0);
    if (fontCodePoints && fontCodePoints.size > 0) {
      return fontCodePoints.has(codePoint);
    }

    return (
      codePoint >= 0x80 &&
      ((codePoint >= 0x3400 && codePoint <= 0x9fff) ||
        (codePoint >= 0xe000 && codePoint <= 0xf8ff) ||
        (codePoint >= 0xf900 && codePoint <= 0xfaff) ||
        (codePoint >= 0xff00 && codePoint <= 0xffef))
    );
  }

  function summarizeTextForFamily(documentInfo, family, fontCodePoints) {
    const roots = collectCandidateRoots(documentInfo.document, family);
    const textNodeSet = new Set();
    const samples = [];
    const charCounts = new Map();
    let totalCharacters = 0;

    for (const root of roots) {
      for (const textNode of collectTextNodes(root, documentInfo.document)) {
        if (textNodeSet.has(textNode)) {
          continue;
        }

        textNodeSet.add(textNode);
        const text = textNode.nodeValue || "";
        totalCharacters += Array.from(text).length;

        const cleanText = text.replace(/\s+/g, " ").trim();
        if (cleanText && samples.length < MAX_SAMPLES) {
          samples.push(cleanText);
        }

        for (const char of text) {
          if (!isInterestingCharacter(char, fontCodePoints)) {
            continue;
          }

          charCounts.set(char, (charCounts.get(char) || 0) + 1);
        }
      }
    }

    const suspiciousChars = Array.from(charCounts.entries())
      .map(([char, count]) => ({
        char,
        codePoint: `U+${char.codePointAt(0).toString(16).toUpperCase().padStart(4, "0")}`,
        count,
      }))
      .sort((left, right) => right.count - left.count || left.codePoint.localeCompare(right.codePoint))
      .slice(0, MAX_CHARS);

    return {
      rootCount: roots.length,
      textNodeCount: textNodeSet.size,
      totalCharacters,
      suspiciousChars,
      samples,
    };
  }

  function collectCandidateCharacters(documents, excludedCodePoints) {
    const candidates = new Set();

    function addCandidate(char) {
      const codePoint = char.codePointAt(0);
      if (codePoint >= 0x4e00 && codePoint <= 0x9fff && !excludedCodePoints.has(codePoint)) {
        candidates.add(char);
      }
    }

    for (const char of DOMAIN_RECOGNITION_CANDIDATES) {
      addCandidate(char);
    }

    for (const documentInfo of documents) {
      const text = documentInfo.document.body ? documentInfo.document.body.innerText || "" : "";
      for (const char of text) {
        addCandidate(char);
      }
    }

    for (const char of RECOGNITION_CANDIDATES) {
      addCandidate(char);
    }

    return Array.from(candidates).slice(0, MAX_RECOGNITION_CANDIDATES);
  }

  function renderGlyphMask(doc, char, fontFamily, isObfuscatedFont) {
    const canvas = doc.createElement("canvas");
    const size = 128;
    canvas.width = size;
    canvas.height = size;

    const context = canvas.getContext("2d", { willReadFrequently: true });
    context.clearRect(0, 0, size, size);
    context.fillStyle = "#000000";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.font = isObfuscatedFont
      ? `96px "${fontFamily}"`
      : '96px "Noto Sans SC", "Microsoft YaHei", SimSun, sans-serif';
    context.fillText(char, size / 2, size / 2 + 8);

    const image = context.getImageData(0, 0, size, size);
    const data = image.data;
    let minX = size;
    let minY = size;
    let maxX = -1;
    let maxY = -1;

    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) {
        const alpha = data[(y * size + x) * 4 + 3];
        if (alpha > 24) {
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);
        }
      }
    }

    if (maxX < minX || maxY < minY) {
      return null;
    }

    const width = maxX - minX + 1;
    const height = maxY - minY + 1;
    const grid = RECOGNITION_GRID_SIZE;
    const mask = new Float32Array(grid * grid);
    const hProjection = new Float32Array(grid);
    const vProjection = new Float32Array(grid);
    let ink = 0;

    for (let gy = 0; gy < grid; gy += 1) {
      for (let gx = 0; gx < grid; gx += 1) {
        const sampleX = Math.min(size - 1, Math.max(0, Math.round(minX + ((gx + 0.5) / grid) * width)));
        const sampleY = Math.min(size - 1, Math.max(0, Math.round(minY + ((gy + 0.5) / grid) * height)));
        const alpha = data[(sampleY * size + sampleX) * 4 + 3] / 255;
        const value = alpha > 0.18 ? alpha : 0;
        const index = gy * grid + gx;
        mask[index] = value;
        hProjection[gy] += value;
        vProjection[gx] += value;
        ink += value;
      }
    }

    return {
      mask,
      hProjection,
      vProjection,
      aspect: width / Math.max(1, height),
      ink,
    };
  }

  function compareGlyphMasks(left, right) {
    if (!left || !right || left.ink === 0 || right.ink === 0) {
      return 0;
    }

    let pixelDiff = 0;
    let union = 0;
    for (let index = 0; index < left.mask.length; index += 1) {
      const a = left.mask[index];
      const b = right.mask[index];
      pixelDiff += Math.abs(a - b);
      union += Math.max(a, b);
    }

    let projectionDiff = 0;
    let projectionUnion = 0;
    for (let index = 0; index < RECOGNITION_GRID_SIZE; index += 1) {
      projectionDiff += Math.abs(left.hProjection[index] - right.hProjection[index]);
      projectionDiff += Math.abs(left.vProjection[index] - right.vProjection[index]);
      projectionUnion += Math.max(left.hProjection[index], right.hProjection[index]);
      projectionUnion += Math.max(left.vProjection[index], right.vProjection[index]);
    }

    const pixelScore = 1 - pixelDiff / Math.max(1, union);
    const projectionScore = 1 - projectionDiff / Math.max(1, projectionUnion);
    const aspectScore = Math.max(0, 1 - Math.abs(left.aspect - right.aspect) / 1.5);
    const inkScore = Math.max(0, 1 - Math.abs(left.ink - right.ink) / Math.max(left.ink, right.ink));

    return pixelScore * 0.58 + projectionScore * 0.25 + aspectScore * 0.1 + inkScore * 0.07;
  }

  async function recognizeFont(scanResult, fontScan) {
    const documents = collectAccessibleDocuments(window);
    const documentInfo = documents.find((item) => item.path === fontScan.documentPath);
    if (!documentInfo) {
      throw new Error(`Cannot find document ${fontScan.documentPath}`);
    }

    if (documentInfo.document.fonts && documentInfo.document.fonts.ready) {
      await documentInfo.document.fonts.ready;
    }

    const codePoints = (fontScan.fontCodePoints || []).map((value) => Number.parseInt(value.slice(2), 16));
    const codePointSet = new Set(codePoints);
    const candidateChars = collectCandidateCharacters(documents, codePointSet);
    const candidateMasks = [];

    for (const char of candidateChars) {
      const mask = renderGlyphMask(documentInfo.document, char, fontScan.family, false);
      if (mask) {
        candidateMasks.push({ char, mask });
      }
    }

    const entries = [];
    const mapping = {};
    const confidence = {};

    for (const codePoint of codePoints) {
      const sourceChar = String.fromCodePoint(codePoint);
      const sourceMask = renderGlyphMask(documentInfo.document, sourceChar, fontScan.family, true);
      const ranked = candidateMasks
        .map((candidate) => ({
          char: candidate.char,
          score: compareGlyphMasks(sourceMask, candidate.mask),
        }))
        .sort((left, right) => right.score - left.score)
        .slice(0, 5);

      const best = ranked[0] || { char: "", score: 0 };
      mapping[sourceChar] = best.char;
      confidence[sourceChar] = Number(best.score.toFixed(4));
      entries.push({
        source: sourceChar,
        codePoint: `U+${codePoint.toString(16).toUpperCase().padStart(4, "0")}`,
        target: best.char,
        confidence: confidence[sourceChar],
        candidates: ranked.map((item) => ({
          char: item.char,
          score: Number(item.score.toFixed(4)),
        })),
      });
    }

    const recognition = {
      fontHash: fontScan.fontHash,
      family: fontScan.family,
      domain: location.hostname,
      source: "auto-canvas-match",
      candidateCount: candidateMasks.length,
      mapping,
      confidence,
      entries,
      updatedAt: Date.now(),
      scanUrl: scanResult.url,
      documentUrl: fontScan.documentUrl,
    };

    if (fontScan.cacheKey) {
      await storageSet(fontScan.cacheKey, recognition);
    }

    return recognition;
  }

  async function storageGet(key) {
    return new Promise((resolve) => {
      chrome.storage.local.get(key, (result) => resolve(result[key]));
    });
  }

  async function storageSet(key, value) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [key]: value }, resolve);
    });
  }

  function collectAccessibleDocuments(rootWindow = window) {
    const documents = [];

    function visit(currentWindow, path) {
      let doc;
      try {
        doc = currentWindow.document;
      } catch (_error) {
        return;
      }

      documents.push({
        window: currentWindow,
        document: doc,
        path,
        url: currentWindow.location.href,
        title: doc.title,
      });

      for (let index = 0; index < currentWindow.frames.length; index += 1) {
        visit(currentWindow.frames[index], `${path}.${index}`);
      }
    }

    visit(rootWindow, "top");
    return documents;
  }

  async function scan() {
    const documents = collectAccessibleDocuments(window);
    const faces = documents.flatMap((documentInfo) => discoverInlineFontFaces(documentInfo));
    const candidates = faces.filter((face) => face.isCxSecret || face.isDataUri);
    const fonts = [];

    for (const face of candidates) {
      let byteLength = null;
      let fontHash = null;
      let fontCodePoints = [];
      let error = null;

      if (face.isDataUri) {
        try {
          const bytes = dataUriToBytes(face.src);
          byteLength = bytes.byteLength;
          fontHash = await sha256Hex(bytes);
          fontCodePoints = parseCmapCodePoints(bytes);
        } catch (scanError) {
          error = scanError instanceof Error ? scanError.message : String(scanError);
        }
      }

      const cacheKey = fontHash ? `${CACHE_PREFIX}${fontHash}` : null;
      const cachedMapping = cacheKey ? await storageGet(cacheKey) : null;

      fonts.push({
        family: face.family,
        cssSource: face.cssSource,
        documentPath: face.documentPath,
        documentUrl: face.documentUrl,
        documentTitle: face.documentTitle,
        sourceType: face.isDataUri ? "data-uri" : "url",
        sourcePreview: face.isDataUri ? face.src.slice(0, 64) + "..." : face.src,
        byteLength,
        fontHash,
        fontCodePoints: fontCodePoints.map((codePoint) => `U+${codePoint.toString(16).toUpperCase().padStart(4, "0")}`),
        cacheKey,
        cacheHit: Boolean(cachedMapping),
        error,
        text: summarizeTextForFamily(
          documents.find((documentInfo) => documentInfo.path === face.documentPath),
          face.family,
          new Set(fontCodePoints),
        ),
      });
    }

    lastScan = {
      scannedAt: new Date().toISOString(),
      url: location.href,
      title: document.title,
      documentCount: documents.length,
      fontFaceCount: faces.length,
      candidateCount: candidates.length,
      fonts,
    };

    return lastScan;
  }

  async function recognize() {
    const scanResult = await scan();
    const results = [];

    for (const fontScan of scanResult.fonts) {
      if (!fontScan.fontHash || !fontScan.fontCodePoints || fontScan.fontCodePoints.length === 0) {
        continue;
      }

      try {
        results.push(await recognizeFont(scanResult, fontScan));
      } catch (error) {
        results.push({
          fontHash: fontScan.fontHash,
          family: fontScan.family,
          error: error instanceof Error ? error.message : String(error),
          updatedAt: Date.now(),
        });
      }
    }

    return {
      scannedAt: scanResult.scannedAt,
      url: scanResult.url,
      title: scanResult.title,
      fontCount: scanResult.fonts.length,
      results,
      scan: scanResult,
    };
  }

  function decodeWithMapping(text, mapping) {
    let changed = false;
    let decoded = "";

    for (const char of text) {
      if (Object.prototype.hasOwnProperty.call(mapping, char)) {
        decoded += mapping[char];
        changed = true;
      } else {
        decoded += char;
      }
    }

    return changed ? decoded : text;
  }

  function applyMappingToFont(documentInfo, fontScan, mapping) {
    const codePoints = (fontScan.fontCodePoints || []).map((value) => Number.parseInt(value.slice(2), 16));
    const roots = collectCandidateRoots(documentInfo.document, fontScan.family);
    const textNodeSet = new Set();
    let rootCount = roots.length;
    let textNodeCount = 0;
    let changedNodeCount = 0;
    let changedCharacterCount = 0;

    for (const root of roots) {
      for (const textNode of collectTextNodes(root, documentInfo.document)) {
        if (textNodeSet.has(textNode)) {
          continue;
        }

        textNodeSet.add(textNode);
        textNodeCount += 1;
        const before = textNode.nodeValue || "";
        const after = decodeWithMapping(before, mapping);

        if (before !== after) {
          if (!replacementOriginals.has(textNode)) {
            replacementOriginals.set(textNode, before);
          }
          changedNodeCount += 1;
          changedCharacterCount += Array.from(before).filter((char) => mapping[char]).length;
          textNode.nodeValue = after;
        }
      }
    }

    return {
      family: fontScan.family,
      fontHash: fontScan.fontHash,
      documentPath: documentInfo.path,
      documentUrl: documentInfo.url,
      codePointCount: codePoints.length,
      rootCount,
      textNodeCount,
      changedNodeCount,
      changedCharacterCount,
    };
  }

  async function ensureRecognitionForFont(scanResult, fontScan) {
    if (fontScan.cacheKey) {
      const cached = await storageGet(fontScan.cacheKey);
      if (cached && cached.mapping) {
        return cached;
      }
    }

    return recognizeFont(scanResult, fontScan);
  }

  function installReplacementObservers() {
    if (replacementObservers.length > 0) {
      return;
    }

    const documents = collectAccessibleDocuments(window);
    for (const documentInfo of documents) {
      if (!documentInfo.document.body) {
        continue;
      }

      const Observer = documentInfo.window.MutationObserver;
      const observer = new Observer(() => {
        if (!replacementEnabled) {
          return;
        }

        clearTimeout(replacementObserverTimer);
        replacementObserverTimer = setTimeout(() => {
          applyMappings({ recognizeIfMissing: false, fromObserver: true }).catch(() => {});
        }, 300);
      });

      observer.observe(documentInfo.document.body, {
        childList: true,
        characterData: true,
        subtree: true,
      });
      replacementObservers.push(observer);
    }
  }

  async function applyMappings(options = {}) {
    const scanResult = await scan();
    const documents = collectAccessibleDocuments(window);
    const results = [];
    const recognitions = [];

    for (const fontScan of scanResult.fonts) {
      if (!fontScan.fontHash || !fontScan.fontCodePoints || fontScan.fontCodePoints.length === 0) {
        continue;
      }

      let recognition = fontScan.cacheKey ? await storageGet(fontScan.cacheKey) : null;
      if ((!recognition || !recognition.mapping) && options.recognizeIfMissing !== false) {
        recognition = await ensureRecognitionForFont(scanResult, fontScan);
        recognitions.push(recognition);
      }

      if (!recognition || !recognition.mapping) {
        results.push({
          family: fontScan.family,
          fontHash: fontScan.fontHash,
          skipped: true,
          reason: "missing mapping cache",
        });
        continue;
      }

      const documentInfo = documents.find((item) => item.path === fontScan.documentPath);
      if (!documentInfo) {
        results.push({
          family: fontScan.family,
          fontHash: fontScan.fontHash,
          skipped: true,
          reason: `missing document ${fontScan.documentPath}`,
        });
        continue;
      }

      results.push(applyMappingToFont(documentInfo, fontScan, recognition.mapping));
    }

    replacementEnabled = true;
    installReplacementObservers();

    return {
      appliedAt: new Date().toISOString(),
      fromObserver: Boolean(options.fromObserver),
      url: location.href,
      title: document.title,
      results,
      recognitions,
      scan: scanResult,
    };
  }

  function restoreOriginalsInDocument(documentInfo) {
    let restoredNodeCount = 0;

    for (const textNode of collectTextNodes(documentInfo.document.body || documentInfo.document, documentInfo.document)) {
      if (!replacementOriginals.has(textNode)) {
        continue;
      }

      textNode.nodeValue = replacementOriginals.get(textNode);
      restoredNodeCount += 1;
    }

    return {
      documentPath: documentInfo.path,
      documentUrl: documentInfo.url,
      restoredNodeCount,
    };
  }

  async function restoreMappings() {
    replacementEnabled = false;
    for (const observer of replacementObservers.splice(0)) {
      observer.disconnect();
    }

    const documents = collectAccessibleDocuments(window);
    const results = documents.map(restoreOriginalsInDocument).filter((result) => result.restoredNodeCount > 0);

    return {
      restoredAt: new Date().toISOString(),
      url: location.href,
      title: document.title,
      restoredNodeCount: results.reduce((sum, result) => sum + result.restoredNodeCount, 0),
      results,
    };
  }

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (!message || ![MESSAGE_SCAN, MESSAGE_GET_LAST_SCAN, MESSAGE_RECOGNIZE, MESSAGE_APPLY, MESSAGE_RESTORE].includes(message.type)) {
      return false;
    }

    if (message.type === MESSAGE_GET_LAST_SCAN && lastScan) {
      sendResponse({ ok: true, scan: lastScan });
      return false;
    }

    let task;
    if (message.type === MESSAGE_RECOGNIZE) {
      task = recognize();
    } else if (message.type === MESSAGE_APPLY) {
      task = applyMappings({ recognizeIfMissing: true });
    } else if (message.type === MESSAGE_RESTORE) {
      task = restoreMappings();
    } else {
      task = scan();
    }

    task
      .then((result) =>
        sendResponse(
          message.type === MESSAGE_RECOGNIZE
            ? { ok: true, recognition: result }
            : message.type === MESSAGE_APPLY
              ? { ok: true, applied: result }
              : message.type === MESSAGE_RESTORE
                ? { ok: true, restored: result }
                : { ok: true, scan: result },
        ),
      )
      .catch((error) => sendResponse({ ok: false, error: error instanceof Error ? error.message : String(error) }));

    return true;
  });

  window.addEventListener(PAGE_SCAN_REQUEST, (event) => {
    const requestId = event.detail && event.detail.requestId;

    scan()
      .then((scanResult) => {
        window.dispatchEvent(
          new CustomEvent(PAGE_SCAN_RESULT, {
            detail: {
              ok: true,
              requestId,
              scan: scanResult,
            },
          }),
        );
      })
      .catch((error) => {
        window.dispatchEvent(
          new CustomEvent(PAGE_SCAN_RESULT, {
            detail: {
              ok: false,
              requestId,
              error: error instanceof Error ? error.message : String(error),
            },
          }),
        );
      });
  });

  window.addEventListener(PAGE_RECOGNIZE_REQUEST, (event) => {
    const requestId = event.detail && event.detail.requestId;

    recognize()
      .then((recognitionResult) => {
        window.dispatchEvent(
          new CustomEvent(PAGE_RECOGNIZE_RESULT, {
            detail: {
              ok: true,
              requestId,
              recognition: recognitionResult,
            },
          }),
        );
      })
      .catch((error) => {
        window.dispatchEvent(
          new CustomEvent(PAGE_RECOGNIZE_RESULT, {
            detail: {
              ok: false,
              requestId,
              error: error instanceof Error ? error.message : String(error),
            },
          }),
        );
      });
  });

  window.addEventListener(PAGE_APPLY_REQUEST, (event) => {
    const requestId = event.detail && event.detail.requestId;

    applyMappings({ recognizeIfMissing: true })
      .then((appliedResult) => {
        window.dispatchEvent(
          new CustomEvent(PAGE_APPLY_RESULT, {
            detail: {
              ok: true,
              requestId,
              applied: appliedResult,
            },
          }),
        );
      })
      .catch((error) => {
        window.dispatchEvent(
          new CustomEvent(PAGE_APPLY_RESULT, {
            detail: {
              ok: false,
              requestId,
              error: error instanceof Error ? error.message : String(error),
            },
          }),
        );
      });
  });

  window.addEventListener(PAGE_RESTORE_REQUEST, (event) => {
    const requestId = event.detail && event.detail.requestId;

    restoreMappings()
      .then((restoredResult) => {
        window.dispatchEvent(
          new CustomEvent(PAGE_RESTORE_RESULT, {
            detail: {
              ok: true,
              requestId,
              restored: restoredResult,
            },
          }),
        );
      })
      .catch((error) => {
        window.dispatchEvent(
          new CustomEvent(PAGE_RESTORE_RESULT, {
            detail: {
              ok: false,
              requestId,
              error: error instanceof Error ? error.message : String(error),
            },
          }),
        );
      });
  });
})();
