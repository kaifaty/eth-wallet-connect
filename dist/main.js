import { __decorate } from "tslib";
import "@material/mwc-button";
import "@material/mwc-dialog";
import "@material/mwc-textfield";
import { ethers } from 'ethers';
import { SVG_IMAGES } from "./icons";
import detectEthereumProvider from '@metamask/detect-provider';
import { LitElement, html, property, customElement, query, internalProperty } from "lit-element";
import { unsafeSVG } from 'lit-html/directives/unsafe-svg';
import { translate } from "./translations";
import { nothing } from 'lit-html';
import { STYLES } from "./styles";
const injected = 'web 3.0 injected';
const PROVIDERS = ['privateKey', 'keystore', 'walletconnect', injected];
const LOCAL_STORAGE_PROVIDER_NAME = "eth_connect_provider";
const LOCAL_STORAGE_PRIVATEKEY_NAME = "eth_connect_privatekey";
const LOCAL_STORAGE_CONNECTIONPARAMS_NAME = "eth_connect_connectionparams";
const walletconnect = async (params) => {
    const walletconnect = (await import('@walletconnect/web3-provider')).default;
    const w3provider = new walletconnect(params);
    await w3provider.enable();
    const provider = new ethers.providers.Web3Provider(w3provider);
    return provider.getSigner();
};
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
let EthWalletConnect = class EthWalletConnect extends LitElement {
    constructor() {
        super(...arguments);
        this.modalContentState = 'providers';
        this.errorContent = '';
        this.modalHeader = '';
        this.wallet = '';
        this.provider = '';
        this.networkChangedEventInited = false;
    }
    static get properties() {
        return {
            lang: { type: String }
        };
    }
    set lang(value) {
        translate.lang = value;
        this.requestUpdate();
    }
    get shortWallet() {
        return this.wallet.length > 16
            ? this.wallet.slice(0, 10) + "..." + this.wallet.slice(-10)
            : this.wallet;
    }
    connectedCallback() {
        super.connectedCallback();
        this._onProviderSelect(localStorage.getItem(LOCAL_STORAGE_PROVIDER_NAME), true);
    }
    /** Signers */
    async connectInjected() {
        const w3provider = await detectEthereumProvider();
        if (!w3provider) {
            throw new Error("No injected wallet");
        }
        await w3provider.enable();
        if (!this.networkChangedEventInited) {
            w3provider.on("networkChanged", (e) => {
                this.dispatchEvent(new CustomEvent("signerUpdate", {
                    detail: (new ethers.providers.Web3Provider(w3provider)).getSigner(),
                    composed: true,
                    bubbles: true,
                }));
                this.dispatchEvent(new CustomEvent("changeNetwork", {
                    detail: {
                        network: this.connectionConfig.chainIds[e],
                        informRequired: false
                    },
                    composed: true,
                    bubbles: true,
                }));
            });
            this.networkChangedEventInited = true;
        }
        const provider = new ethers.providers.Web3Provider(w3provider);
        return provider.getSigner();
    }
    connectPrivateKey(key) {
        try {
            const signer = new ethers.Wallet(key);
            this._onConnected(signer, 'privateKey', key);
        }
        catch (e) {
            this.errorContent = e.message;
        }
    }
    connectKeyStore() {
        const file_el = this.keystoreFile;
        const password = this.keystorePassword.value.trim();
        const reader = new FileReader();
        reader.onload = async () => {
            try {
                const signer = await ethers.Wallet.fromEncryptedJson(reader.result, password);
                this._onConnected(signer, 'privateKey', signer.privateKey);
            }
            catch (e) {
                this.errorContent = e.message;
            }
        };
        reader.readAsText(file_el.files[0], "UTF-8");
    }
    /** Events */
    _onProviderSelect(pr, onload) {
        if (!pr)
            return;
        if (pr === injected) {
            this.modalHeader = "";
            this.connectInjected()
                .then(r => this._onConnected(r, pr))
                .catch(e => {
                this.errorContent = e.message;
            });
        }
        else if (pr === 'walletconnect') {
            this.modalHeader = "";
            if (this.connectionConfig.wallet.walletconnect) {
                walletconnect(this.connectionConfig.wallet.walletconnect)
                    .then(r => this._onConnected(r, pr))
                    .catch(e => { });
            }
            else {
                this.errorContent = "No walletconnect params provided";
            }
        }
        else {
            if (pr === "privateKey" && localStorage.getItem(LOCAL_STORAGE_PRIVATEKEY_NAME) && onload) {
                this.connectPrivateKey(localStorage.getItem(LOCAL_STORAGE_PRIVATEKEY_NAME));
                return;
            }
            this.modalHeader = translate.get(pr);
            this.modalContentState = pr;
        }
    }
    _onBack() {
        this.modalContentState = 'providers';
        this.modalHeader = '';
        this.errorContent = '';
    }
    _onClose() {
        this.modalContentState = 'providers';
        this.modalHeader = '';
        this.errorContent = '';
    }
    _onFileChange(e) {
        var _a;
        const el = this.shadowRoot.querySelector('.file-chosen');
        // @ts-ignore
        el.textContent = (_a = e.target) === null || _a === void 0 ? void 0 : _a.value;
    }
    async _onConnected(signer, providerName, key) {
        this.saveProvider(providerName, key);
        this.provider = providerName;
        this.wallet = await signer.getAddress();
        if (this.modal)
            this.modal.open = false;
        this.dispatchEvent(new CustomEvent('connected', { detail: { signer, wallet: this.wallet }
        }));
    }
    _onconnectPrivateKey(e) {
        this.connectPrivateKey(this.privateKeyInput.value.trim());
    }
    /** Actions */
    connect() {
        this.modal.open = true;
    }
    disconnect() {
        this.dispatchEvent(new CustomEvent('disconnected', { bubbles: true, composed: true }));
        this.removeSavedData();
        this.modal.open = false;
        this.provider = '';
        this.wallet = '';
        this.saveProvider('');
    }
    saveProvider(provider, privateKey) {
        localStorage.setItem(LOCAL_STORAGE_PROVIDER_NAME, provider);
        if (privateKey) {
            localStorage.setItem(LOCAL_STORAGE_PRIVATEKEY_NAME, privateKey);
        }
    }
    removeSavedData() {
        delete localStorage[LOCAL_STORAGE_PROVIDER_NAME];
        delete localStorage[LOCAL_STORAGE_PRIVATEKEY_NAME];
        delete localStorage[LOCAL_STORAGE_CONNECTIONPARAMS_NAME];
    }
    /** Templates */
    templatePrivateKey() {
        return html `<h5 class="attention">${translate.get("privateKeyAttention")}</h5>
        <mwc-textfield id = "privatekey-input" 
                       required
                       label="${translate.get("privateKey")}">
        </mwc-textfield>
        <mwc-button @click = "${this._onconnectPrivateKey}" 
                    slot = "primaryAction" 
                    raised >${translate.get("button_connect")}</mwc-button>`;
    }
    templateKeystore() {
        return html `<h5 class = "attention">${translate.get("privateKeyAttention")}</h5>
                <input id = "keystore-file"
                       type = "file"
                       @change = "${this._onFileChange}"
                       name = "keystore"
                       hidden>
                <div style="display: flex; align-items: center; justify-content: space-between">
                    <mwc-button @click = "${() => this.keystoreFile.click()}"
                                raised
                                label = "${translate.get("choseFile")}"></mwc-button>
                    <mwc-textfield required
                                   password
                                   id = "keystore-password"
                                   label = "${translate.get("password")}"></mwc-textfield>
                </div>
                <div>
                    <small class = "file-chosen" style="word-break: break-all;"></small>
                </div>
            <mwc-button @click = "${this.connectKeyStore}"
                        slot = "primaryAction"
                        raised >${translate.get("button_connect")}</mwc-button>`;
    }
    templateSelectProvider() {
        return html `<div class = "wrapper">${PROVIDERS.map(it => html `<button type="submit"
                                 @click="${() => this._onProviderSelect(it)}"
                                 class="provider-card-wrapper">
                            <div class="provider-card">
                                ${unsafeSVG(SVG_IMAGES[it])}
                                <div class="title">${it[0].toUpperCase() + it.slice(1)}</div>
                            </div>
                        </button>`)}
                    </div>`;
    }
    templateProviderContent() {
        if (this.modalContentState === 'providers') {
            return this.templateSelectProvider();
        }
        else if (this.modalContentState === 'privateKey') {
            return this.templatePrivateKey();
        }
        else if (this.modalContentState === 'keystore') {
            return this.templateKeystore();
        }
    }
    templateDialogProvider() {
        return html `${this.templateProviderContent()}
                ${this.modalContentState !== "providers"
            ? html `<mwc-button @click="${this._onBack}"
                                       slot="secondaryAction">${translate.get('button_back')}</mwc-button>`
            : ""}
                ${this.errorContent
            ? html `<div class = "error">${this.errorContent}</div>`
            : ""}`;
    }
    templateConnectBtn() {
        return html `<button @click = "${this.connect}"
                            class = "primary button-connect">${translate.get("button_connect")}</button>`;
    }
    templateDisconnectBtn() {
        return html `<button @click = "${this.disconnect}"
                            class = "primary button-disconnect">${translate.get("button_disconnect")}</button>`;
    }
    templateWalletIcon() {
        if (!this.provider || !SVG_IMAGES[this.provider]) {
            return nothing;
        }
        return html `
        <div class = "wallet-icon">
            ${unsafeSVG(SVG_IMAGES[this.provider])}
        </div>`;
    }
    render() {
        return html `        
            <div class = "flex-row-center">
                ${this.templateWalletIcon()}
                <div>
                    <h4 class = "header">${translate.get("wallet")}</h4>
                    ${this.shortWallet}
                </div>
            </div>
            <slot></slot>
            <div class = "flex-row-center"
                 style = "margin-top: 20px;">
            ${this.wallet
            ? this.templateDisconnectBtn()
            : this.templateConnectBtn()}
            </div>
            <mwc-dialog heading = "${this.modalHeader}" 
                        @closed = "${this._onClose}">                                                        
                ${this.templateDialogProvider()}
                <mwc-button dialogAction = "close" 
                            slot = "secondaryAction">${translate.get('button_close')}</mwc-button>
            </mwc-dialog>
        `;
    }
};
EthWalletConnect.styles = STYLES;
__decorate([
    property({ type: Object, attribute: false })
], EthWalletConnect.prototype, "connectionConfig", void 0);
__decorate([
    internalProperty()
], EthWalletConnect.prototype, "modalContentState", void 0);
__decorate([
    internalProperty()
], EthWalletConnect.prototype, "errorContent", void 0);
__decorate([
    internalProperty()
], EthWalletConnect.prototype, "modalHeader", void 0);
__decorate([
    internalProperty()
], EthWalletConnect.prototype, "wallet", void 0);
__decorate([
    internalProperty()
], EthWalletConnect.prototype, "provider", void 0);
__decorate([
    query('mwc-dialog')
], EthWalletConnect.prototype, "modal", void 0);
__decorate([
    query('#keystore-file')
], EthWalletConnect.prototype, "keystoreFile", void 0);
__decorate([
    query('#keystore-password')
], EthWalletConnect.prototype, "keystorePassword", void 0);
__decorate([
    query('#privatekey-input')
], EthWalletConnect.prototype, "privateKeyInput", void 0);
EthWalletConnect = __decorate([
    customElement('eth-wallet-connect')
], EthWalletConnect);
export { EthWalletConnect };
export * from './interface';
