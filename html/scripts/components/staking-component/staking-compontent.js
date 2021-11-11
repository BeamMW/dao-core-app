import * as consts from "./../../consts/consts.js";
import Utils from "./../../libs/utils.js";

class StakingComponent extends HTMLElement {
  componentParams = {
    beam: 0,
    beamx: 0,
    beamxStr: '',
    beamStr: '0',
    rate: 0,
    beamTotalLockedStr: '0',
    beamTotalLocked: 0,
    loaded: false,
    yeildStr: ''
  }

  constructor() {
    super();
  }

  getTemplate() {    
    const TEMPLATE_LOADING = 
      `<div class="staking" id="staking-component"></div>`;

    const TEMPLATE = 
      `<div class="staking">
          <div class="staking__header">
            <div class="container__header">STAKING</div>
            <div class="staking__header__info">
              <div class="info-tvl">
                <div class="info-title">Total value locked</div>
                <div class="info-tvl__value">
                  <span id="beam-total-value">
                    ${Utils.numberWithCommas(this.componentParams.beamTotalLockedStr)}
                  </span> BEAM
                </div>
                <div class="info-tvl__rate" id="beam-total-value-rate">0 USD</div>
              </div>
              <div class="info-arp-w" id="my-weekly">
                <div class="info-arp-w__container">
                  <span class="info-title">My weekly reward</span>
                  <img class="info-arp-w__container__icon" style="display: none;" id="weekly-info" src="./icons/icon-info.svg" />
                  <info-popup-component id="weekly-info-popup"></info-popup-component>
                </div>
                <div class="info-arp-w__value" id="staking-weekly-yeild">0 BEAMX</div>
              </div>
            </div>
          </div>
          <div class="staking-content" id="staking-component-elem">
              <div class="staking__deposit">
                  <div class="staking__deposit__total">
                      <div class="container-title">Balance</div>
                      <div class="total-container">
                          <img class="total-container__icon" src="./icons/icon-beam.svg">
                          <div class="total-container__value">
                              <div class="total-container__value__beam">
                                <span id="beam-value">
                                  ${(Utils.numberWithCommas(this.componentParams.beamStr))}
                                </span> BEAM
                              </div>
                              <div class="total-container__value__usd" id="beam-value-rate">0 USD</div>
                          </div>
                      </div>
                  </div>
                  <div class="staking__deposit__controls">
                      <div class="deposit-control" id="deposit">
                          <img class="deposit__icon" src="./icons/icon-send.svg"/>
                          <span class="deposit__text">deposit</span>
                      </div>
                      <div class="withdraw-control" id="withdraw">
                          <img class="withdraw__icon" src="./icons/icon-receive.svg"/>
                          <span class="withdraw__text">withdraw</span>
                      </div>
                  </div>
              </div>
              <div class="staking__separator"></div>
              <div class="staking__farmed" id="staking-farmed-claim">
                <div class="container-title">Farmed</div>
                <div class="staking__farmed__container">
                <div class="farmed-value">
                  <img class="farmed-value__beamx-icon" src="./icons/icon-beamx.svg"/>
                  <span class="farmed-value__beamx-amount">
                    <span id="beamx-value">
                      ${Utils.numberWithCommas(this.componentParams.beamxStr)}
                    </span> BEAMX
                  </span>
                </div>
                <div class="farmed-claim" id="staking-claim-rewards">
                  <img class="farmed-claim__icon" src="./icons/icon-star.svg">
                  <span class="farmed-claim__text">claim rewards</span>
                </div>
                </div>
              </div>
              <div class="staking__farmed" id="staking-farmed-empty">
                <div class="staking__farmed__container empty-farmed">  
                  <div class="farmed-empty-text">You have nothing farmed yet.</div>
                </div>
              </div>
          </div>
          <div class="staking-content-empty" id="staking-component-empty">
              <div class="staking-empty__text">Deposit your BEAM and get BEAMX</div>
              <div>
                  <button class="staking-empty__deposit-button ui-button" id="empty-deposit">
                      <span class="ui-button__inner-wrapper">
                          <div class="ui-button__icon">
                              <img src="./icons/icon-send-blue.svg"/>
                          </div>
                          <span class="ui-button__text">deposit</span>
                      </span>
                  </button>
              </div>
          </div>
      </div>`;

      return this.componentParams.loaded > 0
        ? TEMPLATE
        : TEMPLATE_LOADING;
  }

  beamxAreaCheck() {
    if (this.componentParams.beamx > 0) { 
      $('#staking-farmed-claim').show();
      $('#staking-farmed-empty').hide();
    } else {
      $('#staking-farmed-claim').hide();
      $('#staking-farmed-empty').show();
    }
  }

  beamComponentCheck() {
    if (this.componentParams.beam > 0 || this.componentParams.beamx > 0) { 
      $('#staking-component-elem').show();
      $('#staking-component-empty').hide();
      $('#my-weekly').show();
    } else {
      $('#staking-component-elem').hide();
      $('#staking-component-empty').show();
      $('#my-weekly').hide();
    }
  }

