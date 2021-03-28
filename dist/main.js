import { __awaiter, __decorate } from "tslib";
import "@material/mwc-button";
import "@material/mwc-dialog";
import "@material/mwc-textfield";
import { ethers } from 'ethers';
import { SVG_IMAGES } from "./icons";
import detectEthereumProvider from '@metamask/detect-provider';
import { LitElement, html, css, property, query, internalProperty } from "lit-element";
import { unsafeSVG } from 'lit-html/directives/unsafe-svg';
import { translate } from "./translations";
import { nothing } from 'lit-html';
const injected = 'web 3.0 injected';
const PROVIDERS = ['privateKey', 'keystore', 'walletconnect', injected];
const LOCAL_STORAGE_PROVIDER_NAME = "eth_connect_provider";
const LOCAL_STORAGE_PRIVATEKEY_NAME = "eth_connect_privatekey";
const LOCAL_STORAGE_CONNECTIONPARAMS_NAME = "eth_connect_connectionparams";
const walletconnect = (params) => __awaiter(void 0, void 0, void 0, function* () {
    const walletconnect = (yield import('@walletconnect/web3-provider')).default;
    const w3provider = new walletconnect(params);
    yield w3provider.enable();
    const provider = new ethers.providers.Web3Provider(w3provider);
    return provider.getSigner();
});
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
export class EthWalletConnect extends LitElement {
    constructor() {
        super(...arguments);
        this.modalContentState = '';
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
    connectInjected() {
        return __awaiter(this, void 0, void 0, function* () {
            const w3provider = yield detectEthereumProvider();
            if (!w3provider) {
                throw new Error("No injected wallet");
            }
            yield w3provider.enable();
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
        });
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
        reader.onload = () => __awaiter(this, void 0, void 0, function* () {
            try {
                const signer = yield ethers.Wallet.fromEncryptedJson(reader.result, password);
                this._onConnected(signer, 'privateKey', signer.privateKey);
            }
            catch (e) {
                this.errorContent = e.message;
            }
        });
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
    _onConnected(signer, providerName, key) {
        return __awaiter(this, void 0, void 0, function* () {
            this.saveProvider(providerName, key);
            this.provider = providerName;
            if (this.modal)
                this.modal.open = false;
            this.dispatchEvent(new CustomEvent('connected', { detail: { signer, wallet: yield signer.getAddress() }
            }));
        });
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
    /** Events */
    /** Contents */
    privateKeyContent() {
        return html `<h5 class="attention">${translate.get("privateKeyAttention")}</h5>
        <mwc-textfield id = "privatekey-input" 
                       required
                       label="${translate.get("privateKey")}">
        </mwc-textfield>
        <mwc-button @click = "${this._onconnectPrivateKey}" 
                    slot = "primaryAction" 
                    raised >${translate.get("button_connect")}</mwc-button>`;
    }
    keystoreContent() {
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
    providerSelectContent() {
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
    rennderDialogProviderContent() {
        if (this.modalContentState === 'providers') {
            return this.providerSelectContent();
        }
        else if (this.modalContentState === 'privateKey') {
            return this.privateKeyContent();
        }
        else if (this.modalContentState === 'keystore') {
            return this.keystoreContent();
        }
    }
    rennderDialogProvider() {
        return html `${this.rennderDialogProviderContent()}
                ${this.modalContentState !== "providers"
            ? html `<mwc-button @click="${this._onBack}"
                                       slot="secondaryAction">${translate.get('button_back')}</mwc-button>`
            : ""}
                ${this.errorContent
            ? html `<div class = "error">${this.errorContent}</div>`
            : ""}`;
    }
    renderDisconnected() {
        return html `<button @click = "${this.connect}"
                            class = "primary button-connect">${translate.get("button_connect")}</button>`;
    }
    renderConnected() {
        return html `<button @click = "${this.disconnect}"
                            class = "primary button-disconnect">${translate.get("button_disconnect")}</button>`;
    }
    /** Templates */
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
            ? this.renderConnected()
            : this.renderDisconnected()}
            </div>
            <mwc-dialog heading = "${this.modalHeader}" 
                        @closed = "${this._onClose}">                                                        
                ${this.rennderDialogProvider()}
                <mwc-button dialogAction = "close" 
                            slot = "secondaryAction">${translate.get('button_close')}</mwc-button>
            </mwc-dialog>
        `;
    }
}
EthWalletConnect.styles = [css `
        :host{
            font-family: var(--body-font, Helvetica, Arial, sans-serif);
            display: block;
        }
        .flex-row{
            display: flex;
        }
        .flex-row-center{
            display: flex;
            align-items: center;
        }
        .header{
            margin: 0;
            font-size: 18px;
        }        
        .wallet-icon{
            border-radius: 20px;
            width: 45px;
            height: 45px;
            margin-right: 10px;
        }
        .wallet-icon svg{
            width: 100%;
            height: 100%;
        }

        .attention {
            margin-top: 0;
            color: #ba0000;
            font-size: 1.1.rem;
        }
        .wallet{
            display: flex;
            align-items: center;
            color: var(--app-text-color);
            font-size: 12px;
            border-radius: 20px;
            text-align: center;
            padding: 0 5px;
        }
        .wallte-short{
            display: flex;
            justify-content: center;
            width: 100%;
        }

        .error {
            margin-top: 10px;
            padding: 5px 10px;
            font-size: 14px;
            background-color: #d70404;
            text-align: center;
            color: #fff;
            word-break: break-all;
        }

        .provider-card-wrapper {
            flex: 1 0 25%;
            min-width: 120px;
            background: none;
            outline: none;
            border: none;
            padding: 2px;
        }

        .provider-card {
            cursor: pointer;
            padding: 20px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            align-items: center;
            height: 120px;
            border-radius: 2px;
            border: 1px solid hsl(340, 20%, 90%);
        }

        .provider-card:hover {
            border: 1px solid hsl(340, 90%, 70%);
        }
        .provider-card .title{
            margin-top: 15px;
        }

        .wrapper {
            display: flex;
            flex-wrap: wrap;
        }`];
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
export * from './interface';
