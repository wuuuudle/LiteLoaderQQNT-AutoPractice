import {BrowserWindow, ipcMain} from 'electron';

let mainWindow: BrowserWindow;
ipcMain.handle('auto_practice.fetch_group_nick_name', async (_, arg) => {
    return await new Promise(resolve => {
        ipcMain.once('auto_practice_to_main.fetch_group_nick_name', (_, response) => {
            resolve(response);
        })
        mainWindow.webContents.send('auto_practice_from_main.fetch_group_nick_name', arg);
    });
});

ipcMain.handle('auto_practice.fetch_my_name_in_group', async (_, arg) => {
    return await new Promise(resolve => {
        ipcMain.once('auto_practice_to_main.fetch_my_name_in_group', (_, response) => {
            resolve(response);
        })
        mainWindow.webContents.send('auto_practice_from_main.fetch_my_name_in_group', arg);
    });
})

ipcMain.handle('auto_practice.get_auto_practice_status', async (_) => {
    return await new Promise(resolve => {
        ipcMain.once('auto_practice_to_main.get_auto_practice_status', (_, response) => {
            resolve(response);
        })
        mainWindow.webContents.send('auto_practice_from_main.get_auto_practice_status');
    });
})

ipcMain.handle('auto_practice.start_auto_practice', (_) => {
    mainWindow.webContents.send('auto_practice_from_main.start_auto_practice');
});

ipcMain.handle('auto_practice.stop_auto_practice', (_) => {
    mainWindow.webContents.send('auto_practice_from_main.stop_auto_practice');
});


export const onBrowserWindowCreated = (window: BrowserWindow) => {
    window.webContents.on('did-stop-loading', () => {
        console.log('小小自动修仙已加载');
        // if (window.webContents.getURL().indexOf('#/setting/settings/common') !== -1) {
        if (window.webContents.getURL().indexOf('#/main/message') !== -1) {
            mainWindow = window;
        }
    });
    // hook ipc，调试使用
    // const ipc_message_proxy = window.webContents._events['-ipc-message']?.[0] || window.webContents._events['-ipc-message'];
    // const proxyIpcMsg = new Proxy(ipc_message_proxy, {
    //     apply(target: any, thisArg: any, argArray: any[]): any {
    //         console.log('proxyMsg', JSON.stringify(argArray));
    //         return target.apply(thisArg, argArray);
    //     }
    // });
    //
    // if (window.webContents._events['-ipc-message']?.[0]) {
    //     window.webContents._events['-ipc-message'][0] = proxyIpcMsg;
    // } else {
    //     window.webContents._events['-ipc-message'] = proxyIpcMsg;
    // }
};
