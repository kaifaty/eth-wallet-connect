import { css } from 'lit-element';
export const STYLES = css`
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
        justify-content: center;
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
    }
    button.primary{
        color: var(--mdc-theme-primary, hsl(210, 95%, 50%));
    }
    button{
        font-family: var(--body-font, Arial, sans-serif);
        outline: none;
        border: none;
        background: transparent;
        font-weight: var(--font-button-weight, 600);
        cursor: pointer;
    }`