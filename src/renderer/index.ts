import {AutoScript} from '../autoscript/base';
import {AutoPracticeResult, AutoPracticeScript} from '../autoscript/practice';
import {CreateHandler} from '../autoscript/handler';
import {AutoBreakResult, AutoBreakScript} from '../autoscript/break';

export async function onSettingWindowCreated(view: HTMLElement) {
    let config: Config = {
        groupId: '',
        groupNickName: '',
        myName: '',
        xiaoxiaoId: '3889001741',
        autoPractice: false,
        autoBreak: {use: false, usePill: false},
        timeoutTime: 2 * 60 * 1000,
        delayTime: 1000
    };
    config = await LiteLoader.api.config.get('xiaoxiao_auto_practice', config);

    const pluginPath = LiteLoader.plugins.xiaoxiao_auto_practice.path.plugin;
    view.innerHTML = await (await fetch(`local:///${pluginPath}/pages/settings.html`)).text();

    const groupIdElement = view.querySelector('#groupId') as HTMLInputElement;
    const groupNickNameElement = view.querySelector('#groupNickName') as HTMLDivElement;
    const xiaoxiaoIdElement = view.querySelector('#xiaoxiaoId') as HTMLInputElement;
    const autoPracticeElement = view.querySelector('#auto_practice') as HTMLButtonElement;
    const timeOutElement = view.querySelector('#timeoutTime') as HTMLInputElement;
    const delayTimeElement = view.querySelector('#delayTime') as HTMLInputElement;

    const autoBreakUseElement = view.querySelector('#auto_break_use') as HTMLButtonElement;
    const autoBreakUsePillElement = view.querySelector('#auto_break_use_pill') as HTMLButtonElement;

    {
        // 恢复config
        groupIdElement.value = config.groupId;
        groupNickNameElement.innerText = `群名称: ${config.groupNickName} 我的群名称: ${config.myName}`;
        xiaoxiaoIdElement.value = config.xiaoxiaoId;
        timeOutElement.value = `${config.timeoutTime}`;
        delayTimeElement.value = `${config.delayTime}`;
        config.autoPractice = await AutoPractice.getAutoPracticeStatus();
        if (config.autoPractice) {
            autoPracticeElement.setAttribute('is-active', '');
            groupIdElement.setAttribute('disabled', '');
            xiaoxiaoIdElement.setAttribute('disabled', '');
            timeOutElement.setAttribute('disabled', '');
            delayTimeElement.setAttribute('disabled', '');
            autoBreakUseElement.setAttribute('is-disabled', '');
            autoBreakUsePillElement.setAttribute('is-disabled', '');
        } else if (autoPracticeElement.hasAttribute('is-active')) {
            autoPracticeElement.removeAttribute('is-active');
            groupIdElement.removeAttribute('disabled');
            xiaoxiaoIdElement.removeAttribute('disabled');
            timeOutElement.removeAttribute('disabled');
            delayTimeElement.removeAttribute('disabled');
            autoBreakUseElement.removeAttribute('is-disabled');
            autoBreakUsePillElement.removeAttribute('is-disabled');
        }
        if (config.autoBreak.use)
            autoBreakUseElement.setAttribute('is-active', '');
        else
            autoBreakUseElement.removeAttribute('is-active');

        if (config.autoBreak.usePill)
            autoBreakUsePillElement.setAttribute('is-active', '');
        else
            autoBreakUsePillElement.removeAttribute('is-active');

    }

    groupIdElement.addEventListener('change', async (_) => {
        config.groupId = groupIdElement.value;
        config.groupNickName = await AutoPractice.fetchGroupNickName(groupIdElement.value);
        config.myName = await AutoPractice.fetchMyNameInGroup(groupIdElement.value)
        groupNickNameElement.innerText = `群名称: ${config.groupNickName} 我的群名称: ${config.myName}`;
        await LiteLoader.api.config.set('xiaoxiao_auto_practice', config);
    });

    timeOutElement.addEventListener('change', async (_) => {
        config.timeoutTime = Number(timeOutElement.value);
        await LiteLoader.api.config.set('xiaoxiao_auto_practice', config);
    });

    delayTimeElement.addEventListener('change', async (_) => {
        config.delayTime = Number(delayTimeElement.value);
        await LiteLoader.api.config.set('xiaoxiao_auto_practice', config);
    });

    autoBreakUseElement.addEventListener('click', async () => {
        if (autoBreakUseElement.hasAttribute('is-active')) {
            autoBreakUseElement.removeAttribute('is-active');
            config.autoBreak.use = false;
        } else {
            autoBreakUseElement.setAttribute('is-active', '');
            config.autoBreak.use = true;
        }
        await LiteLoader.api.config.set('xiaoxiao_auto_practice', config);
    });

    autoBreakUsePillElement.addEventListener('click', async () => {
        if (autoBreakUsePillElement.hasAttribute('is-active')) {
            autoBreakUsePillElement.removeAttribute('is-active');
            config.autoBreak.usePill = false;
        } else {
            autoBreakUsePillElement.setAttribute('is-active', '');
            config.autoBreak.usePill = true;
        }
        await LiteLoader.api.config.set('xiaoxiao_auto_practice', config);
    });

    autoPracticeElement.addEventListener('click', async () => {
        if (autoPracticeElement.hasAttribute('is-active')) {
            // 取消自动修炼
            autoPracticeElement.removeAttribute('is-active');
            groupIdElement.removeAttribute('disabled');
            xiaoxiaoIdElement.removeAttribute('disabled');
            timeOutElement.removeAttribute('disabled');
            delayTimeElement.removeAttribute('disabled');
            autoBreakUseElement.removeAttribute('is-disabled');
            autoBreakUsePillElement.removeAttribute('is-disabled');
            config.autoPractice = false;
            await AutoPractice.stopAutoPractice();
        } else {
            // 开始自动修炼
            autoPracticeElement.setAttribute('is-active', '');
            groupIdElement.setAttribute('disabled', '');
            xiaoxiaoIdElement.setAttribute('disabled', '');
            timeOutElement.setAttribute('disabled', '');
            delayTimeElement.setAttribute('disabled', '');
            autoBreakUseElement.setAttribute('is-disabled', '');
            autoBreakUsePillElement.setAttribute('is-disabled', '');
            config.autoPractice = true;
            await AutoPractice.startAutoPractice();
        }
        await LiteLoader.api.config.set('xiaoxiao_auto_practice', config);
    });
    (view.querySelector('#actionNow') as HTMLButtonElement).addEventListener('click', async () => {
        await AutoPractice.startAutoPractice();
    });
}

if (webContentId === 2) // 主页面，注入以下代码
    (async function () {
        const eventChannel = euphony.EventChannel.withTriggers();

        const processors: Record<string, AutoScript> = {};
        let shouldStop: boolean = false;
        eventChannel.subscribeEvent('receive-message', CreateHandler(processors));

        // let break_time_out: number | undefined = undefined;
        // const onceBreak = async (config: Config) => {
        //     await euphony.Group.make(config.groupId)
        //         .sendMessage(
        //             new euphony.MessageChain()
        //                 .append(euphony.At.fromUin(config.xiaoxiaoId))
        //                 .append(new euphony.PlainText(' 直接突破')));
        //     if (break_time_out === undefined)
        //         break_time_out = setInterval(async () => {
        //             await onceBreak(config);
        //         }, 60 * 5 * 1000) as unknown as number;
        // }


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
            new Promise(async (resolve) => {
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
                console.log('Stop Success');
                resolve('Stop Success');
            });
        });

        AutoPracticeFromMain.stopAutoPractice(async () => {
            shouldStop = true;
            Object.keys(processors).forEach(key => {
                delete processors[key];
            });
        })
    }());
