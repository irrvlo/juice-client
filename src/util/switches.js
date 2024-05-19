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
  }
  if (settings.helpful_flags) {
    app.commandLine.appendSwitch("enable-webgl");
    app.commandLine.appendSwitch("enable-webgl2-compute-context");
    app.commandLine.appendSwitch("disable-background-timer-throttling");
    app.commandLine.appendSwitch("disable-renderer-backgrounding");
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
    app.commandLine.appendSwitch("enable-quic");
  }
  if (settings.experimental_flags) {
    app.commandLine.appendSwitch("enable-accelerated-video-decode");
  }
  if (settings.gpu_rasterization) {
    app.commandLine.appendSwitch("enable-gpu-rasterization");
    app.commandLine.appendSwitch("disable-zero-copy");
  }
  if (settings.unlimited_fps) {
    app.commandLine.appendSwitch("disable-frame-rate-limit");
    app.commandLine.appendSwitch("disable-gpu-vsync");
  }
  if (settings.in_process_gpu) {
    app.commandLine.appendSwitch("in-process-gpu");
  }

  app.commandLine.appendSwitch("high-dpi-support", "1");
  app.commandLine.appendSwitch("ignore-gpu-blacklist");
  app.allowRendererProcessReuse = true;
}

module.exports = {
  applySwitches,
};
