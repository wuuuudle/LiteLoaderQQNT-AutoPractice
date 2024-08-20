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
        } else if (autoPracticeElement.hasAttribute('is-active')) {
            autoPracticeElement.removeAttribute('is-active');
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
            config.auto_practice = false;
            await AutoPractice.stopAutoPractice();
        } else {
            // 开始自动修炼
            autoPracticeElement.setAttribute('is-active', '');
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

        const oncePractice = async (config: Config) => {
            await euphony.Group.make(config.groupId)
                .sendMessage(
                    new euphony.MessageChain()
                        .append(euphony.At.fromUin(config.xiaoxiaoId))
                        .append(new euphony.PlainText(' 修炼')));
        }

        const messageHandler = (config: Config) => {
            return async (message: euphony.MessageChain, source: euphony.MessageSource) => {
                const concat = source.getContact();
                if (concat instanceof euphony.Member) { // 是成员消息
                    if (concat.getGroup().getId() === config.groupId) { // 是修仙群的消息
                        if (concat.getId() === config.xiaoxiaoId) { // 是小小的消息
                            const messageList = message.getList();
                            const filterMessageList = messageList
                                .filter(item => item instanceof euphony.PlainText)
                                .map(item => item as euphony.PlainText);
                            const convertMessages = filterMessageList.map(item => item.getContent());
                            const isAtMe = convertMessages.some(item => item === `@${config.myName}`);
                            if (isAtMe) { // 是at我的消息
                                const isPracticeEnd = convertMessages.some(item => item.indexOf('本次修炼') !== -1);
                                if (isPracticeEnd) {
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
            const config = await LiteLoader.api.config.get('xiaoxiao_auto_practice') as Config;
            handler = messageHandler(config);
            eventChannel.subscribeEvent('receive-message', handler);
            await oncePractice(config);
        });

        AutoPracticeFromMain.stopAutoPractice(async () => {
            if (handler !== null)
                eventChannel.unsubscribeEvent('receive-message', handler);
            handler = null;
        })

    }());
