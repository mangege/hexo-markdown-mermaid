const mermaidVersion = hexo.config.mermaid?.version || '11';
const { version: _version, ...userConfig } = hexo.config.mermaid || {};
const mermaidConfig = Object.assign({
  startOnLoad: true
}, userConfig);

// 检测页面是否包含 mermaid 代码块
hexo.extend.filter.register('before_post_render', function(data) {
  // 匹配 ```mermaid 或 ~~~mermaid 代码块
  const mermaidRegex = /^(`{3,}|~{3,})\s*mermaid\s*[\s\S]*?\1/gm;
  if (mermaidRegex.test(data.content)) {
    data.mermaid = true;
  }
  return data;
});

// 只有包含 mermaid 图表的页面才注入脚本
hexo.extend.injector.register('body_end', function() {
  // 只有当页面有 mermaid 标记时才注入
  if (!this.page.mermaid) return '';

  return `
<script src="https://cdn.jsdelivr.net/npm/mermaid@${mermaidVersion}/dist/mermaid.min.js" defer></script>
<script>
  // defer 脚本保证在 DOMContentLoaded 之前执行，但 mermaid.initialize 需要在脚本加载完成后
  // 使用 defer 确保脚本按顺序执行，然后在 DOMContentLoaded 时初始化
  document.addEventListener('DOMContentLoaded', function() {
    if (window.mermaid) {
      mermaid.initialize(${JSON.stringify(mermaidConfig)});
    } else {
      // 兜底：如果 defer 失效，等待脚本加载完成
      const script = document.querySelector('script[src*="mermaid.min.js"]');
      if (script) {
        script.addEventListener('load', function() {
          mermaid.initialize(${JSON.stringify(mermaidConfig)});
        });
      }
    }
  });
</script>
`;
}, 'default');