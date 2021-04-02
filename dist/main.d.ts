import "@material/mwc-button";
import "@material/mwc-dialog";
import "@material/mwc-textfield";
import { LitElement } from "lit-element";
import { Dialog } from "@material/mwc-dialog";
import { IEthWalletConnect } from './interface';
import { INetworkParams } from './interface';
/** Events
 * @signerUpdate
 *      Signer
 *
 * @changeNetwork
 *      {
 *          network: string
 *          informRequired: string
 *      }
 *
 * @connected
 *      {
 *          signer: Signer
 *          wallet: string
 *      }
 * @disconnected
 *
 */
export declare class EthWalletConnect extends LitElement implements IEthWalletConnect {
    static styles: import("lit-element").CSSResult;
    connectionConfig: INetworkParams;
    modalContentState: string;
    errorContent: string;
    modalHeader: string;
    wallet: string;
    provider: string;
    static get properties(): {
        lang: {
            type: StringConstructor;
        };
    };
    set lang(value: string);
    modal: Dialog;
    keystoreFile: HTMLInputElement;
    keystorePassword: HTMLInputElement;
    privateKeyInput: HTMLInputElement;
    networkChangedEventInited: boolean;
    get shortWallet(): string;
    connectedCallback(): void;
    /** Signers */
    private connectInjected;
    private connectPrivateKey;
    private connectKeyStore;
    /** Events */
    private _onProviderSelect;
    private _onBack;
    private _onClose;
    private _onFileChange;
    private _onConnected;
    private _onconnectPrivateKey;
    /** Actions */
    connect(): void;
    disconnect(): void;
    private saveProvider;
    removeSavedData(): void;
    /** Templates */
    private templatePrivateKey;
    private templateKeystore;
    private templateSelectProvider;
    private templateProviderContent;
    private templateDialogProvider;
    private templateConnectBtn;
    private templateDisconnectBtn;
    templateWalletIcon(): {};
    render(): import("lit-element").TemplateResult;
}
declare global {
    interface HTMLElementTagNameMap {
        'eth-wallet-connect': EthWalletConnect;
    }
}
export * from './interface';
