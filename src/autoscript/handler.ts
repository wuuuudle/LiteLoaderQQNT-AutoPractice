import {AutoScript} from './base';

export function CreateHandler(processors: Record<string, AutoScript>) {
    return async (message: euphony.MessageChain, source: euphony.MessageSource) => {
        const config = await LiteLoader.api.config.get('xiaoxiao_auto_practice') as Config;
        if (config.autoPractice) {
            const concat = source.getContact();
            if ((concat instanceof euphony.Member) &&   // 是成员消息
                (concat.getGroup().getId() === config.groupId) &&  // 是修仙群的消息
                (concat.getId() === config.xiaoxiaoId)) { // 是小小的消息
                const convertMessages = message.contentToString();
                const isAtMe = convertMessages.some(item => item === `@${config.myName}` || `@${euphony.Client.getUid()}`);
                if (isAtMe) {
                    await source.setMsgRead();
                    for (const item of Object.values(processors)) {
                        if (await item.ProcessHandle(message, source)) break;
                    }
                }
            }
        }
    }
}