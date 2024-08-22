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

        let practice_time_out: number | undefined = undefined;

        const oncePractice = async (config: Config) => {
            await euphony.Group.make(config.groupId)
                .sendMessage(
                    new euphony.MessageChain()
                        .append(euphony.At.fromUin(config.xiaoxiaoId))
                        .append(new euphony.PlainText(' 修炼')));
            if (practice_time_out === undefined)
                practice_time_out = setInterval(async () => {
                    await oncePractice(config);
                }, 60 * 5 * 1000) as unknown as number;
        }

        let break_time_out: number | undefined = undefined;
        const onceBreak = async (config: Config) => {
            await euphony.Group.make(config.groupId)
                .sendMessage(
                    new euphony.MessageChain()
                        .append(euphony.At.fromUin(config.xiaoxiaoId))
                        .append(new euphony.PlainText(' 直接突破')));
            if (break_time_out === undefined)
                break_time_out = setInterval(async () => {
                    await onceBreak(config);
                }, 60 * 5 * 1000) as unknown as number;
        }

        const messageHandler = (config: Config) => {
            let index = 9;
            return async (message: euphony.MessageChain, source: euphony.MessageSource) => {
                const concat = source.getContact();
                if (concat instanceof euphony.Member) { // 是成员消息
                    if (concat.getGroup().getId() === config.groupId) { // 是修仙群的消息
                        if (concat.getId() === config.xiaoxiaoId) { // 是小小的消息
                            const convertMessages = message.contentToString();
                            const isAtMe = convertMessages.some(item => item === `@${config.myName}` || `@${euphony.Client.getUid()}`);
                            if (isAtMe) { // 是at我的消息
                                await source.setMsgRead();
                                const isPracticeEnd = convertMessages.some(item => item.indexOf('本次修炼') !== -1); // 修炼结束
                                const isBreakEnd = convertMessages.some(item => item.indexOf('突破') !== -1); // 突破结束
                                if (isPracticeEnd) {
                                    // todo: 这里突破判断很粗糙，固定修炼多少次直接突破
                                    clearInterval(practice_time_out);
                                    practice_time_out = undefined;
                                    index = (index + 1) % 10;
                                    if (index === 0) {
                                        await onceBreak(config);
                                    } else {
                                        await oncePractice(config);
                                    }
                                } else if (isBreakEnd) {
                                    clearInterval(break_time_out);
                                    break_time_out = undefined;
                                    await oncePractice(config);
                                }
                            }
                        }
                    }
                }
            };
        }
        let handler: ((message: euphony.MessageChain, source: euphony.MessageSource) => Promise<void>) | null = null;

        // const config = await LiteLoader.api.config.get('xiaoxiao_auto_practice') as Config;
        // handler = messageHandler(config);
        // eventChannel.subscribeEvent('receive-message', handler);


        AutoPracticeFromMain.fetchGroupNickName((_, uin: string) => {
            const name = euphony.Group.make(uin).getName();
            AutoPracticeToMain.fetchGroupNickName(name);
        });

        AutoPracticeFromMain.fetchMyNameInGroup((_, uin: string) => {
            const name = euphony.Group.make(uin).getMemberFromUin(euphony.Client.getUin()).getCardName();
            AutoPracticeToMain.fetchMyNameInGroup(name);
        });

        AutoPracticeFromMain.getAutoPracticeStatus(() => { // true是正在自动修炼，false是没有修炼
            AutoPracticeToMain.getAutoPracticeStatus(handler !== null);
        });

        AutoPracticeFromMain.startAutoPractice(async () => {
            if (handler !== null) {
                eventChannel.unsubscribeEvent('receive-message', handler);
            }
            const config = await LiteLoader.api.config.get('xiaoxiao_auto_practice') as Config;
            handler = eventChannel.subscribeEvent('receive-message', messageHandler(config));
            await oncePractice(config);

        });

        AutoPracticeFromMain.stopAutoPractice(async () => {
            if (handler !== null)
                eventChannel.unsubscribeEvent('receive-message', handler);
            handler = null;
            clearInterval(practice_time_out);
            practice_time_out = undefined;
            clearInterval(break_time_out);
            break_time_out = undefined;
        })

    }());
