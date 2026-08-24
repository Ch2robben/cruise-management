/** 价格政策生效区域 mock：境内（身份证前六位）/ 境外（证件属地） */

export type RegionScopeKind = 'domestic' | 'overseas'

export interface PolicyRegionNode {
  code: string
  label: string
  /** 拼音首字母，小写，便于检索，如 cq / hb / yx */
  pinyin: string
  children?: PolicyRegionNode[]
}

/** 境内：省/直辖市 → 市 → 区，code 对应身份证区划前缀 */
export const domesticRegionTree: PolicyRegionNode[] = [
  {
    code: '500000',
    label: '重庆市',
    pinyin: 'cq',
    children: [
      {
        code: '500100',
        label: '重庆市辖区',
        pinyin: 'cqxq',
        children: [
          { code: '500103', label: '渝中区', pinyin: 'yzq' },
          { code: '500108', label: '南岸区', pinyin: 'naq' },
          { code: '500105', label: '江北区', pinyin: 'jbq' },
          { code: '500107', label: '九龙坡区', pinyin: 'jlpq' },
        ],
      },
      {
        code: '500101',
        label: '万州区',
        pinyin: 'wzq',
        children: [
          { code: '500101', label: '万州区', pinyin: 'wzq' },
        ],
      },
      {
        code: '500102',
        label: '涪陵区',
        pinyin: 'flq',
        children: [
          { code: '500102', label: '涪陵区', pinyin: 'flq' },
        ],
      },
      {
        code: '500230',
        label: '丰都县',
        pinyin: 'fdx',
        children: [
          { code: '500230', label: '丰都县', pinyin: 'fdx' },
        ],
      },
      {
        code: '500237',
        label: '巫山县',
        pinyin: 'wsx',
        children: [
          { code: '500237', label: '巫山县', pinyin: 'wsx' },
        ],
      },
    ],
  },
  {
    code: '420000',
    label: '湖北省',
    pinyin: 'hbs',
    children: [
      {
        code: '420500',
        label: '宜昌市',
        pinyin: 'ycs',
        children: [
          { code: '420502', label: '西陵区', pinyin: 'xlq' },
          { code: '420503', label: '伍家岗区', pinyin: 'wjgq' },
          { code: '420506', label: '夷陵区', pinyin: 'ylq' },
        ],
      },
      {
        code: '420100',
        label: '武汉市',
        pinyin: 'whs',
        children: [
          { code: '420102', label: '江岸区', pinyin: 'jaq' },
          { code: '420106', label: '武昌区', pinyin: 'wcq' },
          { code: '420105', label: '汉阳区', pinyin: 'hyq' },
        ],
      },
      {
        code: '421000',
        label: '荆州市',
        pinyin: 'jzs',
        children: [
          { code: '421002', label: '沙市区', pinyin: 'ssq' },
          { code: '421003', label: '荆州区', pinyin: 'jzq' },
        ],
      },
    ],
  },
  {
    code: '510000',
    label: '四川省',
    pinyin: 'scs',
    children: [
      {
        code: '510100',
        label: '成都市',
        pinyin: 'cds',
        children: [
          { code: '510104', label: '锦江区', pinyin: 'jjq' },
          { code: '510107', label: '武侯区', pinyin: 'whq' },
        ],
      },
    ],
  },
  {
    code: '530000',
    label: '云南省',
    pinyin: 'yns',
    children: [
      {
        code: '530100',
        label: '昆明市',
        pinyin: 'kms',
        children: [
          { code: '530102', label: '五华区', pinyin: 'whq' },
          { code: '530103', label: '盘龙区', pinyin: 'plq' },
        ],
      },
    ],
  },
  {
    code: '520000',
    label: '贵州省',
    pinyin: 'gzs',
    children: [
      {
        code: '520100',
        label: '贵阳市',
        pinyin: 'gys',
        children: [
          { code: '520102', label: '南明区', pinyin: 'nmq' },
          { code: '520103', label: '云岩区', pinyin: 'yyq' },
        ],
      },
    ],
  },
  {
    code: '430000',
    label: '湖南省',
    pinyin: 'hns',
    children: [
      {
        code: '430600',
        label: '岳阳市',
        pinyin: 'yys',
        children: [
          { code: '430602', label: '岳阳楼区', pinyin: 'yylq' },
        ],
      },
    ],
  },
]

