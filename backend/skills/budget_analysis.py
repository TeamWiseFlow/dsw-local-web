import pandas as pd
import uuid

# 读取excel文件的第一个表单，并提取“科目名称”和“公用经费”两列
def read_excel(file_path):
    try:
        xls = pd.ExcelFile(file_path)
        sheet_names = xls.sheet_names
        data_sheet1 = []
        data_sheet2 = []
        data_sheet3 = []

        involved_unit = None  # 初始化involved_unit
        for sheet_name in sheet_names:
            df = xls.parse(sheet_name, header=None)
            first_row_value = df.iloc[0].str.strip().values
            if '表02' in first_row_value:
                for i in [5, 6, 7]:
                    involved_unit = df.iloc[i, 0]
                    if involved_unit not in ["**", "合计", None]:
                        break

        if involved_unit in ["**", "合计", None]:
            raise ValueError(f"无法获取文件 {file_path} 的涉及单位")

        for sheet_name in sheet_names:
            df = xls.parse(sheet_name, header=None)
            first_row_value = df.iloc[0].str.strip().values
            if '表06' in first_row_value:
                df = df[[df.columns[1], df.columns[-1]]]
                df.columns = ['科目名称', '公用经费']
                df = df.dropna(subset=['科目名称', '公用经费'])
                df = df[df['公用经费'] != 0]
                df['科目名称'] = df['科目名称'].str.strip()
                df['涉及单位'] = involved_unit
                data_sheet1.append(df)
            elif '表10' in first_row_value:
                df = df[[df.columns[1], df.columns[2]]]
                df.columns = ['项目名称', '总计']
                df = df.dropna(subset=['项目名称', '总计'])
                df = df[df['总计'] != 0]
                df['项目名称'] = df['项目名称'].str.strip()
                df['涉及单位'] = involved_unit
                data_sheet2.append(df)
            elif '表12' in first_row_value:
                df = df[[df.columns[1]]]
                df.columns = ['项目名称']
                df = df.dropna(subset=['项目名称'])
                df['项目名称'] = df['项目名称'].str.strip()
                df.drop_duplicates(subset=['项目名称'], keep='first', inplace=True)  # 去除重复项
                df['涉及单位'] = involved_unit
                data_sheet3.append(df)
        return data_sheet1, data_sheet2, data_sheet3

    except Exception as e:
        print(f"读取文件 {file_path} 发生错误: {e}")
        return None, None, None

# 比对数据，计算重复项目的总金额和涉及单位
def compare_data1(data):
    result = {}
    for i, row in data.iterrows():
        subject = row['科目名称']
        amount = row['公用经费']
        if subject not in ['**', '合计', '商品和服务支出','科目名称']:
            if subject in result:
                result[subject]['金额'] += amount
                result[subject]['涉及单位'].add(row['涉及单位'])
            else:
                result[subject] = {'金额': amount, '涉及单位': {row['涉及单位']}}
    return result

def compare_data2(data):
    result = {}
    for i, row in data.iterrows():
        subject = row['项目名称']
        amount = row['总计']
        if subject not in ['**', '合计', '项目名称']:
            if subject in result:
                result[subject]['金额'] += amount
                result[subject]['涉及单位'].add(row['涉及单位'])
            else:
                result[subject] = {'金额': amount, '涉及单位': {row['涉及单位']}}
    return result

def compare_data3(data):
    result = {}
    for i, row in data.iterrows():
        project = row['项目名称']
        if project not in ['**', '项目名称']:
            if project in result:
                result[project]['涉及单位'].add(row['涉及单位'])
            else:
                result[project] = {'涉及单位': {row['涉及单位']}}
    result = {k: v for k, v in result.items() if len(v['涉及单位']) > 1}
    return result

# 将结果保存为新的excel文件
def save_result(result_sheet1, result_sheet2, result_sheet3, output_file):
    with pd.ExcelWriter(output_file) as writer:
        rows = []
        for subject, info in result_sheet1.items():
            if len(info['涉及单位']) > 1:
                rows.append({'科目名称': subject, '汇总金额（单位：万元）': info['金额'], '涉及单位': ', '.join(info['涉及单位'])})
        df1 = pd.DataFrame(rows, columns=['科目名称', '汇总金额（单位：万元）', '涉及单位'])
        df1.to_excel(writer, sheet_name='公用经费', index=False)

        rows = []
        for project, info in result_sheet2.items():
            if len(info['涉及单位']) > 1:
                rows.append({'项目名称': project, '汇总金额（单位：万元）': info['金额'], '涉及单位': ', '.join(info['涉及单位'])})
        df2 = pd.DataFrame(rows, columns=['项目名称', '汇总金额（单位：万元）', '涉及单位'])
        df2.to_excel(writer, sheet_name='项目费用', index=False)

        rows = []
        for project, info in result_sheet3.items():
            rows.append({'项目名称': project, "提及次数": len(info['涉及单位']), '涉及单位': ', '.join(info['涉及单位'])})
        df3 = pd.DataFrame(rows, columns=['项目名称', "提及次数", '涉及单位'])
        df3.to_excel(writer, sheet_name='项目绩效', index=False)
