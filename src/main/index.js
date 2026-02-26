const { app, BrowserWindow, dialog } = require("electron");
const { createMainWindow } = require("./window");
const { registerIpcHandlers } = require("./ipc");
const { getTrialStatus, TRIAL_DAYS } = require("./trialGuard");

function bootstrap() {
  registerIpcHandlers();

  app.whenReady().then(() => {
    const trial = getTrialStatus();
    if (trial.expired) {
      dialog.showErrorBox(
        "Hết thời gian sử dụng",
        `Ứng dụng đã hết hạn sau ${TRIAL_DAYS} ngày kể từ lúc cài đặt. Vui lòng liên hệ để gia hạn.`
      );
      app.quit();
      return;
    }

    createMainWindow();

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
    });
  });

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
  });
}

bootstrap();
