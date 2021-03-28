export declare type TWalletConnectParams = {
    "rpc"?: {
        [key: number]: string;
    };
    "infuraId"?: string;
};
export interface IW3wcParams {
    walletconnect?: TWalletConnectParams;
    ws?: string;
    http?: string;
}
export interface INetworkParams {
    "networks": TNetworks;
    "chainIds": {
        [key: string]: string;
    };
    "wallet": {
        "walletconnect": {
            "rpc": {
                "1": string;
            };
        };
    };
}
export declare type TNetworks = {
    "mainnet": INetworkItemParams;
    [key: string]: INetworkItemParams;
};
export interface INetworkItemParams {
    "ws"?: string;
    "http"?: string;
    "symbol": string;
    "explorer": string;
    "name": string;
    "chainId": number;
}
