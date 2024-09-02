import {AutoScript, AutoScriptResult} from './base';

export interface AutoPracticeResult extends AutoScriptResult {
    receiveCultivation: number; // 获得修为数
}

export class AutoPracticeScript extends AutoScript {

    static getName() {
        return 'AutoPracticeScript';
    }

    async _run(config: Config) {
        await euphony.Group.make(config.groupId)
            .sendMessage(
                new euphony.MessageChain()
                    .append(euphony.At.fromUin(config.xiaoxiaoId))
                    .append(new euphony.PlainText(' 修炼')));
    }

    _isMyMessage(_message: euphony.MessageChain): boolean {
        if (this.messageList.length === 6) { // 长度等于6
            const regex = /本次修炼增加(\d+)修为/g
            if (this.messageList[5].match(regex))
                return true;
        }
        return false;
    }

    _process(_message: euphony.MessageChain, _source: euphony.MessageSource): AutoPracticeResult {
        const regex = /本次修炼增加(\d+)修为/
        const match = this.messageList[5].match(regex);
        if (match)
            return {isSuccess: true, receiveCultivation: Number(match[1])};
        return {isSuccess: false, receiveCultivation: -1}
    }
}