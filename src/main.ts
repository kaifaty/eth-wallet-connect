import "@material/mwc-button";
import "@material/mwc-dialog";
import "@material/mwc-textfield";
import { ethers, Signer } from 'ethers'
import { SVG_IMAGES } from "./icons";
import detectEthereumProvider from '@metamask/detect-provider'
import {LitElement, html, css, property, customElement, query, internalProperty} from "lit-element";
import { unsafeSVG } from 'lit-html/directives/unsafe-svg';
import { translate } from "./translations"
import { Dialog } from "@material/mwc-dialog";
import { TWalletConnectParams, IEthWalletConnect } from './interface';
import { INetworkParams } from './interface';
import { nothing } from 'lit-html';
import { STYLES } from "./styles";

const injected = 'web 3.0 injected';
const PROVIDERS: string[] = ['privateKey', 'keystore', 'walletconnect', injected];
const LOCAL_STORAGE_PROVIDER_NAME = "eth_connect_provider";
const LOCAL_STORAGE_PRIVATEKEY_NAME = "eth_connect_privatekey";
const LOCAL_STORAGE_CONNECTIONPARAMS_NAME = "eth_connect_connectionparams";


const walletconnect = async (params: TWalletConnectParams): Promise<any> => {
    const walletconnect = (await import('@walletconnect/web3-provider')).default;        
    const w3provider = new walletconnect(params);
    await w3provider.enable();
    const provider = new ethers.providers.Web3Provider(w3provider);
    return provider.getSigner();
}

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



@customElement('eth-wallet-connect')
export class EthWalletConnect extends LitElement implements IEthWalletConnect{    
    static styles = STYLES;
    @property({type: Object, attribute: false}) connectionConfig: INetworkParams;
    @property({type: String, attribute: false}) lang: string = 'en';
    @internalProperty() modalContentState: string = 'providers';
    @internalProperty() errorContent: string = '';
    @internalProperty() modalHeader: string = '';
    @internalProperty() wallet: string = '';
    @internalProperty() provider: string = '';
    static get properties(){
        return {
            lang: {type: String}
        }
    }
    
    @query('mwc-dialog') modal: Dialog
    @query('#keystore-file') keystoreFile: HTMLInputElement
    @query('#keystore-password') keystorePassword: HTMLInputElement
    @query('#privatekey-input') privateKeyInput: HTMLInputElement

    networkChangedEventInited: boolean = false;

    get shortWallet(){
        return this.wallet.length > 16 
        ? this.wallet.slice(0, 10) + "..." + this.wallet.slice(-10)
        : this.wallet;
    }

    connectedCallback() {
        super.connectedCallback();
        this._onProviderSelect(localStorage.getItem(LOCAL_STORAGE_PROVIDER_NAME), true);
    }

    /** Signers */
    private async connectInjected(): Promise<Signer>{
        const w3provider: any = await detectEthereumProvider();
        if(!w3provider){
            throw new Error("No injected wallet");
        }
        await w3provider.enable();        
        if(!this.networkChangedEventInited){
            w3provider.on("networkChanged", (e: string) => {
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
            })
            this.networkChangedEventInited = true;
        }
        const provider = new ethers.providers.Web3Provider(w3provider);
        return provider.getSigner();
    }
    private connectPrivateKey(key: string){
        try{
            const signer = new ethers.Wallet(key);
            this._onConnected(signer, 'privateKey', key);
        }
        catch (e){
            this.errorContent = e.message;
        }
    }
    private connectKeyStore(){
        const file_el = this.keystoreFile;
        const password = this.keystorePassword.value.trim();
        const reader = new FileReader();
        reader.onload = async () => {
            try{
                const signer = await ethers.Wallet.fromEncryptedJson(reader.result as string, password);
                this._onConnected(signer, 'privateKey', signer.privateKey);
            }
            catch (e){
                this.errorContent = e.message;
            }
        };
        reader.readAsText(file_el.files[0], "UTF-8");
    }

    /** Events */
    private _onProviderSelect(pr: string, onload?: boolean): void{
        if(!pr) return;
        if(pr === injected){
            this.modalHeader = "";
            this.connectInjected()
                .then(r => this._onConnected(r, pr))
                .catch(e => {
                    this.errorContent = e.message;
                });
        }
        else if(pr === 'walletconnect'){
            this.modalHeader = "";
            if(this.connectionConfig.wallet.walletconnect){
                walletconnect(this.connectionConfig.wallet.walletconnect)
                    .then(r => this._onConnected(r, pr))
                    .catch(e => {});
            }
            else{
                this.errorContent = "No walletconnect params provided";
            }
        }
        else{
            if(pr === "privateKey" && localStorage.getItem(LOCAL_STORAGE_PRIVATEKEY_NAME) && onload){
                this.connectPrivateKey(localStorage.getItem(LOCAL_STORAGE_PRIVATEKEY_NAME));
                return
            }
            this.modalHeader = translate.get(pr, this.lang);
            this.modalContentState = pr;
        }
    }
    private _onBack(){
        this.modalContentState = 'providers'
        this.modalHeader = '';
        this.errorContent = '';

    }
    private _onClose(){
        this.modalContentState = 'providers'
        this.modalHeader = '';
        this.errorContent = '';
    }
    private _onFileChange(e: Event){
        const el = this.shadowRoot.querySelector('.file-chosen');
        // @ts-ignore
        el.textContent = e.target?.value;
    }
    private async _onConnected(signer: Signer, providerName: string, key?: string){
        this.saveProvider(providerName, key);  
        this.provider = providerName;
        this.wallet = await signer.getAddress();
        if(this.modal) this.modal.open = false;

        this.dispatchEvent(new CustomEvent('connected', { detail: 
            { signer, wallet: this.wallet} 
        }));
    }
    private _onconnectPrivateKey(e: CustomEvent){
        this.connectPrivateKey(this.privateKeyInput.value.trim())
    }
    
    
    /** Actions */
    public connect(){
        this.modal.open = true;
    }
    public disconnect(){
        this.dispatchEvent(new CustomEvent('disconnected', {bubbles: true, composed: true}));
        this.removeSavedData();
        this.modal.open = false;
        this.provider = '';
        this.wallet = '';
        this.saveProvider('')
    }
    private saveProvider(provider: string, privateKey?: string){
        localStorage.setItem(LOCAL_STORAGE_PROVIDER_NAME, provider);
        if(privateKey) {
            localStorage.setItem(LOCAL_STORAGE_PRIVATEKEY_NAME, privateKey);
        }
    }
    public removeSavedData(){
        delete localStorage[LOCAL_STORAGE_PROVIDER_NAME];
        delete localStorage[LOCAL_STORAGE_PRIVATEKEY_NAME];
        delete localStorage[LOCAL_STORAGE_CONNECTIONPARAMS_NAME];
    }

