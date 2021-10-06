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
          <div class="governance__title">Total supply</div>
          <div class="governance__value total">
            <span id="gov-total-value">0</span> BEAMX
          </div>
          <div class="gov-container">
            <div class="gov-container__left">
              <div class="governance__title">Distributed</div>
              <div class="governance__value">
                <span id="gov-distr-full-value">0</span> BEAMX
              </div>
              <div class="governance__title">
                <span>Available</span>
                <img class="governance__title__icon" id="avail-info" src="./icons/icon-info.svg" />
                <info-popup-component id="avail-info-popup"></info-popup-component>
              </div>
              <div class="governance__value">
                <span id="gov-full-avail-value">0</span> BEAMX
              </div>
              <div class="governance__title">
                <span>Locked</span>
                <img class="governance__title__icon" id="locked-info" src="./icons/icon-info.svg" />
                <info-popup-component id="locked-info-popup"></info-popup-component>
              </div>
              <div class="governance__value">
                <span id="gov-locked-value">0</span> BEAMX
              </div>
            </div>
            <div class="gov-container__right">
              <span class="gov-graph-supply-top gov-graph-text"> 
                <span id="gov-supply-value-top"></span>
              </span>
              <div class="gov__graph">
                <span class="gov-graph-supply gov-graph-text"> 
                  <span id="gov-supply-value"></span>
                </span>
                <div class="gov__graph__available" id="gov-progress-available">
                  <span class="gov-graph-aval gov-graph-text"> 
                    <span id="gov-avail-value"></span>
                  </span>
                </div>
                <div class="gov__graph__value" id="gov-progress-value">
                  <span class="gov-graph-aval-inside"> 
                    <span id="gov-avail-value-inside"></span>
                  </span>
                  <span class="gov-graph-distr">
                    <span id="gov-distr-value"></span>
                  </span>
                </div>
              </div>
              <span class="gov-graph-distr-bottom gov-graph-text">
                <span id="gov-distr-value-bottom"></span>
              </span>
            </div>
          </div>
          <div class="governance__separator"></div>
          <div class="governance__pkey" id="governance-show-key">
            <span class="governance__pkey__text">Show my public key</span>
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

      $('#locked-info').click((ev) => {
        $('info-popup-component').hide();
        $('#locked-info-popup').attr('type', 'locked');
        ev.stopPropagation();
      });

      $('#avail-info').click((ev) => {
        $('info-popup-component').hide();
        $('#avail-info-popup').attr('type', 'avail');
        ev.stopPropagation();
      });
    };
  
    connectedCallback() {
      this.render();
    }

    nFormatter(num, digits) {
      const lookup = [
        { value: 1, symbol: "" },
        { value: 1e3, symbol: "k" },
        { value: 1e6, symbol: "M" }
      ];
      const rx = /\.0+$|(\.[0-9]*[1-9])0+$/;
      var item = lookup.slice().reverse().find(function(item) {
        return num >= item.value;
      });
      return item ? (num / item.value).toFixed(digits).replace(rx, "$1") + item.symbol : "0";
    }

    updateGraph() {
      const elemHeight = $('.gov__graph').height();
      const progressHeight = this.componentParams.distributed > 0 
        ? Math.ceil(elemHeight * 
            (this.componentParams.locked / this.componentParams.totalSupply))
        : 0;

      if (progressHeight <= 18) {
        $('.gov-graph-distr-bottom').show();
        $('.gov-graph-distr').hide();
      } else {
        $('.gov-graph-distr-bottom').hide();
        $('.gov-graph-distr').show();
      }
      $('#gov-progress-value').height(progressHeight + 'px');

      const distrPosition = this.componentParams.totalSupply > 0 && this.componentParams.locked > 0
        ? Math.ceil(elemHeight *
            (this.componentParams.distributed / this.componentParams.totalSupply))
        : 0;
      if (distrPosition <= 18) {
        $('.gov-graph-supply-top').show();
        $('.gov-graph-supply').hide();
      } else {
        $('.gov-graph-supply-top').hide();
        $('.gov-graph-supply').show();
      }
      
      const availDist = (elemHeight - (distrPosition + progressHeight));

      if (availDist == 0) {
        $('.gov-graph-aval-inside').hide();
        $('.gov-graph-aval').hide();
      } else {
        if (availDist <= 18) {
          $('.gov-graph-aval').css('margin-top', '-16px');
          if (distrPosition <= 36) {
            $('.gov-graph-aval').hide();
            $('.gov-graph-aval-inside').show();
          } else {
            $('.gov-graph-aval').show();
            $('.gov-graph-aval-inside').hide();
          }
        } else {
          $('.gov-graph-aval-inside').hide();
          $('.gov-graph-aval').show();
        }
      }

      $('#gov-progress-available').css('margin-top', distrPosition + 'px');
    }
    
    attributeChangedCallback(name, oldValue, newValue) {
      const value = Big(newValue).div(consts.GLOBAL_CONSTS.GROTHS_IN_BEAM);

      if (name === 'total') {
        this.componentParams.totalGraph = parseFloat(Big(newValue).div(consts.GLOBAL_CONSTS.GROTHS_IN_BEAM));
        this.componentParams.totalSupply = newValue;
        this.componentParams.totalSupplyStr = value;
        $('#gov-total-value').text(Utils.numberWithCommas(Utils.formateValue(this.componentParams.totalSupplyStr)));        
      } else if (name === 'locked') {
        this.componentParams.lockedGraph = parseFloat(Big(newValue).div(consts.GLOBAL_CONSTS.GROTHS_IN_BEAM));
        this.componentParams.locked = newValue;
        this.componentParams.lockedStr = value;
        $('#gov-locked-value').text(Utils.numberWithCommas(Utils.formateValue(this.componentParams.lockedStr)));
        $('#gov-distr-value').text(this.nFormatter(this.componentParams.lockedGraph, 2));
        $('#gov-distr-value-bottom').text(this.nFormatter(this.componentParams.lockedGraph, 2));
      } else if (name === 'avail') {
        this.componentParams.availGraph = parseFloat(Big(newValue).div(consts.GLOBAL_CONSTS.GROTHS_IN_BEAM));
        this.componentParams.available = newValue;
        this.componentParams.availableStr = value;
        $('#gov-avail-value').text(this.nFormatter(this.componentParams.availGraph, 2));
        $('#gov-avail-value-inside').text(this.nFormatter(this.componentParams.availGraph, 2));
        $('#gov-full-avail-value').text(Utils.numberWithCommas(Utils.formateValue(this.componentParams.availableStr)));
      } else if (name === 'distributed') {
        this.componentParams.distrGraph = parseFloat(Big(newValue).div(consts.GLOBAL_CONSTS.GROTHS_IN_BEAM));
        this.componentParams.distributed = newValue;
        this.componentParams.distributedStr = value;
        $('#gov-distr-full-value').text(Utils.numberWithCommas(Utils.formateValue(this.componentParams.distributedStr)));
        $('#gov-supply-value').text(this.nFormatter(this.componentParams.distrGraph, 2));
        $('#gov-supply-value-top').text(this.nFormatter(this.componentParams.distrGraph, 2));
      }

      this.updateGraph();
    }
  
    
    static get observedAttributes() {
      return ['total', 'locked', 'avail', 'distributed'];
    }
  }
  
  customElements.define('governance-component', GovernanceComponent);