# TDengineGUI
启动指北：
- 克隆项目: git clone https://github.com/skye0207/TDengineGUI.git
- 安装依赖: npm install
- 启动开发版本: npm run start

生成桌面应用: 
npm run make 生成在out文件夹下

目前进度:
- 连接到数据库，添加删除数据库
- 展示超级表和表列表和数据，提供分页功能
- 搜索功能,筛选数据

现有bug:
- [ ] 数据表控件高度需要根据每页条目数量自动调整，现在每页20条时需要上下滚动
- [ ] 点击数据表刷新按钮，需要停留在当前的分页


1.0版本待完成:
- [ ] 实现超级表（表）列表上刷新按钮和检索按钮功能
- [ ] 显示服务器版本号（名称后标签）
- [ ] 控制台运行sql命令并显示结果
- [ ] 增加数据排序（时间正序或倒序）开关选项
- [ ] 删除超级表（表）功能
- [ ] 状态栏显示连接信息（ip,port,用户名）
- [ ] 添加数据库界面添加可选属性字段(keep,update,comp,replica,quorum,blocks)
- [ ] 编译window,linux mac的可执行版本，并release 1.0
- [ ] 完善说明文档


后期版本待完成功能:
- [ ] 创建超级表（表）功能
- [ ] 修改超级表（表）的表结构
- [ ] 子表与独立表的显示风格区分
- [ ] 完成数据库属性页（修改数据库属性、用户管理等）
- [ ] 超级表标签管理，以及子表的标签配置
- [ ] 按照字段类型检索数据(高级检索功能)
- [ ] 选择数值类型字段进行柱状图，折线图等图表的方式显示数据趋势
- [ ] 显示数据统计量（求和，平均，方差等）
- [ ] 批量插入测试数据功能
- [ ] 数据备份与数据导出功能
- [ ] 修改连接配置信息功能
- [ ] 连接配置信息导出导入功能
- [ ] 基础属性配置功能（连接超时时间、默认每页大小等）



项目截图:
![Image text](https://github.com/skye0207/TDengineGUI/blob/main/_img/8.45.08.png)
![Image text](https://github.com/skye0207/TDengineGUI/blob/main/_img/8.45.44.png)
![Image text](https://github.com/skye0207/TDengineGUI/blob/main/_img/8.46.06.png)