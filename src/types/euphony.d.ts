declare namespace euphony {
    declare interface Element {
        elementId: string;
        elementType: number;
    }

    declare interface PlainTextElement extends Element {
        textElement: {
            content: string;
        };
    }

    declare interface AtElement extends Element {
        textElement: {
            atType: number;
            atUid: string;
            atNtUid: string;
        };
    }

    declare interface AtAllElement extends Element {
        textElement: {
            atType: number;
            atNtUid: string;
            content: string;
        };
    }

    declare interface ImageElement extends Element {
        picElement: {
            md5HexStr: string;
            fileSize: number;
            picWidth: number;
            picHeight: number;
            fileName: string;
            sourcePath: string;
            original: boolean;
            picType: number;
            picSubType: number;
            fileUuid: string;
            fileSubId: string;
            thumbFileSize: number;
            summary: string;
        }
    }

    declare interface AudioElement extends Element {
        pttElement: {
            fileName: string;
            filePath: string;
            md5HexStr: string;
            fileSize: number;
            duration: number;
            formatType: number;
            voiceType: number;
            voiceChangeType: number;
            canConvert2Text: boolean;
            waveAmplitudes: number[];
            fileSubId: string;
            playState: number;
            autoConvertText: number;
        }
    }

    declare class SingleMessage {
        static fromNative(element: Element): SingleMessage;

        static getElementType(): number;

        async toElement(): Promise<Element>;
    }

    declare class PlainText extends SingleMessage {
        constructor(content: string);

        getContent(): string;

        async toElement(): Promise<PlainTextElement>;
    }

    declare class Image extends SingleMessage {
        constructor(path: string);

        getPath(): string;

        async toElement(): Promise<ImageElement>;
    }

    declare class Audio extends SingleMessage {
        constructor(path: string, duration: undefined | number = undefined);

        getPath(): string;

        getDuration(): number;

        async toElement(): Promise<AudioElement>;
    }

    declare class At extends SingleMessage {
        constructor(uin: string, uid: string);

        getUin(): string;

        getUid(): string;

        async toElement(): Promise<AtElement>;

        static fromUin(uin: string): At;

        static fromUid(uid: string): At;
    }

    declare class AtAll extends SingleMessage {
        constructor(content: string = '@全体成员');

        getContent(): string;

        async toElement(): Promise<AtAllElement>;
    }

    declare class Raw extends SingleMessage {
        constructor(element: Element);

        getElement(): Element;

        async toElement(): Promise<Element>;
    }

    declare class MessageChain {
        append(value: SingleMessage): MessageChain;

        pop(): MessageChain;

        remove(index: number): MessageChain;

        get(index: number): SingleMessage;

        getList(): SingleMessage[];

        contentToString(): string[];

        async toElements(): Promise<Element[]>;

        static fromNative(elements: Element[]): MessageChain;
    }

    declare interface Peer {
        chatType: number;
        peerUid: string;
        guildId: string;
    }

    declare class Contact {
        constructor(id: string);

        async sendMessage(message: MessageChain | SingleMessage, msgId: undefined | string = undefined): Promise<MessageSource>;

        getId(): string;

        toPeer(): Peer;

        static getCurrentContact(): Contact;

        static getChatType(): number;
    }

    declare class Friend extends Contact {
        constructor(uin: string, uid: string);

        getNative(): Record<string, any>;

        getUid(): string;

        getBirthday(): string;

        getBio(): string;

        getNick(): string;

        getQid(): string;

        getRemark(): string;

        static make(uin: string, uid: string): Friend;

        static fromUin(uin: string): Friend;

        static fromUid(uid: string): Friend;
    }

    declare class Member extends Contact {
        constructor(group: Group, uin: string, uid: string);

        getGroup(): Group;

        getUid(): string;

        getCardName(): string;

        getNick(): string;

        getQid(): string;

        getRemark(): string;

        async setCardName(cardName: string): Promise<void>;

        async mute(duration: number): Promise<void>;

        async unmute(): Promise<void>;

        static make(group: Group, uin: string, uid: string): Member;
    }

    declare class Group extends Contact {
        constructor(id: string);

        getNative(): Record<string, any>;

        getName(): string;

        getMaxMemberCount(): number;

        getMemberCount(): number;

        getRemark(): string;

        getMemberFromUin(uin: string): Member;

        getMemberFromUid(uid: string): Member;

        async getMembers(): Promise<Member[]>;

        static make(id: string): Group;
    }

    declare class MessageSource {
        constructor(msgId: string, contact: Contact);

        getMsgId(): string;

        getContact(): Contact;

        async recall(): Promise<void>;

        async setMsgRead(): Promise<void>;
    }

    declare class EventChannel {
        subscribeEvent(eventName: string, handler: (...arg: any[]) => any): (...arg: any[]) => any;

        unsubscribeEvent(eventName: string, handler: (...arg: any[]) => any);

        call(eventName: string, ...args: any[]): void;

        static withTriggers(): EventChannel;
    }

    declare interface ClientKey {
        key: string; // todo: 不确定是什么类型
        keyIndex: number; // todo: 不确定是什么类型
        expireTime: any; // todo: 暂时不知道是什么类型
        url: string; // todo: 不确定是什么类型
    }

    declare interface LuckyCard {
        id: number; // todo: 不确定是什么类型
        url: string; // todo: 不确定是什么类型
        word: string; // todo: 不确定是什么类型
        description: string; // todo: 不确定是什么类型
    }

    declare class Client {
        static getUin(): string;

        static getUid(): string;

        static getFriends(): Friend[];

        static getGroups(): Group[];

        static async getClientKey(): ClientKey | object;

        static async getPskey(domain: string, clientKey: ClientKey): string | object;

        static async drawLuckyCard(uin: string, pskey: string): LuckyCard | object;

        static isVip(): boolean;

        static isSvip(): boolean;

        static isYearVip(): boolean;
    }

    declare class Cache {
        static withCache(key: any, defaultSupplier: () => any): any;

        static async withCacheAsync(key, defaultSupplier: () => Promise<any>): Promise<any>;
    }

    declare class ChatFuncBar {
        static addLeftButton(icon: string, onClick: EventListenerOrEventListenerObject): void;

        static addRightButton(icon: string, onClick: EventListenerOrEventListenerObject): string;
    }

    declare class Base64Util {
        static encode(value: string): string;

        static decode(value: string): string;
    }
}