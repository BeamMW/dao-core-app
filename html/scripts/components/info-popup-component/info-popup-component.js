import Utils from "./../../libs/utils.js";

class InfoPopupComponent extends HTMLElement {
    componentParams = {
      popupType: ''
    }

    constructor() {
      super();
    }

    getTemplate() {
        const TEMPLATE_LOCKED =
        `<div id="info-popup" class="popup-info">
            <span class="popup-info__text">Unlocked on a block-by-block basis</span>
            <img class="popup-info__icon" id="popup-info-lock-cancel" src="./icons/icon-cancel-info.svg" />
        </div>`;

        const TEMPLATE_AVAIL =
        `<div id="info-popup" class="popup-info">
            <span class="popup-info__text">Unlocked but not distributed yet</span>
            <img class="popup-info__icon" id="popup-info-avail-cancel" src="./icons/icon-cancel-info.svg" />
        </div>`;

        const TEMPLATE_KEY =
        `<div id="info-popup" class="popup-info">
            <span class="popup-info__text">The key is used as an identifier <br>on the BeamX blockchain</span>
            <img class="popup-info__icon" id="popup-info-key-cancel" src="./icons/icon-cancel-info.svg" />
        </div>`;

        const TEMPLATE_WEEKLY =
        `<div id="info-popup" class="popup-info weekly">
            <div class="info-popup-content">
                <span class="popup-info__text">The longer you stake for, the higher the reward is</span>
                <img class="popup-info__icon" id="popup-info-weekly-cancel" src="./icons/icon-cancel-info.svg" />
            </div>
            <div class="info-popup__separator"></div>
            <div class="info-popup__rewards">
                <div class="info-popup__rewards__titles">
                    <div class="info-popup-rew-title">Period</div>
                    <div class="info-popup-rew-title">Reward (weekly)</div>
                </div>
                <div class="info-popup__rewards__weekly">
                    <div class="info-popup-rew-value">1 week</div>
                    <div class="info-popup-rew-value">1%</div>
                </div>
                <div class="info-popup__rewards__month">
                    <div class="info-popup-rew-value">1 month</div>
                    <div class="info-popup-rew-value">2%</div>
                </div>
            </div>
        </div>`;

        if (this.componentParams.popupType.length > 0) {
            if (this.componentParams.popupType === 'avail') {
                return TEMPLATE_AVAIL;
            } else if (this.componentParams.popupType === 'locked') {
                return TEMPLATE_LOCKED;
            } else if (this.componentParams.popupType === 'key') {
                return TEMPLATE_KEY;
            } else if (this.componentParams.popupType === 'weekly') {
                return TEMPLATE_WEEKLY;
            }
        } else {
            return '';
        }
    }
  
    render() {
        this.innerHTML = this.getTemplate();

        $(this).show();

        $('#popup-info-lock-cancel').click(() => {
            $('#locked-info-popup').hide();
        });

        $('#popup-info-avail-cancel').click(() => {
            $('#avail-info-popup').hide();
        });

        $('#popup-info-key-cancel').click((ev) => {
            ev.stopPropagation();
            $('#key-info-popup').hide();
        });

        $('#popup-info-weekly-cancel').click((ev) => {
            $('#weekly-info-popup').hide();
        })
    };
  
    connectedCallback() {
      this.render();
    }
    
    attributeChangedCallback(name, oldValue, newValue) {    
        if (name === 'type') {
            this.componentParams.popupType = newValue;
        }

        this.render();
    }
  
    
    static get observedAttributes() {
      return ['type'];
    }
  }

  customElements.define('info-popup-component', InfoPopupComponent);
