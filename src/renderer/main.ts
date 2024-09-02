import {AutoScript} from '../autoscript/base';
import {CreateHandler} from '../autoscript/handler';
import {AutoPracticeResult, AutoPracticeScript} from '../autoscript/practice';
import {AutoBreakResult, AutoBreakScript} from '../autoscript/break';

export function main() {
    const eventChannel = euphony.EventChannel.withTriggers();

    const processors: Record<string, AutoScript> = {};
    let shouldStop: boolean = false;
    eventChannel.subscribeEvent('receive-message', CreateHandler(processors));

    AutoPracticeFromMain.fetchGroupNickName((_, uin: string) => {
        const name = euphony.Group.make(uin).getName();
        AutoPracticeToMain.fetchGroupNickName(name);
    });

    AutoPracticeFromMain.fetchMyNameInGroup((_, uin: string) => {
        const name = euphony.Group.make(uin).getMemberFromUin(euphony.Client.getUin()).getCardName();
        AutoPracticeToMain.fetchMyNameInGroup(name);
    });

    AutoPracticeFromMain.getAutoPracticeStatus(() => { // true是正在自动修炼，false是没有修炼
        AutoPracticeToMain.getAutoPracticeStatus(
            Object
                .values(processors)
                .filter(item => item instanceof AutoPracticeScript).length != 0);
    });

    AutoPracticeFromMain.startAutoPractice(async () => {
        shouldStop = false;
        const config = await LiteLoader.api.config.get('xiaoxiao_auto_practice') as Config;
        // 准备处理器
        processors[AutoPracticeScript.getName()] = new AutoPracticeScript();
        if (config.autoBreak.use)
            processors[AutoBreakScript.getName()] = new AutoBreakScript();

        // eslint-disable-next-line no-async-promise-executor
        new Promise(async () => {
            let remain = -1;
            if (config.autoBreak.use)
                do {
                    const breaks = await processors[AutoBreakScript.getName()].Run(config) as AutoBreakResult;
                    remain = breaks.remainCultivation;
                } while (remain < 0);
            while (true) {
                if (shouldStop)
                    break;

                const config = await LiteLoader.api.config.get('xiaoxiao_auto_practice') as Config;
                if (config.autoBreak.use) {
                    if (remain < 0) {
                        // remain 小于0，突破
                        const breaks = await processors[AutoBreakScript.getName()].Run(config) as AutoBreakResult;
                        remain = breaks.remainCultivation;
                    } else {
                        // 修为不足，修炼
                        const practices = await processors[AutoPracticeScript.getName()].Run(config) as AutoPracticeResult;
                        remain = remain - practices.receiveCultivation;
                    }
                } else {
                    // 不管剩余修为多少，只修炼
                    await processors[AutoPracticeScript.getName()].Run(config);
                }
            }
            AutoPracticeToMain.stopAutoPractice('停止成功');
            Object.keys(processors).forEach(key => {
                delete processors[key];
            });
        });
    });

    AutoPracticeFromMain.stopAutoPractice(async () => {
        shouldStop = true;
    })
}