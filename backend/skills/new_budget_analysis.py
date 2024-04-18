import pandas as pd

def analyze_budget(input_file, output_file):
    # 读取原始Excel文件的指定列
    df = pd.read_excel(input_file, usecols=[1, 6, 7, 25], names=['name', 'item', 'description', 'amount'])
    df['name'] = df['name'].str.strip()
    df['item'] = df['item'].str.strip()
    df['description'] = df['description'].str.strip()

    # 删除存在空值的行
    df.dropna(subset=['name', 'item', 'amount'], inplace=True)

    # 统计重复项
    duplicates = df[df.duplicated(subset=['item'], keep=False)]

    # 初始化结果列表
    result = []

    # 遍历重复项
    for item in set(duplicates['item']):
        # 获取重复项的行数
        count = len(duplicates[duplicates['item'] == item])

        # 获取重复项的采购品目金额的加总
        total = duplicates[duplicates['item'] == item]['amount'].sum()

        # 获取重复项的采购品目部门用“，”分隔拼接而成的字符串
        departments = ','.join(set(duplicates[duplicates['item'] == item]['name'].unique()))

        # 获取重复项的采购品目名称和规格按格式拼接后用“，”分隔组合而成的字符串
        descriptions = ','.join([f"{b}【{h}】" for b, h in duplicates[duplicates['item'] == item][['name', 'description']].values])

        # 将结果添加到结果列表中
        result.append({
            '政府采购品目名称': item,
            '提及次数': count,
            '加总金额（单位：万元）': total,
            '提及部门': departments,
            '详细描述': descriptions
        })

    # 将结果转换为DataFrame
    result_df = pd.DataFrame(result)

    # 将结果保存为新的Excel文件
    result_df.to_excel(output_file, index=False)
