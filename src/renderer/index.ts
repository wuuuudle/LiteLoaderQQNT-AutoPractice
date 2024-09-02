import {main} from './main';

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
            autoPracticeElement.setAttribute('is-disabled', '');
            await AutoPractice.stopAutoPractice();
            autoPracticeElement.removeAttribute('is-disabled');
            autoPracticeElement.removeAttribute('is-active');
            groupIdElement.removeAttribute('disabled');
            xiaoxiaoIdElement.removeAttribute('disabled');
            timeOutElement.removeAttribute('disabled');
            delayTimeElement.removeAttribute('disabled');
            autoBreakUseElement.removeAttribute('is-disabled');
            autoBreakUsePillElement.removeAttribute('is-disabled');
            config.autoPractice = false;
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
    main();