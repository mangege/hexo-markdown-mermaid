'use strict';

require('chai').should();

const mockHexo = (config = {}) => {
  const registeredInjectors = [];
  const registeredFilters = [];

  const mock = {
    extend: {},
    config: Object.assign({}, config)
  };
  mock.extend.injector = {
    register: function(position, content, priority) {
      registeredInjectors.push({ position, content, priority });
    }
  };
  mock.extend.filter = {
    register: function(name, fn) {
      registeredFilters.push({ name, fn });
    }
  };
  mock._registeredInjectors = registeredInjectors;
  mock._registeredFilters = registeredFilters;
  return mock;
};

function loadPlugin(hexoMock) {
  global.hexo = hexoMock;
  delete require.cache[require.resolve('../index.js')];
  require('../index.js');
}

describe('hexo-mermaid', function() {
  this.timeout(10000);

  describe('filter', function() {
    it('should register before_post_render filter', function() {
      const hexo = mockHexo({});
      loadPlugin(hexo);
      const filters = hexo._registeredFilters;
      const mermaidFilter = filters.find(f => f.name === 'before_post_render');
      mermaidFilter.should.be.an('object');
      mermaidFilter.fn.should.be.a('function');
    });

    it('should set page.mermaid = true when content has mermaid code block', function() {
      const hexo = mockHexo({});
      loadPlugin(hexo);
      const filter = hexo._registeredFilters.find(f => f.name === 'before_post_render');
      const data = { content: '```mermaid\ngraph TD\nA-->B\n```' };
      filter.fn(data);
      data.mermaid.should.be.true;
    });

    it('should not set page.mermaid when no mermaid code block', function() {
      const hexo = mockHexo({});
      loadPlugin(hexo);
      const filter = hexo._registeredFilters.find(f => f.name === 'before_post_render');
      const data = { content: 'just plain text' };
      filter.fn(data);
      // mermaid 可能存在但为 undefined/falsy，不应该为 true
      (data.mermaid === true).should.be.false;
    });

    it('should detect mermaid with tildes', function() {
      const hexo = mockHexo({});
      loadPlugin(hexo);
      const filter = hexo._registeredFilters.find(f => f.name === 'before_post_render');
      const data = { content: '~~~mermaid\ngraph TD\nA-->B\n~~~' };
      filter.fn(data);
      data.mermaid.should.be.true;
    });
  });

  describe('injector', function() {
    it('should not inject script when page.mermaid is not set', function() {
      const hexo = mockHexo({});
      loadPlugin(hexo);
      const injector = hexo._registeredInjectors.find(i => i.position === 'body_end');
      injector.should.be.an('object');
      injector.content.should.be.a('function');
      // 调用注入器函数，page 没有 mermaid 标记
      const result = injector.content.call({ page: {} });
      result.should.equal('');
    });

    it('should inject mermaid script when page.mermaid is true', function() {
      const hexo = mockHexo({});
      loadPlugin(hexo);
      const injector = hexo._registeredInjectors.find(i => i.position === 'body_end');
      const result = injector.content.call({ page: { mermaid: true } });
      result.should.include('mermaid.min.js');
      result.should.include('defer');
      result.should.include('DOMContentLoaded');
      result.should.include('mermaid.initialize');
    });

    it('should use default config when no mermaid config', function() {
      const hexo = mockHexo({});
      loadPlugin(hexo);
      const injector = hexo._registeredInjectors.find(i => i.position === 'body_end');
      const result = injector.content.call({ page: { mermaid: true } });
      result.should.include('"startOnLoad":true');
    });

    it('should merge user config with default config', function() {
      const hexo = mockHexo({ mermaid: { theme: 'forest', fontFamily: 'Arial' } });
      loadPlugin(hexo);
      const injector = hexo._registeredInjectors.find(i => i.position === 'body_end');
      const result = injector.content.call({ page: { mermaid: true } });
      result.should.include('"theme":"forest"');
      result.should.include('"fontFamily":"Arial"');
      result.should.include('"startOnLoad":true');
    });

    it('should use default version 11 when no version config', function() {
      const hexo = mockHexo({});
      loadPlugin(hexo);
      const injector = hexo._registeredInjectors.find(i => i.position === 'body_end');
      const result = injector.content.call({ page: { mermaid: true } });
      result.should.include('mermaid@11/dist/mermaid.min.js');
    });

    it('should use custom version when specified', function() {
      const hexo = mockHexo({ mermaid: { version: '10' } });
      loadPlugin(hexo);
      const injector = hexo._registeredInjectors.find(i => i.position === 'body_end');
      const result = injector.content.call({ page: { mermaid: true } });
      result.should.include('mermaid@10/dist/mermaid.min.js');
    });
  });
});