    /** Templates */

    private templatePrivateKey(){
        return html`<h5 class="attention">${translate.get("privateKeyAttention", this.lang)}</h5>
        <mwc-textfield id = "privatekey-input" 
                       required
                       label="${translate.get("privateKey", this.lang)}">
        </mwc-textfield>
        <mwc-button @click = "${this._onconnectPrivateKey}" 
                    slot = "primaryAction" 
                    raised >${translate.get("button_connect", this.lang)}</mwc-button>`;
    }
    private templateKeystore(){
        return html`<h5 class = "attention">${translate.get("privateKeyAttention", this.lang)}</h5>
                <input id = "keystore-file"
                       type = "file"
                       @change = "${this._onFileChange}"
                       name = "keystore"
                       hidden>
                <div style="display: flex; align-items: center; justify-content: space-between">
                    <mwc-button @click = "${() => this.keystoreFile.click()}"
                                raised
                                label = "${translate.get("choseFile", this.lang)}"></mwc-button>
                    <mwc-textfield required
                                   password
                                   id = "keystore-password"
                                   label = "${translate.get("password", this.lang)}"></mwc-textfield>
                </div>
                <div>
                    <small class = "file-chosen" style="word-break: break-all;"></small>
                </div>
            <mwc-button @click = "${this.connectKeyStore}"
                        slot = "primaryAction"
                        raised >${translate.get("button_connect", this.lang)}</mwc-button>`;
    }
    private templateSelectProvider(){
        return html`<div class = "wrapper">${PROVIDERS.map(it =>
            html`<button type="submit"
                                 @click="${() => this._onProviderSelect(it)}"
                                 class="provider-card-wrapper">
                            <div class="provider-card">
                                ${unsafeSVG(SVG_IMAGES[it])}
                                <div class="title">${it[0].toUpperCase() + it.slice(1)}</div>
                            </div>
                        </button>`)}
                    </div>`;
    }
    private templateProviderContent(){
        if(this.modalContentState === 'providers'){
            return this.templateSelectProvider();
        }
        else if(this.modalContentState === 'privateKey'){
            return this.templatePrivateKey();
        }
        else if(this.modalContentState === 'keystore'){
            return this.templateKeystore();
        }
    }
    private templateDialogProvider(){
        return html`${this.templateProviderContent()}
                ${
                    this.modalContentState !== "providers" 
                    ? html`<mwc-button @click="${this._onBack}"
                                       slot="secondaryAction">${translate.get('button_back', this.lang)}</mwc-button>`
                    : ""
                }
                ${
                    this.errorContent 
                            ? html `<div class = "error">${this.errorContent}</div>`
                            : ""
                }`
    }
    private templateConnectBtn(){
        return html`<button @click = "${this.connect}"
                            class = "primary button-connect">${translate.get("button_connect", this.lang)}</button>`;
    }
    private templateDisconnectBtn(){        
        return html`<button @click = "${this.disconnect}"
                            class = "primary button-disconnect">${translate.get("button_disconnect", this.lang)}</button>`;
    }
    templateWalletIcon(){
        if(!this.provider || !SVG_IMAGES[this.provider]){
            return nothing;
        }
        return html`
        <div class = "wallet-icon">
            ${unsafeSVG(SVG_IMAGES[this.provider])}
        </div>`;

    }
    render(){        
        return html`        
            <div class = "flex-row-center">
                ${this.templateWalletIcon()}
                <div>
                    <h4 class = "header">${translate.get("wallet", this.lang)}</h4>
                    ${this.shortWallet}
                </div>
            </div>
            <slot></slot>
            <div class = "flex-row-center"
                 style = "margin-top: 20px;">
            ${
                this.wallet 
                ? this.templateDisconnectBtn() 
                : this.templateConnectBtn()
            }
            </div>
            <mwc-dialog heading = "${this.modalHeader}" 
                        @closed = "${this._onClose}">                                                        
                ${this.templateDialogProvider()}
                <mwc-button dialogAction = "close" 
                            slot = "secondaryAction">${translate.get('button_close', this.lang)}</mwc-button>
            </mwc-dialog>
        `;
    }

}

declare global {
    interface HTMLElementTagNameMap {
        'eth-wallet-connect': EthWalletConnect;
    }
}
export * from './interface'