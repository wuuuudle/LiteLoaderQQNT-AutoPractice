import {contextBridge, ipcRenderer} from 'electron';


contextBridge.exposeInMainWorld('AutoPractice', {
    fetchGroupNickName: async (uin: string) => await ipcRenderer.invoke('auto_practice.fetch_group_nick_name', uin),
    fetchMyNameInGroup: async (uin: string) => await ipcRenderer.invoke('auto_practice.fetch_my_name_in_group', uin),
    startAutoPractice: async () => await ipcRenderer.invoke('auto_practice.start_auto_practice'),
    stopAutoPractice: async () => await ipcRenderer.invoke('auto_practice.stop_auto_practice'),
    getAutoPracticeStatus: async () => await ipcRenderer.invoke('auto_practice.get_auto_practice_status'),
});

contextBridge.exposeInMainWorld('AutoPracticeFromMain', {
    fetchGroupNickName: (callback: (event: Electron.IpcRendererEvent, ...args: any[]) => void) => ipcRenderer.on('auto_practice_from_main.fetch_group_nick_name', callback),
    fetchMyNameInGroup: (callback: (event: Electron.IpcRendererEvent, ...args: any[]) => void) => ipcRenderer.on('auto_practice_from_main.fetch_my_name_in_group', callback),
    startAutoPractice: (callback: (event: Electron.IpcRendererEvent, ...args: any[]) => void) => ipcRenderer.on('auto_practice_from_main.start_auto_practice', callback),
    stopAutoPractice: (callback: (event: Electron.IpcRendererEvent, ...args: any[]) => void) => ipcRenderer.on('auto_practice_from_main.stop_auto_practice', callback),
    getAutoPracticeStatus: (callback: (event: Electron.IpcRendererEvent, ...args: any[]) => void) => ipcRenderer.on('auto_practice_from_main.get_auto_practice_status', callback),
});

contextBridge.exposeInMainWorld('AutoPracticeToMain', {
    fetchGroupNickName: (NickName: string) => ipcRenderer.send('auto_practice_to_main.fetch_group_nick_name', NickName),
    fetchMyNameInGroup: (CardName: string) => ipcRenderer.send('auto_practice_to_main.fetch_my_name_in_group', CardName),
    getAutoPracticeStatus: (CardName: string) => ipcRenderer.send('auto_practice_to_main.get_auto_practice_status', CardName),
});