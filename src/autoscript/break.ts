import {AutoScript, AutoScriptResult} from './base';

export enum BreakStatus {
    SUCCESS,
    FAILED,
    NOT_ENOUGH
}

export interface AutoBreakResult extends AutoScriptResult {
    status: BreakStatus,
    remainCultivation: number // 剩余修为
}

export class AutoBreakScript extends AutoScript {
    status: BreakStatus = BreakStatus.SUCCESS;
    remainCultivation: number = -1;

    static getName() {
        return 'AutoBreakScript';
    }

    async _run(config: Config) {
        await euphony.Group.make(config.groupId)
            .sendMessage(
                new euphony.MessageChain()
                    .append(euphony.At.fromUin(config.xiaoxiaoId))
                    .append(new euphony.PlainText(config.autoBreak.usePill ? ' 渡厄突破' : ' 直接突破')));
    }

    _isMyMessage(_message: euphony.MessageChain): boolean {
        // 1. 突破成功
        // 道友突破真一境初期成功 length == 7
        if (this.messageList.length === 7) {
            if (this.messageList[6].match(/道友突破(.*?)成功/g)) {
                this.status = BreakStatus.SUCCESS;
                this.remainCultivation = -1;
                return true;
            }
        }
        // 2. 突破失败
        if (this.messageList.length === 6) {
            // 道友突破失败,境界受损,修为减少105911，下次突破成功率增加7%，道友不要放弃！ length == 6
            const matches = this.messageList[5].match(/道友突破失败,境界受损,修为减少(.*?)，/);
            if (matches) {
                this.status = BreakStatus.FAILED;
                this.remainCultivation = Number(matches[1]);
                return true;
            }
            // 道友突破失败，但是使用了丹药渡厄丹，本次突破失败不扣除修为下次突破成功率增加6%，道友不要放弃！ length == 6
            if (this.messageList[5].match(/道友突破失败，但是使用了丹药渡厄丹/g)) {
                this.status = BreakStatus.FAILED;
                this.remainCultivation = -1;
                return true;
            }
        }
        // 3. 未达突破修为
        // 道友的修为不足以突破！距离下次突破需要1248932789修为！突破境界为：混沌境初期\n请道友继续修炼后再来突破 length==4
        if (this.messageList.length === 4) {
            const matches = this.messageList[3].match(/道友的修为不足以突破！距离下次突破需要(.*?)修为/);
            if (matches) {
                this.status = BreakStatus.NOT_ENOUGH;
                this.remainCultivation = Number(matches[1]);
                return true;
            }
        }
        return false;
    }

    _process(_message: euphony.MessageChain, _source: euphony.MessageSource): AutoBreakResult {
        return {isSuccess: true, status: this.status, remainCultivation: this.remainCultivation}
    }
}