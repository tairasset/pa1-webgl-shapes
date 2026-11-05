(function () {
  'use strict';
  const T = AFRAME.THREE;
  const TAU = Math.PI * 2;
  const sunDirection = new T.Vector3(-0.45, 0.33, -0.83).normalize();
  const noise = seed => {
    const value = Math.sin(seed * 127.1 + 17.3) * 43758.5453;
    return value - Math.floor(value);
  };

  function sky() {
    return new T.Mesh(
      new T.SphereGeometry(260, 32, 16),
      new T.ShaderMaterial({
        side: T.BackSide,
        depthWrite: false,
        uniforms: {
          zenith: { value: new T.Color('#31556d') },
          horizon: { value: new T.Color('#e8ad78') },
          sunColor: { value: new T.Color('#ffe4ab') },
          sunDirection: { value: sunDirection }
        },
        vertexShader: `
          varying vec3 direction;
          void main() {
            direction = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          varying vec3 direction;
          uniform vec3 zenith, horizon, sunColor, sunDirection;
          void main() {
            vec3 view = normalize(direction);
            float height = smoothstep(-0.055, 0.72, view.y);
            vec3 color = mix(horizon, zenith, height);
            float sun = max(0.0, dot(view, sunDirection));
            color = mix(color, sunColor, 0.42 * pow(sun, 9.0) + 0.32 * pow(sun, 80.0));
            color = mix(color, sunColor, smoothstep(0.99928, 0.99969, sun));
            gl_FragColor = vec4(color, 1.0);
            #include <colorspace_fragment>
          }
        `
      })
    );
  }

  function sand() {
    const ground = new T.Mesh(
      new T.PlaneGeometry(480, 480),
      new T.ShaderMaterial({
        uniforms: {
          sandColor: { value: new T.Color('#b67d4a') },
          shadeColor: { value: new T.Color('#925c39') },
          hazeColor: { value: new T.Color('#e8ad78') }
        },
        vertexShader: `
          varying vec3 world;
          void main() {
            world = (modelMatrix * vec4(position, 1.0)).xyz;
            gl_Position = projectionMatrix * viewMatrix * vec4(world, 1.0);
          }
        `,
        fragmentShader: `
          varying vec3 world;
          uniform vec3 sandColor, shadeColor, hazeColor;
          void main() {
            float distanceToEye = distance(world, cameraPosition);
            float dune = sin(world.x * 0.17 + world.z * 0.27 + sin(world.z * 0.08) * 1.7);
            float ripple = sin(world.x * 4.5 + world.z * 7.0 + sin(world.x * 0.9));
            float grain = ripple * (1.0 - smoothstep(7.0, 28.0, distanceToEye));
            vec3 color = mix(sandColor, shadeColor, clamp(0.21 + 0.17 * dune + 0.07 * grain, 0.0, 1.0));
            color = mix(color, hazeColor, smoothstep(24.0, 150.0, distanceToEye));
            gl_FragColor = vec4(color, 1.0);
            #include <colorspace_fragment>
          }
        `
      })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.045;
    return ground;
  }

  // Cross-sections rise into a crag and descend on the far side. Three overlapping
  // ranges leave the foreground level and create depth as the visitor walks.
  function ridge(radius, height, offset, bottom, top) {
    const segments = 104;
    const positions = [];
    const colors = [];
    const indices = [];
    const dark = new T.Color(bottom);
    const light = new T.Color(top);
    const color = new T.Color();
    const heights = [0, 0.26, 1, 0.5, 0];
    for (let band = 0; band < heights.length; band++) {
      for (let i = 0; i <= segments; i++) {
        const n = i % segments;
        const angle = TAU * n / segments;
        const mass = Math.pow(Math.abs(Math.sin(angle * 3 + offset)), 0.65);
        const spine = 0.37 + 0.42 * mass + 0.14 * Math.sin(angle * 13 - offset) + 0.17 * noise(n + offset);
        const peak = height * spine;
        const r = radius * (0.73 + band * 0.17 + 0.08 * Math.sin(angle * 5 + offset)) +
          (noise(n + band * 17 + offset) - 0.5) * radius * 0.15;
        const y = peak * heights[band] + (heights[band] ? noise(n * 2 + band) * height * 0.1 : -0.32);
        positions.push(Math.sin(angle) * r, y, -Math.cos(angle) * r);
        color.copy(dark).lerp(light, Math.min(0.94, 0.09 + heights[band] * 0.56 + noise(n + band * 83) * 0.19));
        colors.push(color.r, color.g, color.b);
        if (band && i) {
          const current = band * (segments + 1) + i;
          const previous = current - segments - 1;
          indices.push(previous - 1, current - 1, previous, previous, current - 1, current);
        }
      }
    }
    const mesh = new T.BufferGeometry();
    mesh.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
    mesh.setAttribute('color', new T.Float32BufferAttribute(colors, 3));
    mesh.setIndex(indices);
    const facets = mesh.toNonIndexed();
    mesh.dispose();
    facets.computeVertexNormals();
    return new T.Mesh(facets, new T.MeshLambertMaterial({ vertexColors: true, side: T.DoubleSide }));
  }

  function rocks() {
    const count = 74;
    const mesh = new T.InstancedMesh(new T.DodecahedronGeometry(1, 0),
      new T.MeshLambertMaterial({ color: '#aa7654', flatShading: true }), count);
    const rock = new T.Object3D();
    for (let i = 0; i < count; i++) {
      const angle = i * 2.39996;
      const radius = 8.3 + noise(i + 61) * 38;
      const size = 0.11 + Math.pow(noise(i + 13), 2) * 0.62;
      rock.position.set(Math.cos(angle) * radius, size * 0.13, Math.sin(angle) * radius);
      rock.rotation.set(noise(i + 2), angle, noise(i + 44));
      rock.scale.set(size * 1.6, size * 0.48, size);
      rock.updateMatrix();
      mesh.setMatrixAt(i, rock.matrix);
    }
    return mesh;
  }

  window.createDesertLandscape = function () {
      const landscape = new T.Group();
      const backdrop = sky();
      backdrop.renderOrder = -1;
      landscape.add(backdrop, sand(),
        ridge(108, 27, 1.32, '#916d70', '#c39885'),
        ridge(68, 21, 3.28, '#7c4e4c', '#c88f6d'),
        ridge(42, 12, 2.16, '#7b4834', '#ba825d'),
        rocks());
      return landscape;
  };

  AFRAME.registerComponent('desert-landscape', {
    init: function () {
      this.el.setObject3D('landscape', window.createDesertLandscape());
    },
    remove: function () {
      const landscape = this.el.getObject3D('landscape');
      if (!landscape) return;
      this.el.removeObject3D('landscape');
      landscape.traverse(object => {
        object.geometry?.dispose();
        object.material?.dispose();
        if (object.isInstancedMesh) object.dispose();
      });
    }
  });
})();
