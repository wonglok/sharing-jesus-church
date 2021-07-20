import {
  WebGLCubeRenderTarget,
  Camera,
  Scene,
  Mesh,
  PlaneBufferGeometry,
  ShaderMaterial,
  CubeRefractionMapping,
  BackSide,
  NoBlending,
  BoxBufferGeometry,
  CubeCamera,
  Color,
  LinearMipmapLinearFilter,
  Vector2,
  MeshBasicMaterial,
  DoubleSide,
  RGBFormat,
  LinearFilter,
  CubeReflectionMapping,
  WebGLRenderTarget,
  EquirectangularReflectionMapping,
  sRGBEncoding,
} from "three";

// import { cloneUniforms } from "three/src/renderers/shaders/UniformsUtils.js";
// import * as dat from '';

class CustomWebGLCubeRenderTarget extends WebGLCubeRenderTarget {
  constructor(width, height, options) {
    super(width, height, options);
    this.ok = true;
  }

  setup(renderer, texture) {
    this.texture.type = texture.type;
    this.texture.format = texture.format;
    this.texture.encoding = texture.encoding;

    var scene = new Scene();

    var shader = {
      uniforms: {
        tEquirect: { value: null },
      },

      vertexShader: `
        varying vec3 vWorldDirection;
        vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
          return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
        }
        void main() {
          vWorldDirection = transformDirection( position, modelMatrix );
          #include <begin_vertex>
          #include <project_vertex>
        }
      `,

      fragmentShader: `
        uniform sampler2D tEquirect;
        varying vec3 vWorldDirection;
        #define RECIPROCAL_PI 0.31830988618
        #define RECIPROCAL_PI2 0.15915494
        void main() {
          vec3 direction = normalize( vWorldDirection );
          vec2 sampleUV;
          sampleUV.y = asin( clamp( direction.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
          sampleUV.x = atan( direction.z, direction.x ) * RECIPROCAL_PI2 + 0.5;
          gl_FragColor = texture2D( tEquirect, sampleUV );
        }
      `,
    };

    var material = new ShaderMaterial({
      type: "CubemapFromEquirect",
      uniforms: shader.uniforms,
      vertexShader: shader.vertexShader,
      fragmentShader: shader.fragmentShader,
      side: BackSide,
      blending: NoBlending,
    });

    material.uniforms.tEquirect.value = texture;

    var mesh = new Mesh(new BoxBufferGeometry(5, 5, 5), material);
    scene.add(mesh);

    // var cubeRtt = new WebGLCubeRenderTarget(this.width, {format: RGBFormat, generateMipmaps: true, minFilter: LinearMipmapLinearFilter });
    var camera = new CubeCamera(1, 100000, this);

    camera.renderTarget = this;
    camera.renderTarget.texture.name = "CubeCameraTexture";

    camera.update(renderer, scene);

    this.compute = () => {
      camera.update(renderer, scene);
    };

    // mesh.geometry.dispose()
    // mesh.material.dispose()
  }
}

