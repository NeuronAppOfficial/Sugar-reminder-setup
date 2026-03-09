const { app, BrowserWindow, Tray, Menu, nativeImage } = require('electron');
const path = require('path');

// Если приложение запускается установщиком Windows — сразу выходим


let tray = null;
let reminderWindow = null;
let intervalId = null;
let currentIntervalMs = 2 * 60 * 60 * 1000;

function setAutoLaunch() {
    app.setLoginItemSettings({
        openAtLogin: true,
        path: app.getPath('exe')
    });
}

function createReminderWindow() {
    if (reminderWindow && !reminderWindow.isDestroyed()) {
        reminderWindow.close();
    }

    reminderWindow = new BrowserWindow({
        width: 600, height: 200, frame: false, alwaysOnTop: true,
        transparent: false, skipTaskbar: true, center: true, resizable: false,
        webPreferences: { contextIsolation: true }
    });

    const htmlContent = `
        <body style="display:flex; flex-direction:column; justify-content:center; align-items:center; height:100vh; margin:0; font-family: 'Segoe UI', sans-serif; background-color: #000; color: #fff; cursor:pointer; overflow:hidden;" onclick="window.close()">
            <h1 style="margin:0; font-size: 38px; text-transform: uppercase; letter-spacing: 2px; text-shadow: 0 0 15px rgba(255,255,255,0.7), 0 0 30px rgba(255,255,255,0.4); text-align: center;">
                Измерьте сахар в крови
            </h1>
            <p style="color: #444; margin-top: 15px; font-size: 12px; text-transform: uppercase; letter-spacing: 2px;">Нажмите, чтобы скрыть</p>
            <script>
                const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                const beep = (f, s, d) => {
                    const o = audioCtx.createOscillator(); const g = audioCtx.createGain();
                    o.frequency.value = f; g.gain.value = 0.05;
                    o.connect(g); g.connect(audioCtx.destination);
                    o.start(audioCtx.currentTime + s); o.stop(audioCtx.currentTime + s + d);
                };
                beep(440, 0, 0.15); beep(440, 0.25, 0.15);
            </script>
        </body>
    `;
    reminderWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`);
}

function startTimer(ms) {
    if (intervalId) clearInterval(intervalId);
    currentIntervalMs = ms;
    intervalId = setInterval(createReminderWindow, currentIntervalMs);
}

app.whenReady().then(() => {
    const iconPath = path.join(__dirname, 'icon.png');
    let icon = nativeImage.createFromPath(iconPath);
    if (icon.isEmpty()) {
        icon = nativeImage.createFromDataURL('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH5AMXFhkS8v6mXwAAADhJREFUOMtjYBgFoyEEMDAw8DPAAEYGfAb8Z2D4z8DAwMzAwMDJwMDAS6yBf7lkGf7jM+SfgYGBmYmBgeE/ALALBAnv9pYAAAAASUVORK5CYII=');
    }

    tray = new Tray(icon.resize({ width: 16, height: 16 }));
    const contextMenu = Menu.buildFromTemplate([
        { label: '🩸 КОНТРОЛЬ САХАРА', enabled: false },
        { type: 'separator' },
        { label: 'Измерить сейчас', click: () => createReminderWindow() },
        { type: 'separator' },
        { label: 'Интервал: 30 мин', type: 'radio', click: () => startTimer(30 * 60 * 1000) },
        { label: 'Интервал: 1 час', type: 'radio', click: () => startTimer(60 * 60 * 1000) },
        { label: 'Интервал: 2 часа', type: 'radio', checked: true, click: () => startTimer(120 * 60 * 1000) },
        { type: 'separator' },
        { label: 'Выход', click: () => app.quit() }
    ]);

    tray.setToolTip('Напоминание о сахаре');
    tray.setContextMenu(contextMenu);

    setAutoLaunch();
    startTimer(currentIntervalMs);
    createReminderWindow();
});

app.on('window-all-closed', (e) => e.preventDefault());
