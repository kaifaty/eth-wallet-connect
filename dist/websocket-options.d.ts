export declare const CONNECTION_OPTIONS: {
    timeout: number;
    headers: {
        authorization: string;
    };
    clientConfig: {
        maxReceivedFrameSize: number;
        maxReceivedMessageSize: number;
        keepalive: boolean;
        keepaliveInterval: number;
    };
    reconnect: {
        auto: boolean;
        delay: number;
        maxAttempts: number;
        onTimeout: boolean;
    };
};
