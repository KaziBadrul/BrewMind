// src/utils/benchmark.ts

export interface BenchmarkResults {
  cpuScore: number;
  gpuScore: number;
  memoryEstimate: number;
  tier: "high" | "mid" | "low";
  recommendedModel: {
    name: string;
    tag: string;
    description: string;
    size: string;
  };
}

// 1. CPU Synthetic Workload (Floating Point Matrix Ops)
const testCPU = async (): Promise<number> => {
  return new Promise((resolve) => {
    const start = performance.now();
    let operations = 0;

    // Run an intensive loop for exactly 1 second
    while (performance.now() - start < 1000) {
      for (let i = 0; i < 10000; i++) {
        Math.sqrt(Math.random() * Math.random());
        operations++;
      }
    }

    // Normalize score (Operations per millisecond)
    resolve(Math.floor(operations / 1000));
  });
};

// 2. GPU Synthetic Workload (WebGL Fragment Shader)
const testGPU = async (): Promise<number> => {
  return new Promise((resolve) => {
    try {
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl");
      if (!gl) return resolve(0); // Fallback if WebGL is blocked

      const vertexShaderSource = `
        attribute vec2 position;
        void main() { gl_Position = vec4(position, 0.0, 1.0); }
      `;

      // A computationally heavy shader (Mandelbrot fractal logic)
      const fragmentShaderSource = `
        precision highp float;
        void main() {
          vec2 c = vec2(gl_FragCoord.x / 500.0, gl_FragCoord.y / 500.0);
          vec2 z = c;
          float iters = 0.0;
          for (int i = 0; i < 500; i++) {
            z = vec2(z.x*z.x - z.y*z.y, 2.0*z.x*z.y) + c;
            if (dot(z, z) > 4.0) break;
            iters++;
          }
          gl_FragColor = vec4(iters/500.0, 0.0, 0.0, 1.0);
        }
      `;

      const vs = gl.createShader(gl.VERTEX_SHADER)!;
      gl.shaderSource(vs, vertexShaderSource);
      gl.compileShader(vs);

      const fs = gl.createShader(gl.FRAGMENT_SHADER)!;
      gl.shaderSource(fs, fragmentShaderSource);
      gl.compileShader(fs);

      const program = gl.createProgram()!;
      gl.attachShader(program, vs);
      gl.attachShader(program, fs);
      gl.linkProgram(program);
      gl.useProgram(program);

      const buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
        gl.STATIC_DRAW,
      );

      const position = gl.getAttribLocation(program, "position");
      gl.enableVertexAttribArray(position);
      gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

      const start = performance.now();
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      // Force the GPU to finish rendering so we can measure exact time
      gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4));
      const end = performance.now();

      // Lower time is better. Normalize to a high score = good.
      const timeTaken = end - start;
      const score = Math.max(0, 10000 - timeTaken * 100);

      // Cleanup
      gl.getExtension("WEBGL_lose_context")?.loseContext();

      resolve(Math.floor(score));
    } catch {
      resolve(0);
    }
  });
};

export const runComprehensiveBenchmark = async (
  onProgress: (phase: string, progress: number) => void,
): Promise<BenchmarkResults> => {
  onProgress("Checking System Memory...", 10);
  // Browsers cap this at 8GB for privacy, so if it's 8, it means 8+
  const memoryEstimate: number =
    "deviceMemory" in navigator
      ? (navigator as Navigator & { deviceMemory?: number }).deviceMemory || 4
      : 4;
  await new Promise((r) => setTimeout(r, 500));

  onProgress("Running CPU Matrix Simulation...", 30);
  const cpuScore = await testCPU();

  onProgress("Executing GPU Compute Shaders...", 60);
  const gpuScore = await testGPU();

  onProgress("Compiling Recommendations...", 90);
  await new Promise((r) => setTimeout(r, 500));

  // --- CALIBRATION LOGIC ---
  // Note: These thresholds require tuning based on your specific user base,
  // but they serve as an excellent baseline.

  let tier: "high" | "mid" | "low";
  let recommendedModel;

  if (gpuScore > 8000 && cpuScore > 8000 && memoryEstimate >= 8) {
    tier = "high";
    recommendedModel = {
      name: "Llama 3 (8B)",
      tag: "llama3",
      description:
        "Meta's flagship model. Unmatched reasoning capabilities for local hardware. Requires strong memory bandwidth.",
      size: "4.7 GB",
    };
  } else if (gpuScore > 4000 || cpuScore > 5000) {
    tier = "mid";
    recommendedModel = {
      name: "Phi-3 Mini (3.8B)",
      tag: "phi3",
      description:
        "Microsoft's highly optimized model. Punches way above its weight class with incredibly low VRAM requirements.",
      size: "2.3 GB",
    };
  } else {
    tier = "low";
    recommendedModel = {
      name: "Qwen 2.5 (1.5B)",
      tag: "qwen2.5:1.5b",
      description:
        "Lightning fast, lightweight model designed to run smoothly on integrated graphics and older CPUs without stuttering.",
      size: "1.0 GB",
    };
  }

  onProgress("Done", 100);

  return { cpuScore, gpuScore, memoryEstimate, tier, recommendedModel };
};
