const mermaidVersion = hexo.config.mermaid?.version || '11';
const { version: _version, ...userConfig } = hexo.config.mermaid || {};
const mermaidConfig = Object.assign({
  startOnLoad: true
}, userConfig);

hexo.extend.injector.register('body_end', `
<script src="https://cdn.jsdelivr.net/npm/mermaid@${mermaidVersion}/dist/mermaid.min.js"></script>
<script>
  document.addEventListener('DOMContentLoaded', function() {
    mermaid.initialize(${JSON.stringify(mermaidConfig)});
  });
</script>
`, 'default');
