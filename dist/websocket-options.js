export const CONNECTION_OPTIONS = {
    timeout: 30000,
    // Useful for credentialed urls, e.g: ws://username:password@localhost:8546
    headers: {
        authorization: 'Basic username:password'
    },
    clientConfig: {
        // Useful if requests are large
        maxReceivedFrameSize: 100000000,
        maxReceivedMessageSize: 100000000,
        // Useful to keep a connection alive
        keepalive: true,
        keepaliveInterval: 60000 // ms
    },
    // Enable auto reconnection
    reconnect: {
        auto: true,
        delay: 5000,
        maxAttempts: 5,
        onTimeout: false
    }
};
