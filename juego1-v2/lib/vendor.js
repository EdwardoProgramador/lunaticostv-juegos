// The one place library versions live. Load it as the first script in <head> (classic, not module):
//   <script src="lib/vendor.js"></script>
// It writes the Three.js import map (+ addons: orbit/exporters for 01–05, post-processing for the room) and loads GSAP, synchronously,
// so every page's module scripts resolve 'three' to the same pinned build.
(() => {
  const THREE_V = '0.184.0', GSAP_V = '3.12.5';
  const u = p => `https://unpkg.com/three@${THREE_V}/${p}`;
  const map = {
    imports: {
      'three': u('build/three.module.js'),
      'three/addons/controls/OrbitControls.js': u('examples/jsm/controls/OrbitControls.js'),
      'three/addons/exporters/OBJExporter.js': u('examples/jsm/exporters/OBJExporter.js'),
      'three/addons/exporters/GLTFExporter.js': u('examples/jsm/exporters/GLTFExporter.js'),
      'three/addons/postprocessing/EffectComposer.js': u('examples/jsm/postprocessing/EffectComposer.js'),
      'three/addons/postprocessing/RenderPass.js': u('examples/jsm/postprocessing/RenderPass.js'),
      'three/addons/postprocessing/UnrealBloomPass.js': u('examples/jsm/postprocessing/UnrealBloomPass.js'),
      'three/addons/postprocessing/OutputPass.js': u('examples/jsm/postprocessing/OutputPass.js'),
    },
    integrity: {
      [u('build/three.module.js')]: 'sha384-8FCZ1eVO6it4+pbec2aDtnTrwjWXZLJRC+MAGCIPDgsYnUrl/E0A2YlF8ioMKI/J',
      [u('build/three.core.js')]: 'sha384-dw2ooPewaEIrAgl6oFDBmmBWCE9oW9LxRGcfwZ0hLvEprzo202wXl7vCYHRlSnOT',
      [u('examples/jsm/controls/OrbitControls.js')]: 'sha384-4rziNxOBZKQ69i+w+f89KJ55TCYquwchVbByQwmaOeIOXdOU2PLDn3kOfXHwIJC9',
      [u('examples/jsm/exporters/OBJExporter.js')]: 'sha384-nbwtoZENJD3Vq+ACK0CuGQdPMuDWHkamC2KJD70EV5nfg6jQjfppKOea07YJN+N3',
      [u('examples/jsm/exporters/GLTFExporter.js')]: 'sha384-VofkvpG6HERhFCYbsUOHeNXBCqID2nfqkQqnVzE1jc/oPcz+qJ13ADdXH08hE+cQ',
      [u('examples/jsm/postprocessing/EffectComposer.js')]: 'sha384-9Rdp95mYHRj8gGxPz4TqkDaCUh8rd67b7V5slkjz7GA9uNXtykhptQdEPPOocbUn',
      [u('examples/jsm/postprocessing/RenderPass.js')]: 'sha384-uXlYrFHzQTAiW5xsJFs0kB/Pym7jA0qunZ+aS1V25CJ1MjaKbgNQv5SjoEzNoa4F',
      [u('examples/jsm/postprocessing/UnrealBloomPass.js')]: 'sha384-HZL+5ILFcHlBFu9mQNWD9y0+a1Soe3WyoO6G350cB6WhhmkttNSftznMx5wP2QWd',
      [u('examples/jsm/postprocessing/OutputPass.js')]: 'sha384-3IFYrRLOw90S3gt5Xi3JVTJrETpklthjLSmnmeyqxQmh1knUIaGPwbRsk35kgNoW',
    },
  };
  document.write(`<script type="importmap">${JSON.stringify(map)}<\/script>`);
  document.write(`<script src="https://cdn.jsdelivr.net/npm/gsap@${GSAP_V}/dist/gsap.min.js"><\/script>`);
  window.CHOLO_VERSIONS = { three: THREE_V, gsap: GSAP_V };
})();
