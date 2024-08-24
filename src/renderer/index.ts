import {AutoScript} from '../autoscript/base';
import {AutoPracticeScript} from '../autoscript/practice';
import {CreateHandler} from '../autoscript/handler';

export async function onSettingWindowCreated(view: HTMLElement) {
    let config: Config = {
        groupId: '',
        groupNickName: '',
        myName: '',
        xiaoxiaoId: '3889001741',
        auto_practice: false
    };
    config = await LiteLoader.api.config.get('xiaoxiao_auto_practice', config);

    const pluginPath = LiteLoader.plugins.xiaoxiao_auto_practice.path.plugin;
    view.innerHTML = await (await fetch(`local:///${pluginPath}/pages/settings.html`)).text();

    const groupIdElement = view.querySelector('#groupId') as HTMLInputElement;
    const groupNickNameElement = view.querySelector('#groupNickName') as HTMLDivElement;
    const xiaoxiaoIdElement = view.querySelector('#xiaoxiaoId') as HTMLInputElement;
    const autoPracticeElement = view.querySelector('#auto_practice') as HTMLButtonElement;

    {
        // 恢复config
        groupIdElement.value = config.groupId;
        groupNickNameElement.innerText = `群名称: ${config.groupNickName} 我的群名称: ${config.myName}`;
        xiaoxiaoIdElement.value = config.xiaoxiaoId;
        config.auto_practice = await AutoPractice.getAutoPracticeStatus();
        console.log('自动恢复', config.auto_practice);
        if (config.auto_practice) {
            autoPracticeElement.setAttribute('is-active', '');
            groupIdElement.setAttribute('disabled', '');
            xiaoxiaoIdElement.setAttribute('disabled', '');
        } else if (autoPracticeElement.hasAttribute('is-active')) {
            autoPracticeElement.removeAttribute('is-active');
            groupIdElement.removeAttribute('disabled');
            xiaoxiaoIdElement.removeAttribute('disabled');
        }
    }

    groupIdElement.addEventListener('change', async (_) => {
        config.groupId = groupIdElement.value;
        config.groupNickName = await AutoPractice.fetchGroupNickName(groupIdElement.value);
        config.myName = await AutoPractice.fetchMyNameInGroup(groupIdElement.value)
        groupNickNameElement.innerText = `群名称: ${config.groupNickName} 我的群名称: ${config.myName}`;
        await LiteLoader.api.config.set('xiaoxiao_auto_practice', config);
    });
    autoPracticeElement.addEventListener('click', async () => {
        if (autoPracticeElement.hasAttribute('is-active')) {
            // 取消自动修炼
            autoPracticeElement.removeAttribute('is-active');
            groupIdElement.removeAttribute('disabled');
            xiaoxiaoIdElement.removeAttribute('disabled');
            config.auto_practice = false;
            await AutoPractice.stopAutoPractice();
        } else {
            // 开始自动修炼
            autoPracticeElement.setAttribute('is-active', '');
            groupIdElement.setAttribute('disabled', '');
            xiaoxiaoIdElement.setAttribute('disabled', '');
            config.auto_practice = true;
            console.log('调用 AutoPractice.startAutoPractice')
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
            processors[AutoPracticeScript.getName()] = new AutoPracticeScript();
            const config = await LiteLoader.api.config.get('xiaoxiao_auto_practice') as Config;
            const number = await processors[AutoPracticeScript.getName()].Run(config);
            console.log('startAutoPractice', number);
        });

        AutoPracticeFromMain.stopAutoPractice(async () => {
            Object.keys(processors).forEach(key => {
                delete processors[key];
            });
        })
    }());