/** 境外：洲 → 国家/地区（含港澳台） */
export const overseasRegionTree: PolicyRegionNode[] = [
  {
    code: 'AS',
    label: '亚洲',
    pinyin: 'yz',
    children: [
      { code: 'JP', label: '日本', pinyin: 'rb' },
      { code: 'KR', label: '韩国', pinyin: 'hg' },
      { code: 'SG', label: '新加坡', pinyin: 'xjp' },
      { code: 'TH', label: '泰国', pinyin: 'tg' },
      { code: 'MY', label: '马来西亚', pinyin: 'mlxy' },
      { code: 'HK', label: '香港', pinyin: 'xg' },
      { code: 'MO', label: '澳门', pinyin: 'am' },
      { code: 'TW', label: '台湾', pinyin: 'tw' },
    ],
  },
  {
    code: 'EU',
    label: '欧洲',
    pinyin: 'oz',
    children: [
      { code: 'GB', label: '英国', pinyin: 'yg' },
      { code: 'FR', label: '法国', pinyin: 'fg' },
      { code: 'DE', label: '德国', pinyin: 'dg' },
      { code: 'IT', label: '意大利', pinyin: 'ydl' },
      { code: 'RU', label: '俄罗斯', pinyin: 'els' },
    ],
  },
  {
    code: 'AF',
    label: '非洲',
    pinyin: 'fz',
    children: [
      { code: 'ZA', label: '南非', pinyin: 'nf' },
      { code: 'EG', label: '埃及', pinyin: 'aj' },
    ],
  },
  {
    code: 'NA',
    label: '北美洲',
    pinyin: 'bmz',
    children: [
      { code: 'US', label: '美国', pinyin: 'mg' },
      { code: 'CA', label: '加拿大', pinyin: 'jnd' },
    ],
  },
  {
    code: 'SA',
    label: '南美洲',
    pinyin: 'nmz',
    children: [
      { code: 'BR', label: '巴西', pinyin: 'bx' },
      { code: 'AR', label: '阿根廷', pinyin: 'agt' },
    ],
  },
  {
    code: 'OC',
    label: '大洋洲',
    pinyin: 'dyz',
    children: [
      { code: 'AU', label: '澳大利亚', pinyin: 'adly' },
      { code: 'NZ', label: '新西兰', pinyin: 'xxl' },
    ],
  },
]

export interface FlatPolicyRegion {
  code: string
  label: string
  pathLabel: string
  path: string[]
  pinyin: string
  level: number
  scope: RegionScopeKind
}

function flattenTree(
  nodes: PolicyRegionNode[],
  scope: RegionScopeKind,
  parentPath: string[] = [],
  parentPinyin: string[] = [],
  level = 1,
): FlatPolicyRegion[] {
  const rows: FlatPolicyRegion[] = []
  for (const node of nodes) {
    const path = [...parentPath, node.label]
    const pinyinParts = [...parentPinyin, node.pinyin]
    rows.push({
      code: node.code,
      label: node.label,
      pathLabel: path.join(' / '),
      path,
      pinyin: pinyinParts.join(''),
      level,
      scope,
    })
    if (node.children?.length) {
      rows.push(...flattenTree(node.children, scope, path, pinyinParts, level + 1))
    }
  }
  return rows
}

export const flatDomesticRegions = flattenTree(domesticRegionTree, 'domestic')
export const flatOverseasRegions = flattenTree(overseasRegionTree, 'overseas')

export function matchRegionKeyword(region: FlatPolicyRegion, keyword: string) {
  const kw = keyword.trim().toLowerCase()
  if (!kw) return true
  return (
    region.label.toLowerCase().includes(kw)
    || region.pathLabel.toLowerCase().includes(kw)
    || region.code.toLowerCase().includes(kw)
    || region.pinyin.includes(kw)
    || region.pinyin.startsWith(kw)
  )
}
