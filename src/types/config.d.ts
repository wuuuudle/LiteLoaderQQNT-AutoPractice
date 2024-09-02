interface BreakConfig {
    use: boolean,
    usePill: boolean
}

interface Config {
    myName: string;
    groupId: string;
    groupNickName: string;
    xiaoxiaoId: string;
    autoPractice: boolean;
    autoBreak: BreakConfig;
    timeoutTime: number;
    delayTime: number;
}