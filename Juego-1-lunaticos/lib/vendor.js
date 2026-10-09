// The one place library versions live. Load it as the first script in <head> (classic, not module):
//   <script src="lib/vendor.js"></script>
// It writes the Three.js import map (+ addons used by 01–05) and loads GSAP, synchronously,
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
    },
    integrity: {
      [u('build/three.module.js')]: 'sha384-8FCZ1eVO6it4+pbec2aDtnTrwjWXZLJRC+MAGCIPDgsYnUrl/E0A2YlF8ioMKI/J',
      [u('build/three.core.js')]: 'sha384-dw2ooPewaEIrAgl6oFDBmmBWCE9oW9LxRGcfwZ0hLvEprzo202wXl7vCYHRlSnOT',
      [u('examples/jsm/controls/OrbitControls.js')]: 'sha384-4rziNxOBZKQ69i+w+f89KJ55TCYquwchVbByQwmaOeIOXdOU2PLDn3kOfXHwIJC9',
      [u('examples/jsm/exporters/OBJExporter.js')]: 'sha384-nbwtoZENJD3Vq+ACK0CuGQdPMuDWHkamC2KJD70EV5nfg6jQjfppKOea07YJN+N3',
      [u('examples/jsm/exporters/GLTFExporter.js')]: 'sha384-VofkvpG6HERhFCYbsUOHeNXBCqID2nfqkQqnVzE1jc/oPcz+qJ13ADdXH08hE+cQ',
    },
  };
  document.write(`<script type="importmap">${JSON.stringify(map)}<\/script>`);
  document.write(`<script src="https://cdn.jsdelivr.net/npm/gsap@${GSAP_V}/dist/gsap.min.js"><\/script>`);
  window.CHOLO_VERSIONS = { three: THREE_V, gsap: GSAP_V };
})();
