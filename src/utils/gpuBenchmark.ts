export function runGPUBenchmark(): Promise<number> {
  return new Promise((resolve) => {
    // 1. Try to initialize a WebGL context
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl") ||
      (canvas.getContext("experimental-webgl") as WebGLRenderingContext);

    if (!gl) {
      // No GPU acceleration available in browser
      resolve(0);
      return;
    }

    // 2. Extract GPU vendor info if permitted by browser
    const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
    if (debugInfo) {
      const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
      console.log("Detected Graphics Card:", renderer);
    }

    // 3. Simple high-intensity fragment shader to stress the GPU cores
    const vsSource = `attribute vec4 position; void main() { gl_Position = position; }`;
    const fsSource = `
      precision mediump float;
      void main() {
        float y = 0.0;
        for (int i = 0; i < 10000; i++) {
          y += sin(float(i) * 0.01);
        }
        gl_FragColor = vec4(y * 0.001, 1.0, 0.0, 1.0);
      }
    `;

    // Compile helper
    const compileShader = (source: string, type: number) => {
      const shader = gl.createShader(type)!;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      return shader;
    };

    const vs = compileShader(vsSource, gl.VERTEX_SHADER);
    const fs = compileShader(fsSource, gl.FRAGMENT_SHADER);
    const program = gl.createProgram()!;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    gl.useProgram(program);

    // Setup geometry buffer to draw across the viewport
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    );

    const positionLoc = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(positionLoc);
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

    // 4. Measure GPU Execution Time across multiple iterations
    const iterations = 50;
    const start = performance.now();

    for (let i = 0; i < iterations; i++) {
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      // Force pipeline flush to make sure GPU completes execution
      gl.finish();
    }

    const end = performance.now();
    const duration = end - start;

    // Return a relative score score (Higher is better)
    const gpuScore = Math.floor((iterations / duration) * 1000);
    resolve(gpuScore);
  });
}
