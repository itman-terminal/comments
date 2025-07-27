// 定义 KV 命名空间绑定
const BLOG_COMMENTS = "BLOG_COMMENTS";

// 站长标识（前端提交时的特殊标识）
const ADMIN_SUBMIT_UUID = "deda5ce1-2e42-4cf9-bbae-0ce7f2cba55e";

// 站长真实标识（用于存储和验证）
const ADMIN_UUID = "b4334301-ec79-4176-a1ba-21b9611a3a4a";

// 加载动画 SVG
const LOADING_SVG = `
<svg width="80" height="80" viewBox="0 0 38 38" xmlns="http://www.w3.org/2000/svg">
  <style>
    @keyframes rotate {
      100% {
        transform: rotate(360deg);
      }
    }
    .track {
      stroke: #eee;
      fill: none;
    }
    .spin {
      stroke: #3f51b5;
      stroke-linecap: round;
      fill: none;
      animation: rotate 0.475s linear infinite;
      transform-origin: 50% 50%;
    }
  </style>
  <circle class="track" cx="19" cy="19" r="15" stroke-width="1"/>
  <circle class="spin" cx="19" cy="19" r="15" 
          stroke-width="3"
          stroke-dasharray="25 500"
          stroke-dashoffset="0.2"/>
</svg>
`;