  render() {
    this.innerHTML = this.getTemplate();
    $('#staking-farmed-claim').hide();
    $('#staking-component-empty').hide()
    $('#staking-farmed-empty').hide();
    $('#staking-component-elem').hide();

    this.beamxAreaCheck();
    this.beamComponentCheck();

    $('#withdraw').click((ev) => {
      ev.stopPropagation();
      let event = new CustomEvent("global-event", {
        detail: {
          type: 'page',
          to: 'staking-page',
          activeSelector: 'WITHDRAW'
        }
      });
      document.dispatchEvent(event);
    });

    $('#staking-claim-rewards').click((ev) => {
      const component = $('claim-rewards-popup-component');
      component.attr('is_allocation', 0);
      component.attr('value_str', this.componentParams.beamxStr);
      component.attr('value', this.componentParams.beamx);
    });

    $('#empty-deposit, #deposit').click((ev) => {
      let event;
      if (Utils.isMobile()) {
        event = new CustomEvent("global-event", {
          detail: {
            type: 'deposit-mobile-open',
          }
        });  
      } else {
        event = new CustomEvent("global-event", {
          detail: {
            type: 'deposit-popup-open',
          }
        });
      }
      document.dispatchEvent(event);
    })

    $('#weekly-info').click((ev) => {
      $('info-popup-component').hide();
      $('#weekly-info-popup').attr('type', 'weekly');
      ev.stopPropagation();
    });

    $('#withdraw').click((ev) => {
      let event;
      if (Utils.isMobile()) {
        event = new CustomEvent("global-event", {
          detail: {
            type: 'withdraw-mobile-open',
            is_allocation: false
          }
        });
      } else {
        event = new CustomEvent("global-event", {
          detail: {
            type: 'withdraw-popup-open',
            is_allocation: false
          }
        });
      }
      document.dispatchEvent(event);
    })

    if (this.componentParams.loaded) {
      $('#weekly-info').show();
    }
  };

  connectedCallback() {
    this.render();
  }
  
  triggerCalcYeild() {
    let event = new CustomEvent("global-event", {
      detail: {
        type: 'calc-yeild',
        from: 'staking',
        amount: this.componentParams.beam,
        hPeriod: consts.GLOBAL_CONSTS.WEEKLY_BLOCKS_AMOUNT
      }
    });
    document.dispatchEvent(event);
  }

  attributeChangedCallback(name, oldValue, newValue) {
    let value = Big(newValue).div(consts.GLOBAL_CONSTS.GROTHS_IN_BEAM);
    if (name === 'beam-value') {
      this.componentParams.beam = newValue;
      this.componentParams.beamStr = Utils.formateValue(value);
      $('#beam-value').text(Utils.numberWithCommas(this.componentParams.beamStr));
      $('#beam-value-rate').text(Utils.getRateStr(this.componentParams.beamStr, this.componentParams.rate));
      this.beamComponentCheck();
    } else if (name === 'beamx-value') {
      this.componentParams.beamx = newValue;
      this.componentParams.beamxStr = Utils.formateValue(value);
      this.beamxAreaCheck();
      $('#beamx-value').text(Utils.numberWithCommas(this.componentParams.beamxStr));
    } else if (name === 'loaded') {
      this.componentParams.loaded = newValue;

      this.triggerCalcYeild();
      this.render();
    } else if (name === 'rate') {
      this.componentParams.rate = newValue;
      $('#beam-total-value-rate').text(Utils.getRateStr(this.componentParams.beamTotalLockedStr, this.componentParams.rate));
      $('#beam-value-rate').text(Utils.getRateStr(this.componentParams.beamStr, this.componentParams.rate));
    } else if (name === 'beam_total_locked') {
      this.componentParams.beamTotalLocked = newValue;
      this.componentParams.beamTotalLockedStr = Utils.formateValue(value);
      this.triggerCalcYeild();
      $('#beam-total-value').text(Utils.numberWithCommas(this.componentParams.beamTotalLockedStr));
      $('#beam-total-value-rate').text(Utils.getRateStr(this.componentParams.beamTotalLockedStr, this.componentParams.rate));
    } else if (name === 'yeild') {
      const yeild= Big(newValue).div(consts.GLOBAL_CONSTS.GROTHS_IN_BEAM);
          
      this.componentParams.yeildStr = (parseFloat(yeild) > 0 
          ? Utils.numberWithCommas(Utils.formateValue(yeild)) 
          : '0') + ' BEAMX';
      $('#staking-weekly-yeild').text(this.componentParams.yeildStr);
    }
  }

  
  static get observedAttributes() {
    return ['beam-value', 'beamx-value', 'loaded', 'rate', 'beam_total_locked', 'yeild'];
  }
}

customElements.define('staking-component', StakingComponent);