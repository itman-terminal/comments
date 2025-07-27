# comments
运行于Cloudflare Workers的评论系统，使用KV存储数据，提交评论需要hCaptcha人机验证防止滥用

# 介绍

我在做我的[静态博客](https://itman-terminal.pages.dev/)，想着静态博客，缺个评论区，于是就做了一个；网页部分，我实在不会，于是就用AI做了个前端页面，感觉...还行（？

![主页](home.png)

## 已经实现的功能

现在呢还处于火柴盒阶段，属于基本功能做出来了：

- 站长与访客之间的区分（站长在昵称输入站长的特定昵称后将会显示为站长）
- 使用hCaptcha防止提交API滥用
- 对于还未开放的评论区，禁止评论
- 点赞功能
- 楼中楼关系的显示（下图）
![楼中楼](lzl.png)

## 未来计划（？

下面是一些将来计划的功能（但估计一咕就是很久很久了hh，将来会慢慢还愿的

- 评论使用Markdown回复
- 收到评论使用Telegram, Discord之类的进行推送
- 站长后台管理面板
- 其他，issue区域提出（？

# 部署

## 主代码

转到[Cloudflare Workers](https://dash.cloudflare.com/login?redirect_uri=https%3A%2F%2Fdash.cloudflare.com%2F%3Faccount%3Dworkers)新建项目，选中`Hello World`，命名，例如`comments`，转到编辑代码，将所有代码删除，找到项目最新版本的目录的`workers.js`，粘贴代码。

从网上找一个UUID生成器，生成一个UUID后在开头中寻找`deda5ce1-2e42-4cf9-bbae-0ce7f2cba55e`，替换为生成的随机UUID;

再寻找`b4334301-ec79-4176-a1ba-21b9611a3a4a`再次替换，此步骤可选，其实大概没必要（？

## 绑定存储空间

转到`存储与数据库`-->`KV`，新建一个，随便你命名什么都好，然后转回你的Workers项目，转到绑定标签，点击添加绑定，选中`KV 命名空间`，继续，`变量名称`这块**必须**填入`BLOG_COMMENTS`, `KV 命名空间`选择你刚才新建的存储空间，设置完成。

## 设置hCaptcha

### 申请

不多赘述，自己上网找教程。

### 设置

转到Workers项目的设置 --> `变量与机密`，新建值`HCAPTCHA_SECRET`，填入**账户秘钥**, `HCAPTCHA_SITEKEY`，填入**站点秘钥**，类型为*机密*。


# 使用
## 新建评论区
对下方路径POST：
`xxx.workers.dev/api/new/{ADMIN_UUID}/{article_path}`

这里的`{ADMIN_UUID}`就是注释里面写的站长提交ID。`{article_path}`为开放的评论区，转到`http://xxx.workers.dev/?article={article_path}`即可评论

## 如何作为站长发布评论？

将昵称填入为{ADMIN_UUID}即可