// HTML 模板
const HTML_TEMPLATE = (content, hcaptchaSiteKey) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>博客评论系统</title>
    <style>
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        }
        body {
            background-color: #2d2d2d;
            color: #e0e0e0;
            line-height: 1.6;
            padding: 10px;
            max-width: 100%;
            overflow-x: hidden;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
        }
        .comment-form {
            background: #3a3a3a;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        }
        .form-group {
            margin-bottom: 15px;
        }
        label {
            display: block;
            margin-bottom: 5px;
            font-weight: bold;
        }
        input, textarea {
            width: 100%;
            padding: 10px;
            border: 1px solid #555;
            border-radius: 4px;
            background: #444;
            color: #e0e0e0;
            font-size: 16px;
        }
        textarea {
            min-height: 100px;
            resize: vertical;
        }
        button {
            background: #4a6fa5;
            color: white;
            border: none;
            padding: 10px 15px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 16px;
            transition: background 0.3s;
        }
        button:hover {
            background: #3a5a8f;
        }
        button:disabled {
            background: #555;
            cursor: not-allowed;
        }
        .comments-list {
            margin-top: 20px;
        }
        .comment {
            background: #3a3a3a;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 15px;
            position: relative;
        }
        .comment-header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            font-size: 14px;
        }
        .comment-author {
            font-weight: bold;
        }
        .admin-badge {
            background: #4a6fa5;
            color: white;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 12px;
            margin-left: 8px;
        }
        .comment-date {
            color: #aaa;
        }
        .comment-content {
            margin-bottom: 10px;
        }
        .comment-actions {
            display: flex;
            align-items: center;
            font-size: 14px;
        }
        .like-btn {
            background: none;
            border: none;
            color: #aaa;
            cursor: pointer;
            padding: 0;
            margin-right: 15px;
            display: flex;
            align-items: center;
        }
        .like-btn:hover {
            color: #e0e0e0;
        }
        .like-count {
            margin-left: 5px;
        }
        .reply-btn {
            background: none;
            border: none;
            color: #aaa;
            cursor: pointer;
            padding: 0;
        }
        .reply-btn:hover {
            color: #e0e0e0;
        }
        .replies {
            margin-left: 20px;
            margin-top: 15px;
            border-left: 2px solid #4a6fa5;
            padding-left: 15px;
        }
        .loading {
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
        }
        .loading svg {
            width: 50px;
            height: 50px;
        }
        .hcaptcha-container {
            margin: 15px 0;
            min-height: 78px;
            display: flex;
            justify-content: center;
            align-items: center;
        }
        .error {
            color: #ff6b6b;
            margin: 10px 0;
        }
        .success {
            color: #6bff6b;
            margin: 10px 0;
        }
        .author-website {
            color: #aaa;
            font-size: 14px;
            margin-top: 5px;
        }
        .author-website a {
            color: #7ab1ff;
            text-decoration: none;
        }
        .author-website a:hover {
            text-decoration: underline;
        }
        .hidden {
            display: none;
        }
        .no-comments {
            text-align: center;
            padding: 20px;
            color: #aaa;
        }
        @media (max-width: 600px) {
            .replies {
                margin-left: 10px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        ${content}
    </div>
    <script src="https://js.hcaptcha.com/1/api.js?onload=hcaptchaOnLoad&render=explicit" async defer></script>
    <script>
        // 全局变量
        let currentArticle = '';
        let replyingTo = null;
        let hcaptchaWidgetId = null;
        
        // 初始化
        document.addEventListener('DOMContentLoaded', () => {
            // 获取当前文章URL
            const queryParams = new URLSearchParams(window.location.search);
            currentArticle = queryParams.get('article') || '';
            
            if (!currentArticle) {
                showError('comments-container', '缺少文章参数');
                document.getElementById('comment-form').style.display = 'none';
                return;
            }
            
            // 加载评论
            loadComments();
            
            // 表单提交事件
            const commentForm = document.getElementById('comment-form');
            if (commentForm) {
                commentForm.addEventListener('submit', handleCommentSubmit);
            }
            
            // 重置hCaptcha
            const resetCaptchaBtn = document.getElementById('reset-captcha');
            if (resetCaptchaBtn) {
                resetCaptchaBtn.addEventListener('click', resetCaptcha);
            }
        });
        
        // hCaptcha 加载回调
        window.hcaptchaOnLoad = function() {
            const hcaptchaContainer = document.getElementById('hcaptcha-widget');
            if (hcaptchaContainer) {
                hcaptchaContainer.innerHTML = '';
                hcaptchaWidgetId = hcaptcha.render('hcaptcha-widget', {
                    sitekey: '${hcaptchaSiteKey}',
                    theme: 'dark'
                });
                document.getElementById('hcaptcha-loading').classList.add('hidden');
            }
        };
        
        // 加载评论
        async function loadComments() {
            showLoading('comments-container');
            
            try {
                const response = await fetch('/api/list?article=' + encodeURIComponent(currentArticle));
                
                if (response.status === 404) {
                    showNoComments('comments-container', '本文暂无评论区，请站长先创建评论区');
                    document.getElementById('comment-form').style.display = 'none';
                    return;
                }
                
                const data = await response.json();
                
                if (response.ok) {
                    renderComments(data.comments);
                } else {
                    showError('comments-container', data.error || '加载评论失败');
                }
            } catch (error) {
                showError('comments-container', '网络错误: ' + error.message);
            }
        }
        
        // 渲染评论
        function renderComments(comments) {
            const container = document.getElementById('comments-container');
            if (!container) return;
            
            if (!comments || comments.length === 0) {
                showNoComments(container, '暂无评论，快来抢沙发吧~');
                return;
            }
            
            // 构建评论树
            const commentMap = {};
            const rootComments = [];
            
            comments.forEach(comment => {
                commentMap[comment.id] = {...comment, replies: []};
            });
            
            comments.forEach(comment => {
                if (comment.parentId) {
                    if (commentMap[comment.parentId]) {
                        commentMap[comment.parentId].replies.push(commentMap[comment.id]);
                    }
                } else {
                    rootComments.push(commentMap[comment.id]);
                }
            });
            
            // 渲染评论树
            container.innerHTML = rootComments.map(comment => renderComment(comment)).join('');
            
            // 添加点赞事件
            document.querySelectorAll('.like-btn').forEach(btn => {
                btn.addEventListener('click', function(e) {
                    handleLike(e).catch(error => {
                        console.error('点赞错误:', error);
                    });
                });
            });
            
            // 添加回复事件
            document.querySelectorAll('.reply-btn').forEach(btn => {
                btn.addEventListener('click', handleReply);
            });
        }
        
        // 渲染单个评论
        function renderComment(comment, depth = 0) {
            const isAdmin = comment.isAdmin;
            const date = new Date(comment.timestamp).toLocaleString();
            const authorDisplay = isAdmin ? '站长' : escapeHtml(comment.author);
            
            return \`
                <div class="comment" data-id="\${comment.id}">
                    <div class="comment-header">
                        <div class="comment-author">
                            \${authorDisplay}
                            \${isAdmin ? '<span class="admin-badge">站长</span>' : ''}
                        </div>
                        <div class="comment-date">\${date}</div>
                    </div>
                    \${comment.website ? \`
                        <div class="author-website">
                            <a href="\${escapeUrl(comment.website)}" target="_blank" rel="noopener noreferrer">
                                \${escapeHtml(comment.website)}
                            </a>
                        </div>
                    \` : ''}
                    <div class="comment-content">\${escapeHtml(comment.content)}</div>
                    <div class="comment-actions">
                        <button class="like-btn" data-id="\${comment.id}">
                            👍 <span class="like-count">\${comment.likes || 0}</span>
                        </button>
                        <button class="reply-btn" data-id="\${comment.id}">
                            回复
                        </button>
                    </div>
                    \${comment.replies && comment.replies.length > 0 ? \`
                        <div class="replies">
                            \${comment.replies.map(reply => renderComment(reply, depth + 1)).join('')}
                        </div>
                    \` : ''}
                </div>
            \`;
        }
        
        // 处理评论提交
        async function handleCommentSubmit(e) {
            e.preventDefault();
            
            const form = e.target;
            const content = form.content.value.trim();
            let author = form.author.value.trim();
            const website = form.website.value.trim();
            const hcaptchaResponse = hcaptcha.getResponse(hcaptchaWidgetId);
            
            // 验证输入
            if (!content) {
                showError('form-messages', '请输入评论内容');
                return;
            }
            
            if (content.length > 250) {
                showError('form-messages', '评论内容不能超过250字');
                return;
            }
            
            if (!author) {
                showError('form-messages', '请输入昵称');
                return;
            }
            
            if (!hcaptchaResponse) {
                showError('form-messages', '请完成人机验证');
                return;
            }
            
            // 禁用提交按钮
            const submitBtn = form.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            
            // 显示加载中
            showLoading('form-messages');
            
            try {
                const response = await fetch('/api/submit', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        article: currentArticle,
                        content,
                        author,
                        website,
                        hcaptchaResponse,
                        parentId: replyingTo
                    }),
                });
                
                if (response.status === 404) {
                    showError('form-messages', '本文评论区不存在，请站长先创建评论区');
                    return;
                }
                
                const data = await response.json();
                
                if (response.ok) {
                    // 清空表单
                    form.reset();
                    // 重置hCaptcha
                    resetCaptcha();
                    // 显示成功消息
                    showSuccess('form-messages', '评论提交成功！');
                    // 重新加载评论
                    setTimeout(loadComments, 500);
                    // 重置回复状态
                    replyingTo = null;
                } else {
                    showError('form-messages', data.error || '提交评论失败');
                }
            } catch (error) {
                showError('form-messages', '网络错误: ' + error.message);
            } finally {
                submitBtn.disabled = false;
            }
        }
        
        // 处理点赞
        async function handleLike(e) {
            const commentId = e.currentTarget.getAttribute('data-id');
            const likeBtn = e.currentTarget;
            
            // 禁用按钮防止重复点击
            likeBtn.disabled = true;
            
            try {
                const response = await fetch('/api/agree', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        commentId
                    }),
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    // 更新点赞数
                    const likeCountEl = likeBtn.querySelector('.like-count');
                    if (likeCountEl) {
                        likeCountEl.textContent = data.newCount;
                    }
                } else {
                    console.error('点赞失败:', data.error);
                }
            } catch (error) {
                console.error('点赞错误:', error);
            } finally {
                // 重新启用按钮
                likeBtn.disabled = false;
            }
        }
        
        // 处理回复
        function handleReply(e) {
            const commentId = e.currentTarget.getAttribute('data-id');
            replyingTo = commentId;
            
            // 滚动到表单
            const form = document.getElementById('comment-form');
            if (form) {
                form.scrollIntoView({ behavior: 'smooth' });
                
                // 在内容前添加回复提示
                const contentField = form.content;
                const repliedComment = document.querySelector(\`.comment[data-id="\${commentId}"] .comment-author\`);
                const repliedAuthor = repliedComment ? repliedComment.textContent.trim().replace('站长', '').trim() : '';
                contentField.value = \`回复 \${repliedAuthor}: \`;
                contentField.focus();
            }
        }
        
        // 重置hCaptcha
        function resetCaptcha() {
            if (window.hcaptcha && hcaptchaWidgetId) {
                hcaptcha.reset(hcaptchaWidgetId);
            }
        }
        
        // 显示加载中
        function showLoading(containerId) {
            const container = document.getElementById(containerId);
            if (container) {
                container.innerHTML = \`
                    <div class="loading">
                        ${LOADING_SVG}
                    </div>
                \`;
            }
        }
        
        // 显示无评论状态
        function showNoComments(containerId, message) {
            const container = document.getElementById(containerId);
            if (container) {
                container.innerHTML = \`
                    <div class="no-comments">
                        \${message}
                    </div>
                \`;
            }
        }
        
        // 显示错误
        function showError(containerId, message) {
            const container = document.getElementById(containerId);
            if (container) {
                container.innerHTML = \`<div class="error">\${escapeHtml(message)}</div>\`;
            }
        }
        
        // 显示成功
        function showSuccess(containerId, message) {
            const container = document.getElementById(containerId);
            if (container) {
                container.innerHTML = \`<div class="success">\${escapeHtml(message)}</div>\`;
            }
        }

        // 转义HTML防止XSS攻击
        function escapeHtml(unsafe) {
            return unsafe
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#39;");
        }

        // 处理URL格式和转义
        function escapeUrl(url) {
            let safeUrl = url;
            if (!url.startsWith('http://') && !url.startsWith('https://')) {
                safeUrl = 'https://' + url;
            }
            return encodeURI(safeUrl).replace(/"/g, "%22").replace(/'/g, "%27");
        }
    </script>
</body>
</html>
`;

// 生成随机ID
function generateId() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// 验证 hCaptcha
async function verifyCaptcha(token, secret) {
    const formData = new FormData();
    formData.append('response', token);
    formData.append('secret', secret);
    
    const response = await fetch('https://hcaptcha.com/siteverify', {
        method: 'POST',
        body: formData
    });
    
    return await response.json();
}

// 获取用户信息
function getUserInfo(request) {
    const ip = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    return { ip, userAgent };
}

// 主处理函数
export default {
    async fetch(request, env) {
        const url = new URL(request.url);
        const path = url.pathname;
        const userInfo = getUserInfo(request);
        
        // 处理API请求
        if (path.startsWith('/api')) {
            if (path === '/api/list' && request.method === 'GET') {
                // 获取评论列表
                const article = url.searchParams.get('article') || '';
                const comments = await env.BLOG_COMMENTS.get(article, { type: 'json' });
                
                if (comments === null) {
                    return new Response(JSON.stringify({ error: '本文评论区不存在' }), {
                        status: 404,
                        headers: { 'Content-Type': 'application/json' }
                    });
                }
                
                // 处理站长标识并过滤特殊UUID
                const processedComments = comments.map(comment => {
                    return {
                        ...comment,
                        // 如果authorId是站长ID，则标记为站长
                        isAdmin: comment.authorId === ADMIN_UUID
                    };
                });
                
                return new Response(JSON.stringify({ comments: processedComments }), {
                    headers: { 'Content-Type': 'application/json' }
                });
            }
            else if (path.startsWith('/api/new/') && request.method === 'POST') {
                // 创建新文章评论区
                const parts = path.split('/');
                const adminUuid = parts[3];
                const article = parts.slice(4).join('/');
                
                if (adminUuid !== ADMIN_UUID) {
                    return new Response(JSON.stringify({ error: '无权操作' }), {
                        status: 403,
                        headers: { 'Content-Type': 'application/json' }
                    });
                }
                
                // 检查是否已存在
                const existing = await env.BLOG_COMMENTS.get(article);
                if (existing !== null) {
                    return new Response(JSON.stringify({ error: '评论区已存在' }), {
                        status: 400,
                        headers: { 'Content-Type': 'application/json' }
                    });
                }
                
                // 创建空评论区
                await env.BLOG_COMMENTS.put(article, JSON.stringify([]));
                
                return new Response(JSON.stringify({ success: true }), {
                    headers: { 'Content-Type': 'application/json' }
                });
            }
            else if (path === '/api/submit' && request.method === 'POST') {
                // 提交新评论
                try {
                    const data = await request.json();
                    const { article, content, author, website, hcaptchaResponse, parentId } = data;
                    
                    // 验证hCaptcha
                    const hcaptchaSecret = env.HCAPTCHA_SECRET;
                    const verification = await verifyCaptcha(hcaptchaResponse, hcaptchaSecret);
                    
                    if (!verification.success) {
                        return new Response(JSON.stringify({ error: '人机验证失败' }), {
                            status: 400,
                            headers: { 'Content-Type': 'application/json' }
                        });
                    }
                    
                    // 验证输入
                    if (!content || content.length > 250 || !author) {
                        return new Response(JSON.stringify({ error: '无效的输入' }), {
                            status: 400,
                            headers: { 'Content-Type': 'application/json' }
                        });
                    }
                    
                    // 获取现有评论
                    const comments = await env.BLOG_COMMENTS.get(article, { type: 'json' });
                    
                    if (comments === null) {
                        return new Response(JSON.stringify({ error: '本文评论区不存在' }), {
                            status: 404,
                            headers: { 'Content-Type': 'application/json' }
                        });
                    }
                    
                    // === 站长身份特殊处理 ===
                    const isAdminSubmission = author === ADMIN_SUBMIT_UUID;
                    const finalAuthor = isAdminSubmission ? "站长" : author;
                    const authorId = isAdminSubmission ? ADMIN_UUID : generateId();
                    
                    // 添加新评论
                    const newComment = {
                        id: generateId(),
                        parentId: parentId || null,
                        content,
                        author: finalAuthor,
                        authorId,
                        website: website || null,
                        timestamp: Date.now(),
                        likes: 0,
                        isAdmin: isAdminSubmission,
                        userInfo: {
                            ip: userInfo.ip,
                            userAgent: userInfo.userAgent
                        }
                    };
                    
                    comments.push(newComment);
                    
                    // 保存评论
                    await env.BLOG_COMMENTS.put(article, JSON.stringify(comments));
                    
                    return new Response(JSON.stringify({ success: true }), {
                        headers: { 'Content-Type': 'application/json' }
                    });
                } catch (error) {
                    return new Response(JSON.stringify({ error: '服务器错误' }), {
                        status: 500,
                        headers: { 'Content-Type': 'application/json' }
                    });
                }
            }
            else if (path === '/api/agree' && request.method === 'POST') {
                // 点赞评论
                try {
                    const data = await request.json();
                    const { commentId } = data;
                    
                    if (!commentId) {
                        return new Response(JSON.stringify({ error: '缺少评论ID' }), {
                            status: 400,
                            headers: { 'Content-Type': 'application/json' }
                        });
                    }
                    
                    // 获取所有文章的评论
                    const keys = await env.BLOG_COMMENTS.list();
                    let found = false;
                    let newCount = 0;
                    
                    // 遍历所有文章查找评论并点赞
                    for (const key of keys.keys) {
                        const comments = await env.BLOG_COMMENTS.get(key.name, { type: 'json' });
                        if (comments === null) continue;
                        
                        const commentIndex = comments.findIndex(c => c.id === commentId);
                        
                        if (commentIndex !== -1) {
                            // 更新点赞数
                            comments[commentIndex].likes = (comments[commentIndex].likes || 0) + 1;
                            newCount = comments[commentIndex].likes;
                            await env.BLOG_COMMENTS.put(key.name, JSON.stringify(comments));
                            found = true;
                            break;
                        }
                    }
                    
                    if (!found) {
                        return new Response(JSON.stringify({ error: '评论未找到' }), {
                            status: 404,
                            headers: { 'Content-Type': 'application/json' }
                        });
                    }
                    
                    return new Response(JSON.stringify({ success: true, newCount }), {
                        headers: { 'Content-Type': 'application/json' }
                    });
                } catch (error) {
                    return new Response(JSON.stringify({ error: '服务器错误' }), {
                        status: 500,
                        headers: { 'Content-Type': 'application/json' }
                    });
                }
            }
            
            // 未知API端点
            return new Response(JSON.stringify({ error: '未找到API端点' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        // 主页面
        const article = url.searchParams.get('article') || '';
        const hcaptchaSiteKey = env.HCAPTCHA_SITEKEY;
        
        // 评论表单
        const formContent = `
            <div id="form-messages"></div>
            <form id="comment-form" class="comment-form">
                <div class="form-group">
                    <label for="content">评论内容 (不超过250字)</label>
                    <textarea id="content" name="content" required maxlength="250"></textarea>
                </div>
                <div class="form-group">
                    <label for="author">昵称</label>
                    <input type="text" id="author" name="author" required>
                </div>
                <div class="form-group">
                    <label for="website">个人网站或联系方式 (选填)</label>
                    <input type="text" id="website" name="website">
                </div>
                <div class="hcaptcha-container">
                    <div id="hcaptcha-loading" class="loading">
                        ${LOADING_SVG}
                    </div>
                    <div id="hcaptcha-widget"></div>
                </div>
                <div class="form-group">
                    <button type="submit">提交评论</button>
                    <button type="button" id="reset-captcha">重置验证</button>
                </div>
            </form>
        `;
        
        // 评论列表
        const commentsContent = `
            <div id="comments-container" class="comments-list">
                <div class="loading">
                    ${LOADING_SVG}
                </div>
            </div>
        `;
        
        // 完整页面
        const fullContent = formContent + commentsContent;
        
        return new Response(HTML_TEMPLATE(fullContent, hcaptchaSiteKey), {
            headers: { 'Content-Type': 'text/html' }
        });
    }
};