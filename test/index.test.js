'use strict';

require('chai').should();

const mockHexo = (config = {}) => {
  const registeredInjectors = [];

  const mock = {
    extend: {},
    config: Object.assign({}, config)
  };
  mock.extend.injector = {
    register: function(position, content, priority) {
      registeredInjectors.push({ position, content, priority });
    }
  };
  mock._registeredInjectors = registeredInjectors;
  return mock;
};

function loadPlugin(hexoMock) {
  global.hexo = hexoMock;
  delete require.cache[require.resolve('../index.js')];
  require('../index.js');
}

describe('hexo-mermaid', function() {
  this.timeout(10000);

  describe('injector', function() {
    it('should register body_end injector with mermaid script', function() {
      const hexo = mockHexo({});
      loadPlugin(hexo);
      const injectors = hexo._registeredInjectors;
      const mermaidInjector = injectors.find(i => i.position === 'body_end' && i.content.includes('mermaid'));
      mermaidInjector.should.be.an('object');
      mermaidInjector.priority.should.equal('default');
    });

    it('should use default config when no mermaid config', function() {
      const hexo = mockHexo({});
      loadPlugin(hexo);
      const injector = hexo._registeredInjectors[0];
      injector.content.should.include('"startOnLoad":true');
    });

    it('should merge user config with default config', function() {
      const hexo = mockHexo({ mermaid: { theme: 'forest', fontFamily: 'Arial' } });
      loadPlugin(hexo);
      const injector = hexo._registeredInjectors[0];
      injector.content.should.include('"theme":"forest"');
      injector.content.should.include('"fontFamily":"Arial"');
      injector.content.should.include('"startOnLoad":true');
    });

    it('should use default version 11 when no version config', function() {
      const hexo = mockHexo({});
      loadPlugin(hexo);
      const injector = hexo._registeredInjectors[0];
      injector.content.should.include('mermaid@11/dist/mermaid.min.js');
    });

    it('should use custom version when specified', function() {
      const hexo = mockHexo({ mermaid: { version: '10' } });
      loadPlugin(hexo);
      const injector = hexo._registeredInjectors[0];
      injector.content.should.include('mermaid@10/dist/mermaid.min.js');
    });
  });
});
