import * as consts from "./../../consts/consts.js";
import Utils from "./../../libs/utils.js";

class GovernanceComponent extends HTMLElement {
    componentParams = {
      distributed: 0,
      locked: 0,
      available: 0,
      totalSupply: 0,
      distributedStr: '0',
      lockedStr: '0',
      availableStr: '0',
      totalSupplyStr: '0',
      totalGraph: '0',
      distrGraph: '0',
      availGraph: '0'
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
                ${ Utils.numberWithCommas(Utils.formateValue(this.componentParams.totalSupplyStr)) } BEAMX
              </div>
              <div class="governance__title">
                <span>Locked</span>
                <img class="governance__title__icon" src="./icons/icon-info.svg" />
              </div>
              <div class="governance__value">
                ${ Utils.numberWithCommas(Utils.formateValue(this.componentParams.lockedStr)) } BEAMX
              </div>
              <div class="governance__title">
                <span>Available</span>
                <img class="governance__title__icon" src="./icons/icon-info.svg" />  
              </div>
              <div class="governance__value">
                ${ Utils.numberWithCommas(Utils.formateValue(this.componentParams.availableStr)) } BEAMX
              </div>
              <div class="governance__title">Distributed</div>
              <div class="governance__value">
                ${ Utils.numberWithCommas(Utils.formateValue(this.componentParams.distributedStr)) } BEAMX
              </div>
            </div>
            <div class="gov-container__right">
              <span class="gov-graph-supply"> ${ Utils.numberWithSpaces(this.componentParams.totalGraph) }k</span>
              <div class="gov__graph">
                <span class="gov-graph-avail">
                  ${ Utils.numberWithSpaces(this.componentParams.availGraph) }k
                </span>
                <div class="gov__graph__available" id="gov-progress-available"></div>
                <div class="gov__graph__value" id="gov-progress-value">
                  <span class="gov-graph-distr">
                    ${ Utils.numberWithSpaces(this.componentParams.distrGraph) }k
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div class="governance__separator"></div>
          <div class="governance__pkey" id="governance-show-key">Show public key</div>
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
    };
  
    connectedCallback() {
      this.render();
    }
    
    attributeChangedCallback(name, oldValue, newValue) {
      const value = Big(newValue).div(consts.GLOBAL_CONSTS.GROTHS_IN_BEAM);

      if (name === 'total') {
        this.componentParams.totalGraph = Big(newValue).div(consts.GLOBAL_CONSTS.GROTHS_IN_BEAM).div(1000).toFixed(0);
        this.componentParams.totalSupply = newValue;
        this.componentParams.totalSupplyStr = value;
      } else if (name === 'received') {
        this.componentParams.locked = newValue;
        this.componentParams.lockedStr = value;
      } else if (name === 'avail') {
        this.componentParams.availGraph = Big(newValue).div(consts.GLOBAL_CONSTS.GROTHS_IN_BEAM).div(1000).toFixed(0);
        this.componentParams.available = newValue;
        this.componentParams.availableStr = value;
      } else if (name === 'distributed') {
        this.componentParams.distrGraph = Big(newValue).div(consts.GLOBAL_CONSTS.GROTHS_IN_BEAM).div(1000).toFixed(0);
        this.componentParams.distributed = newValue;
        this.componentParams.distributedStr = value;
      }
      this.render();
    }
  
    
    static get observedAttributes() {
      return ['total', 'received', 'avail', 'distributed'];
    }
  }
  
  customElements.define('governance-component', GovernanceComponent);