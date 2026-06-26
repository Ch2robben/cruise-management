export interface RegionNode {
  label: string
  value: string
  children?: RegionNode[]
}

/** 码头管理用省市区 mock 数据（长江流域常用城市） */
export const regionOptions: RegionNode[] = [
  {
    label: '重庆市',
    value: '重庆',
    children: [
      {
        label: '重庆市',
        value: '重庆',
        children: [
          { label: '渝中区', value: '渝中区' },
          { label: '南岸区', value: '南岸区' },
          { label: '江北区', value: '江北区' },
        ],
      },
      {
        label: '涪陵区',
        value: '涪陵',
        children: [
          { label: '涪陵区', value: '涪陵区' },
          { label: '李渡街道', value: '李渡街道' },
        ],
      },
      {
        label: '丰都县',
        value: '丰都',
        children: [
          { label: '名山街道', value: '名山街道' },
          { label: '三合街道', value: '三合街道' },
        ],
      },
      {
        label: '万州区',
        value: '万州',
        children: [
          { label: '高笋塘街道', value: '高笋塘街道' },
          { label: '太白街道', value: '太白街道' },
        ],
      },
    ],
  },
  {
    label: '湖北省',
    value: '湖北',
    children: [
      {
        label: '宜昌市',
        value: '宜昌',
        children: [
          { label: '伍家岗区', value: '伍家岗区' },
          { label: '西陵区', value: '西陵区' },
          { label: '夷陵区', value: '夷陵区' },
        ],
      },
      {
        label: '武汉市',
        value: '武汉',
        children: [
          { label: '江岸区', value: '江岸区' },
          { label: '武昌区', value: '武昌区' },
          { label: '汉阳区', value: '汉阳区' },
        ],
      },
      {
        label: '荆州市',
        value: '荆州',
        children: [
          { label: '沙市区', value: '沙市区' },
          { label: '荆州区', value: '荆州区' },
        ],
      },
    ],
  },
  {
    label: '湖南省',
    value: '湖南',
    children: [
      {
        label: '岳阳市',
        value: '岳阳',
        children: [
          { label: '岳阳楼区', value: '岳阳楼区' },
          { label: '城陵矶', value: '城陵矶' },
        ],
      },
    ],
  },
  {
    label: '上海市',
    value: '上海',
    children: [
      {
        label: '上海市',
        value: '上海',
        children: [
          { label: '黄浦区', value: '黄浦区' },
          { label: '浦东新区', value: '浦东新区' },
        ],
      },
    ],
  },
  {
    label: '江苏省',
    value: '江苏',
    children: [
      {
        label: '南京市',
        value: '南京',
        children: [
          { label: '鼓楼区', value: '鼓楼区' },
          { label: '玄武区', value: '玄武区' },
        ],
      },
    ],
  },
]

export function findProvinceByCity(city: string): string {
  for (const province of regionOptions) {
    if (province.children?.some((item) => item.value === city)) {
      return province.value
    }
  }
  return ''
}
