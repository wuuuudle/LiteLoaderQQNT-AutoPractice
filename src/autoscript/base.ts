export interface AutoScriptResult {
    isSuccess: boolean; // 调用是否成功
}

export abstract class AutoScript {

    callbackId: string = crypto.randomUUID();

    messageList: string[] = [];

    timeoutId: ReturnType<typeof setTimeout> | null = null;

    resolve?: ((value: AutoScriptResult | PromiseLike<AutoScriptResult>) => void);

    static getName() {
        return 'AutoScript';
    }

    abstract _run(config: Config): Promise<void>;

    abstract _isMyMessage(message: euphony.MessageChain): boolean;

    abstract _process(message: euphony.MessageChain, source: euphony.MessageSource): AutoScriptResult;

    async _Run(config: Config): Promise<AutoScriptResult> {
        setTimeout(async () => {
            await this._run(config);
        }, config.delayTime);
        return await new Promise<AutoScriptResult>((resolve) => {
            this.resolve = resolve;
            this.timeoutId = setTimeout(() => {
                if (this.resolve) {
                    this.resolve({isSuccess: false});
                    this.resolve = undefined;
                }
            }, config.timeoutTime);
        }).finally(() => {
            if (this.timeoutId !== null) {
                clearTimeout(this.timeoutId);
                this.timeoutId = null;
            }
            this.resolve = undefined;
        });
    }

    async Run(config: Config): Promise<AutoScriptResult> {
        let result: AutoScriptResult;
        do {
            result = await this._Run(config);
        } while (result.isSuccess === false); // 调用超时
        return result;
    }

    async ProcessHandle(message: euphony.MessageChain, source: euphony.MessageSource): Promise<boolean> {
        this.messageList = message.contentToString();
        if (this._isMyMessage(message)) {
            if (this.resolve) {
                this.resolve(this._process(message, source));
                this.resolve = undefined;
            }
            return true;
        }
        return false;
    }
}