export class ShaderCubeCloud {
  constructor({ renderer, res = 128, color = new Color("#ffffff") }) {
    // this.onLoop = ctx.onLoop
    // console.log(renderer)
    this.renderer = renderer;
    this.resX = res;
    this.renderTargetCube = new CustomWebGLCubeRenderTarget(this.resX, {
      format: RGBFormat,
      generateMipmaps: true,
      magFilter: LinearFilter,
      minFilter: LinearMipmapLinearFilter,
    });
    this.renderTargetPlane = new WebGLRenderTarget(this.resX, this.resX, {
      format: RGBFormat,
      generateMipmaps: true,
      magFilter: LinearFilter,
      minFilter: LinearMipmapLinearFilter,
    });
    this.camera = new Camera();
    this.scene = new Scene();
    this.geo = new PlaneBufferGeometry(2, 2, 2, 2);
    let uniforms = {
      time: {
        value: 0,
      },
      resolution: {
        value: new Vector2(this.resX, this.resX),
      },
      diffuse: {
        value: color,
      },
    };

    this.mat = new ShaderMaterial({
      side: DoubleSide,
      transparent: true,
      uniforms,
      vertexShader: `
        void main (void) {
          gl_Position = vec4( position, 1.0 );
        }
      `,
      fragmentShader: `
        #include <common>
        uniform vec2 resolution;
        uniform float time;
        uniform vec3 diffuse;

        const mat2 m = mat2( 0.80,  0.60, -0.60,  0.80 );

        float noise( in vec2 p ) {
          return sin(p.x)*sin(p.y);
        }

        float fbm4( vec2 p ) {
            float f = 0.0;
            f += 0.5000 * noise( p ); p = m * p * 2.02;
            f += 0.2500 * noise( p ); p = m * p * 2.03;
            f += 0.1250 * noise( p ); p = m * p * 2.01;
            f += 0.0625 * noise( p );
            return f / 0.9375;
        }

        float fbm6( vec2 p ) {
            float f = 0.0;
            f += 0.500000*(0.5 + 0.5 * noise( p )); p = m*p*2.02;
            f += 0.250000*(0.5 + 0.5 * noise( p )); p = m*p*2.03;
            f += 0.125000*(0.5 + 0.5 * noise( p )); p = m*p*2.01;
            f += 0.062500*(0.5 + 0.5 * noise( p )); p = m*p*2.04;
            f += 0.031250*(0.5 + 0.5 * noise( p )); p = m*p*2.01;
            f += 0.015625*(0.5 + 0.5 * noise( p ));
            return f/0.96875;
        }

        float pattern (vec2 p) {
          float vout = fbm4( p + time + fbm6(  p + fbm4( p + time )) );
          return abs(vout);
        }

        // Found this on GLSL sandbox. I really liked it, changed a few things and made it tileable.
        // :)
        // by David Hoskins.

        // Water turbulence effect by joltz0r 2013-07-04, improved 2013-07-07


        // Redefine below to see the tiling...
        //#define SHOW_TILING

        #define TAU 6.28318530718
        #define MAX_ITER 35

        vec4 waterwaves(in vec3 dyeColor,  in vec2 fragCoord, in vec2 iResolution, in float iTime)
          {
            float time = iTime * .5+23.0;
              // uv should be the 0-1 uv of texture...
            vec2 uv = fragCoord.xy / iResolution.xy;

          #ifdef SHOW_TILING
            vec2 p = mod(uv*TAU*2.0, TAU)-250.0;
          #else
              vec2 p = mod(uv*TAU, TAU)-250.0;
          #endif
            vec2 i = vec2(p);
            float c = 1.0;
            float inten = .005;

            for (int n = 0; n < MAX_ITER; n++)
            {
              float t = time * (1.0 - (3.5 / float(n+1)));
              i = p + vec2(cos(t - i.x) + sin(t + i.y), sin(t - i.y) + cos(t + i.x));
              c += 1.0/length(vec2(p.x / (sin(i.x+t)/inten),p.y / (cos(i.y+t)/inten)));
            }
            c /= float(MAX_ITER);
            c = 1.17-pow(c, 1.4);
            vec3 colour = vec3(pow(abs(c), 25.0));
              colour = clamp(colour * vec3(dyeColor), 0.0, 1.0);


            #ifdef SHOW_TILING
            // Flash tile borders...
            vec2 pixel = 2.0 / iResolution.xy;
            uv *= 2.0;

            float f = floor(mod(iTime*.5, 2.0)); 	// Flash value.
            vec2 first = step(pixel, uv) * f;		   	// Rule out first screen pixels and flash.
            uv  = step(fract(uv), pixel);				// Add one line of pixels per tile.
            colour = mix(colour, vec3(1.0, 1.0, 0.0), (uv.x + uv.y) * first.x * first.y); // Yellow line

            #endif
            return vec4(colour, 1.0);
          }


          //  Simplex 3D Noise
          //  by Ian McEwan, Ashima Arts
          //
          vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
          vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}

          float snoise(vec3 v){
          const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
          const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

          // First corner
          vec3 i  = floor(v + dot(v, C.yyy) );
          vec3 x0 =   v - i + dot(i, C.xxx) ;

          // Other corners
          vec3 g = step(x0.yzx, x0.xyz);
          vec3 l = 1.0 - g;
          vec3 i1 = min( g.xyz, l.zxy );
          vec3 i2 = max( g.xyz, l.zxy );

          //  x0 = x0 - 0. + 0.0 * C
          vec3 x1 = x0 - i1 + 1.0 * C.xxx;
          vec3 x2 = x0 - i2 + 2.0 * C.xxx;
          vec3 x3 = x0 - 1. + 3.0 * C.xxx;

          // Permutations
          i = mod(i, 289.0 );
          vec4 p = permute( permute( permute(
                      i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
                    + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
                    + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

          // Gradients
          // ( N*N points uniformly over a square, mapped onto an octahedron.)
          float n_ = 1.0/7.0; // N=7
          vec3  ns = n_ * D.wyz - D.xzx;

          vec4 j = p - 49.0 * floor(p * ns.z *ns.z);  //  mod(p,N*N)

          vec4 x_ = floor(j * ns.z);
          vec4 y_ = floor(j - 7.0 * x_ );    // mod(j,N)

          vec4 x = x_ *ns.x + ns.yyyy;
          vec4 y = y_ *ns.x + ns.yyyy;
          vec4 h = 1.0 - abs(x) - abs(y);

          vec4 b0 = vec4( x.xy, y.xy );
          vec4 b1 = vec4( x.zw, y.zw );

          vec4 s0 = floor(b0)*2.0 + 1.0;
          vec4 s1 = floor(b1)*2.0 + 1.0;
          vec4 sh = -step(h, vec4(0.0));

          vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
          vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

          vec3 p0 = vec3(a0.xy,h.x);
          vec3 p1 = vec3(a0.zw,h.y);
          vec3 p2 = vec3(a1.xy,h.z);
          vec3 p3 = vec3(a1.zw,h.w);

          // Normalise gradients
          vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
          p0 *= norm.x;
          p1 *= norm.y;
          p2 *= norm.z;
          p3 *= norm.w;

          // Mix final noise value
          vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
          m = m * m;
          return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1),
                                        dot(p2,x2), dot(p3,x3) ) );
          }

          float surface3( vec3 coord ){
            float height	= 0.0;
            coord	*= 0.8;
            height	+= abs(snoise(coord      )) * 1.0;
            height	+= abs(snoise(coord * 2.0)) * 0.5;
            height	+= abs(snoise(coord * 4.0)) * 0.25;
            height	+= abs(snoise(coord * 8.0)) * 0.125;
            height	+= abs(snoise(coord * 35.0)) * 0.035;
            return height;
          }

          vec4 mainImage (float depth) {
            vec4 outC = vec4(0.0);


            vec3 coord	= vec3( vUv, depth );
            coord.x += time * -0.05;

            float height	= surface3( coord + (pow(1.0, 0.7) / 700.0 ) + vec3(0.0, 0.0, depth) );

            height = clamp(height, 0.0, 1.0);
            height = pow(height, 3.5);

            outC = vec4(vec3(height), height);

            return outC;
          }


        void main (void) {
          vec2 uv = gl_FragCoord.xy / resolution.xy;

          // vec3 energy = vec3(
          //   1.0 - pattern(uv * 2.5 + -0.13 * cos(time * 0.2)),
          //   1.0 - pattern(uv * 2.5 +  0.0 * cos(time * 0.2)),
          //   1.0 - pattern(uv * 2.5 +  0.13 * cos(time * 0.2))
          // );

          vec4 cloud = vec4(0.0);

          for (int i = 0; i < 4;i++) {
            cloud += mainImage(float(i) / 3.0) / 2.0;
          }

          // vec4 water = waterwaves(energy, vec2(gl_FragCoord.yy), vec2(resolution.yy), time * 1.0);

          gl_FragColor = vec4(cloud.rgb, 1.0);
        }
      `,
    });

    this.renderTargetPlane.texture.encoding = sRGBEncoding;
    this.renderTargetPlane.texture.mapping = EquirectangularReflectionMapping;
    // this.renderTargetCube.texture.mapping = CubeReflectionMapping
    this.renderTargetCube.texture.mapping = CubeReflectionMapping;
    // this.renderTargetCube.texture.mapping = CubeRefractionMapping;
    this.renderTargetCube.texture.encoding = sRGBEncoding;

    this.renderTargetCube.setup(this.renderer, this.renderTargetPlane.texture);

    this.compute = ({ time, computeEnvMap = true }) => {
      uniforms.time.value = time || window.performance.now() * 0.0001;
      let camera = this.camera;
      let renderer = this.renderer;
      let scene = this.scene;

      // let renderTarget = this.renderTarget
      // var generateMipmaps = renderTargetCube.texture.generateMipmaps
      // renderTargetCube.texture.generateMipmaps = false

      renderer.setRenderTarget(this.renderTargetPlane);
      renderer.render(scene, camera);
      renderer.setRenderTarget(null);

      if (computeEnvMap) {
        this.renderTargetCube.compute();
        return;
      }
    };

    this.plane = new Mesh(this.geo, this.mat);
    this.out = {
      texture: this.renderTargetPlane.texture,
      envMap: this.renderTargetCube.texture,
      material: new MeshBasicMaterial({
        color: 0xffffff,
        side: DoubleSide,
        envMap: this.renderTargetCube.texture,
      }),
    };
    this.scene.add(this.plane);
  }
}
