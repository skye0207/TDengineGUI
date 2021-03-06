# TDengineGUI

> TDengineGUI is a useful and simple desktop manager for [TDengine](https://github.com/taosdata/TDengine), compatible with Linux, windows, mac. It helps developer to observe and manipulate data easier when they use TDengine as their Alot big data platform.

[中文版](https://github.com/skye0207/TDengineGUI/blob/main/README_.md)
## Features
- Link to TDengine, create and drop databases
- show tables and surpertables, select data.
- execute the SQL statements using a simple console.

## Downloads

### Windows：

Download latest [exe](https://github.com/skye0207/TDengineGUI/releases/tag/v1.0.0) package from [release](https://github.com/skye0207/TDengineGUI/releases/tag/v1.0.0)[or [gitee](https://gitee.com/skyebaobao/TDengineGUI/releases/v1.0.0) in China].

### Mac：
Download latest [dmg](https://github.com/skye0207/TDengineGUI/releases/tag/v1.0.0) package from [release](https://github.com/skye0207/TDengineGUI/releases/tag/v1.0.0).

### Linux：
Download latest [AppImage](https://github.com/skye0207/TDengineGUI/releases/tag/v1.0.0) package from [release](https://github.com/skye0207/TDengineGUI/releases/tag/v1.0.0) [or [gitee](https://gitee.com/skyebaobao/TDengineGUI/releases/v1.0.0) in China].


## Dev Build Setup：
```bash
# clone code 
git clone https://github.com/skye0207/TDengineGUI.git

cd TDengineGUI

# install dependencies
npm install

# serve
npm run start
```

## Build Package
```bash
# Packaged application will generate in the dist folder
npm run build 
```

## Welcome to use TDeningeGUI

- TDengineGUI reconds previous connections.

![Image text](https://github.com/skye0207/TDengineGUI/blob/main/_img/1.png)

- You also could add a new server to manage by clicking the "新建连接" button and providing ip,port,username and password(root:taosdata).

![Image text](https://github.com/skye0207/TDengineGUI/blob/main/_img/2.png)

- Drop a database.

![Image text](https://github.com/skye0207/TDengineGUI/blob/main/_img/3.png)

- Create databases. Specific attributes refering [tdengine document](https://www.taosdata.com/cn/documentation/taos-sql#management)

![Image text](https://github.com/skye0207/TDengineGUI/blob/main/_img/5.png)

- Delete a linked server.

![Image text](https://github.com/skye0207/TDengineGUI/blob/main/_img/6.png)

- Select a database and enter main panel. You could click "切换" button to switch database.

![Image text](https://github.com/skye0207/TDengineGUI/blob/main/_img/7.png)

- Click a table to query data.

![Image text](https://github.com/skye0207/TDengineGUI/blob/main/_img/8.png)

![Image text](https://github.com/skye0207/TDengineGUI/blob/main/_img/11.png)

- Query data by filtering the timestamp.

![Image text](https://github.com/skye0207/TDengineGUI/blob/main/_img/9.png)

- Set data filter.

![Image text](https://github.com/skye0207/TDengineGUI/blob/main/_img/10.png)

- A simple console to execute the SQL statements. SQL will execute on the current database by default, so you don't need to add the database name. But you can also operate on the other database by using "databaseName.tableName".

![Image text](https://github.com/skye0207/TDengineGUI/blob/main/_img/12.png)

- Simplely display database properties. More features will be developed in the future.

![Image text](https://github.com/skye0207/TDengineGUI/blob/main/_img/14.png)