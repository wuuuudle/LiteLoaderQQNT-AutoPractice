declare namespace AutoPractice {
    const fetchGroupNickName: (uin: string) => Promise<string>;
    const fetchMyNameInGroup: (uin: string) => Promise<string>;
    const startAutoPractice: () => Promise<void>;
    const stopAutoPractice: () => Promise<void>;
    const getAutoPracticeStatus: () => Promise<boolean>;
}

declare namespace AutoPracticeToMain {
    const fetchGroupNickName: (NickName: string) => void;
    const fetchMyNameInGroup: (CardName: string) => void;
    const getAutoPracticeStatus: (status: boolean) => void;
}

declare namespace AutoPracticeFromMain {
    const fetchGroupNickName: (callback: (event: Electron.IpcRendererEvent, ...args: any[]) => void) => void;
    const startAutoPractice: (callback: (event: Electron.IpcRendererEvent, ...args: any[]) => void) => void;
    const stopAutoPractice: (callback: (event: Electron.IpcRendererEvent, ...args: any[]) => void) => void;
    const fetchMyNameInGroup: (callback: (event: Electron.IpcRendererEvent, ...args: any[]) => void) => void;
    const getAutoPracticeStatus: (callback: (event: Electron.IpcRendererEvent, ...args: any[]) => void) => void;
}