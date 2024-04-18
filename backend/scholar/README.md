# Scholar

通过环境变量配置 PROJECT_DIR， 如果环境变量没有 PROJECT_DIR，则会在程序目录上级创建。

PROJECT_DIR/scholar下会存储

1、cache —— 缓存文件夹

2、library —— 所有转化过的txt文档

3、index —— 索引文件（包括 whoosh和faiss）

4、log文件

另外，在初始化的时候指定 initial_file_dir 文件夹，会自动添加这里面的文件（如果与index文件有重复，会跳过）。

如果需要完全重置文档库，需要吧library和index文件夹都删除。

list是根据index轮询的结果，与initial_file_dir和library无关。

## Scholar接口

```python
sr = Scholar()

# 动态调整阈值

# 排序topN
sr.ranker_topn = 3
# 高阈值，提供答案（高于阈值的取top1的answer）
sr.ranker_high_threshold = 0.5
# 低阈值，用于过滤（低于阈值的不要）
sr.ranker_low_threshold = 0.5
# 阈值在中间的，返回topn的topic


# 本地验证
LOG = DEBUG
python
from scholar.scholar import Scholar

sr = Scholar()
inp = "加装电梯代建单位是谁？"
sr.ask(inp)
```

## Scholar 测试

```python
# 可以通过下面接口测试：

sr = Scholar()
question = "xx如何办理"
topic, content, answer, score = sr.eval(question)
```

批量执行下面脚本：

```bash
python main_scholar.py -f /path/to/eval.xlsx -t
```

在此之前需要保证：

- `data/linfen_newfiles` 下面有所有的txt文件，用来建索引。
- 一个测试的 Excel 文件，至少包含一列名为「question」。

## Scholar（V0.0.4）对应的返回逻辑

以ranker model的打分为依据，

  - 如果有高于sr.ranker_high_threshold的项目，直接返回该项目对应的answer，flag=0
  - 如果没有高于sr.ranker_high_threshold的项目，但存在一个高于sr.ranker_low_threshold 的项目，返回该项目对应的的answer，flag=2
  - 如果没有高于sr.ranker_high_threshold的项目，但存在多个高于sr.ranker_low_threshold 的项目：
    - 如果这些项目的主题存在着重复部分，则我们会认为用户更加可能问的就是改主题对应的问题，会回复该主题下最前面的answer，flag=0
    - 如果这些项目的主题都不一样，则会拼接所有contents，供给用户做澄清，flag=0
  - 如果没有高于sr.ranker_low_threshold 的项目，那么会看是否有关键词召回项目，如果有的话，作为兜底，给出对应的的answer，flag=2
  - 如果这也没有的话，则会返回空答案，flag=1

所以就结果而言：

  - flag0 代表midplatform对于给出的内容很"自信"，前端应该原样展示给用户；
  - flag2 则代表midplatform对于给出的内容不那么"自信"，仅供参考，前端可以按自己的策略处理；
  - flag1 因为是空内容，所以前端应该自己配置话术。

~~# Speech

目前使用paddlespeech方案，支持标准女声或男声，如果使用男声需要将paddle speech升级到最新版本

另外，paddle asr 默认最大支持50s长度，

更改：找到pip package里面的这个文件PaddleSpeech/paddlespeech/cli/asr/infer.py

把146行的 self.max_len=50 改成 self.max_len=100 （这个是asr的最大识别长度，如果你的音频长度超过了这个值，就会报错）~~

# 开发环境

- 如果本地没有 GPU，需要安装 requirements_dev.txt 中的 paddlepaddle
- 如需DEBUG，启动main方法时可添加配置项：`LOG=DEBUG python main_scholar.py`，否则不会打印中间结果
- 开发完成请运行测试：`make test`
- 每次启动时索引不会重建（会使用历史记录），如需重建索引，可删除 `index` 和 `library` 文件夹，或执行 `make clean`
- 更新了index所在路径（比如更改了PROJECT_DIR），需要删除 `index` 和 `library` 文件夹，或执行 `make clean`，然后重新运行 `make index`


# 更新日志

- `20230518` v0.0.8
  
  - 适配innovation版本，增加LLM，以及基于LLM的skill和Agent架构

- `20230512` v0.0.7
  
  - 更新shcolar模块、模型微调，提升查询效率，支持个性化查询

- `20230328` v0.0.6

    - 增加对话分类模型及接口。需将模型放在根目录的`models`文件夹下。目录树为：

        ```bash
        models
        ├── senta
        │   ├── best.pdparams
        │   └── export
        │       ├── inference.pdiparams
        │       ├── inference.pdiparams.info
        │       └── inference.pdmodel
        └── text_cls
            └── export
                ├── id2label.json
                ├── model.pdiparams
                ├── model.pdiparams.info
                ├── model.pdmodel
                ├── special_tokens_map.json
                ├── tokenizer_config.json
                └── vocab.txt
        ```

- `20230318` v0.0.5

    - 增加情感分类模型及接口。需将模型放在根目录的`models`文件夹下。目录树为：
    ```bash
    ❯ tree models
    models
    └── senta
        ├── best.pdparams
        └── export
            ├── inference.pdiparams
            ├── inference.pdiparams.info
            └── inference.pdmodel
    ```

- `20230305` v0.0.4
    - scholar 低阈值-高阈值之间返回逻辑优化：多个 topic 时使用澄清机制；单个 topic 时直接返回第一个结果的答案。注意，单个 topic 包含两种情况：多条记录同一个 topic；只有一条记录。
    - scholar 返回逻辑优化：[‌‍⁢‌⁤⁢⁢‍‍⁣﻿⁤﻿⁤﻿⁢⁣⁢⁡⁡⁡‍﻿⁣⁣⁣⁡⁡⁡⁤⁤⁢‬﻿﻿⁡⁤‍⁡⁡‌⁡‌‬需求1_一问多答的前端展示规则 - Feishu Docs](https://yqeupxazxi.feishu.cn/docx/ZZNcdnxxQo5N54xoKfec4tbUn6g)
    - scholar 按 question 建索引
    - 对于 `guide` 类文件（用 `--------` 分割的引导文件），针对每个子片段建索引

- `20230201` v0.0.3
    - scholar 返回逻辑优化：https://yqeupxazxi.feishu.cn/docx/ZZNcdnxxQo5N54xoKfec4tbUn6g
    - scholar text_analyzer 优化：针对 doc 拆分

- `20230103` v0.0.2
  - scholar初始版本
