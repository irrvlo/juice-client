const { app } = require("electron");

function applySwitches(settings) {
  if (settings.remove_useless_features) {
    app.commandLine.appendSwitch("disable-breakpad");
    app.commandLine.appendSwitch("disable-print-preview");
    app.commandLine.appendSwitch("disable-metrics-repo");
    app.commandLine.appendSwitch("disable-metrics");
    app.commandLine.appendSwitch("disable-2d-canvas-clip-aa");
    app.commandLine.appendSwitch("disable-bundled-ppapi-flash");
    app.commandLine.appendSwitch("disable-logging");
    app.commandLine.appendSwitch("disable-hang-monitor");
    app.commandLine.appendSwitch("disable-component-update");
    if (process.platform === "darwin")
      app.commandLine.appendSwitch("disable-dev-shm-usage");
  }
  if (settings.helpful_flags) {
    app.commandLine.appendSwitch("enable-javascript-harmony");
    app.commandLine.appendSwitch("enable-future-v8-vm-features");
    app.commandLine.appendSwitch("enable-webgl");
    app.commandLine.appendSwitch("enable-webgl2-compute-context");
    app.commandLine.appendSwitch("disable-background-timer-throttling");
    app.commandLine.appendSwitch("disable-renderer-backgrounding");
    app.commandLine.appendSwitch("autoplay-policy", "no-user-gesture-required");
    app.commandLine.appendSwitch("enable-lazy-image-loading");
    app.commandLine.appendSwitch("disable-renderer-backgrounding");
    app.commandLine.appendSwitch("disable-background-timer-throttling");
  }
  if (settings.increase_limits) {
    app.commandLine.appendSwitch("renderer-process-limit", "100");
    app.commandLine.appendSwitch("max-active-webgl-contexts", "100");
    app.commandLine.appendSwitch(
      "webrtc-max-cpu-consumption-percentage",
      "100"
    );
  }
  if (settings.low_latency) {
    app.commandLine.appendSwitch("force-high-performance-gpu");
    app.commandLine.appendSwitch("enable-highres-timer");
    app.commandLine.appendSwitch("enable-quic");
    app.commandLine.appendSwitch("enable-accelerated-2d-canvas");
  }
  if (settings.experimental_flags) {
    app.commandLine.appendSwitch("disable-low-end-device-mode");
    app.commandLine.appendSwitch("enable-accelerated-video-decode");
    app.commandLine.appendSwitch("enable-native-gpu-memory-buffers");
    app.commandLine.appendSwitch("no-pings");
    app.commandLine.appendSwitch("no-proxy-server");
  }
  if (settings.gpu_rasterization) {
    app.commandLine.appendSwitch("enable-gpu-rasterization");
    app.commandLine.appendSwitch("enable-oop-rasterization");
    app.commandLine.appendSwitch("disable-zero-copy");
  }
  if (settings.unlimited_fps) {
    app.commandLine.appendSwitch("disable-frame-rate-limit");
    app.commandLine.appendSwitch("disable-gpu-vsync");
    app.commandLine.appendSwitch("max-gum-fps", "9999");
  }
  if (settings.in_process_gpu) {
    app.commandLine.appendSwitch("in-process-gpu");
  }
}

module.exports = {
  applySwitches: applySwitches,
};
