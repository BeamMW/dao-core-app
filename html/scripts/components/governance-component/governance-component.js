import * as consts from "./../../consts/consts.js";
import Utils from "./../../libs/utils.js";

class GovernanceComponent extends HTMLElement {
    componentParams = {
      distributed: 0,
      locked: 0,
      available: 0,
      totalSupply: 0,
      distributedStr: '',
      lockedStr: '',
      availableStr: '',
      totalSupplyStr: '',
      totalGraph: '',
      distrGraph: '',
      availGraph: ''
    }
  
    constructor() {
      super();
    }

    getTemplate() {
      const TEMPLATE =
      `<div class="governance">
          <div class="container__header">BEAMX GOVERNANCE</div>
          <div class="gov-container">
            <div class="gov-container__left">
              <div class="governance__title">Total supply</div>
              <div class="governance__value total">
                <span id="gov-total-value">0</span> BEAMX
              </div>
              <div class="governance__title">
                <span>Locked</span>
                <img class="governance__title__icon" id="locked-info" src="./icons/icon-info.svg" />
                <info-popup-component id="locked-info-popup"></info-popup-component>
              </div>
              <div class="governance__value">
                <span id="gov-locked-value">0</span> BEAMX
              </div>
              <div class="governance__title">
                <span>Available</span>
                <img class="governance__title__icon" id="avail-info" src="./icons/icon-info.svg" />
                <info-popup-component id="avail-info-popup"></info-popup-component>
              </div>
              <div class="governance__value">
                <span id="gov-full-avail-value">0</span> BEAMX
              </div>
              <div class="governance__title">Distributed</div>
              <div class="governance__value">
                <span id="gov-distr-full-value">0</span> BEAMX
              </div>
            </div>
            <div class="gov-container__right">
              <span class="gov-graph-supply"> 
                <span id="gov-supply-value">0</span>k
              </span>
              <div class="gov__graph">
                <span class="gov-graph-avail">
                  <span id="gov-avail-value">0</span>k
                </span>
                <div class="gov__graph__available" id="gov-progress-available"></div>
                <div class="gov__graph__value" id="gov-progress-value">
                  <span class="gov-graph-distr">
                    <span id="gov-distr-value">0</span>k
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div class="governance__separator"></div>
          <div class="governance__pkey" id="governance-show-key">
            <span class="governance__pkey__text">Show my public key</span>  
            <img class="governance__pkey__icon" id="key-info" src="./icons/icon-info.svg" />
            <info-popup-component id="key-info-popup"></info-popup-component>
          </div>
      </div>`;

      return TEMPLATE;
    }
  
    render() {
      this.innerHTML = this.getTemplate();

      $('#governance-show-key').click(() => {
        let event = new CustomEvent("global-event", {
          detail: {
            type: 'show-public-key'
          }
        });
        document.dispatchEvent(event);
      });

      this.updateGraph();

      $('#locked-info').click(() => {
          $('#locked-info-popup').attr('type', 'locked');
      });

      $('#avail-info').click(() => {
        $('#avail-info-popup').attr('type', 'avail');
      });

      $('#key-info').click((ev) => {
        ev.stopPropagation();
        $('#key-info-popup').attr('type', 'key');
      });
    };
  
    connectedCallback() {
      this.render();
    }

    updateGraph() {
      const progressWidth = this.componentParams.totalSupply > 0 && this.componentParams.distributed > 0 
        ? Math.ceil($('.gov__graph').height() * 
            (this.componentParams.distributed / this.componentParams.totalSupply)) + 'px'
        : 0;
      $('#gov-progress-value').height(progressWidth);

      const availablePosition = this.componentParams.totalSupply > 0 && this.componentParams.locked > 0
        ? Math.ceil($('.gov__graph').height() *
            (this.componentParams.locked / this.componentParams.totalSupply)) + 'px'
        : 0;
      $('#gov-progress-available').css('margin-bottom', availablePosition);
    }
    
    attributeChangedCallback(name, oldValue, newValue) {
      const value = Big(newValue).div(consts.GLOBAL_CONSTS.GROTHS_IN_BEAM);

      if (name === 'total') {
        this.componentParams.totalGraph = Big(newValue).div(consts.GLOBAL_CONSTS.GROTHS_IN_BEAM).div(1000).toFixed(0);
        this.componentParams.totalSupply = newValue;
        this.componentParams.totalSupplyStr = value;
        $('#gov-total-value').text(Utils.numberWithCommas(Utils.formateValue(this.componentParams.totalSupplyStr)));
        $('#gov-supply-value').text(Utils.numberWithCommas(this.componentParams.totalGraph));
      } else if (name === 'received') {
        this.componentParams.locked = newValue;
        this.componentParams.lockedStr = value;
        $('#gov-locked-value').text(Utils.numberWithCommas(Utils.formateValue(this.componentParams.lockedStr)));
      } else if (name === 'avail') {
        this.componentParams.availGraph = Big(newValue).div(consts.GLOBAL_CONSTS.GROTHS_IN_BEAM).div(1000).toFixed(0);
        this.componentParams.available = newValue;
        this.componentParams.availableStr = value;
        $('#gov-avail-value').text(Utils.numberWithCommas(this.componentParams.availGraph));
        $('#gov-full-avail-value').text(Utils.numberWithCommas(Utils.formateValue(this.componentParams.availableStr)));
      } else if (name === 'distributed') {
        this.componentParams.distrGraph = Big(newValue).div(consts.GLOBAL_CONSTS.GROTHS_IN_BEAM).div(1000).toFixed(0);
        this.componentParams.distributed = newValue;
        this.componentParams.distributedStr = value;
        $('#gov-distr-value').text(Utils.numberWithCommas(this.componentParams.distrGraph));
        $('#gov-distr-full-value').text(Utils.numberWithCommas(Utils.formateValue(this.componentParams.distributedStr)));
      }

      this.updateGraph();
    }
  
    
    static get observedAttributes() {
      return ['total', 'received', 'avail', 'distributed'];
    }
  }
  
  customElements.define('governance-component', GovernanceComponent);